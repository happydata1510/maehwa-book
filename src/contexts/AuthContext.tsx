"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { Timestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";
import { User, UserRole } from "@/types";
import { DEMO_MODE, DEMO_ACCOUNTS } from "@/lib/demo-data";

interface AuthContextType {
  firebaseUser: { uid: string; email: string | null; displayName: string | null } | null;
  userData: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    displayName: string,
    role: UserRole,
    kindergartenId: string
  ) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<AuthContextType["firebaseUser"]>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (DEMO_MODE) {
      setLoading(false);
      return;
    }

    // 안전장치: 1초 후에도 응답 없으면 loading 해제
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 1000);

    let unsubscribeFn: (() => void) | null = null;

    try {
      unsubscribeFn = onAuthStateChanged(auth, async (user) => {
        clearTimeout(timeout);
        if (user) {
          setFirebaseUser({ uid: user.uid, email: user.email, displayName: user.displayName });
          try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
              setUserData({ uid: user.uid, ...userDoc.data() } as User);
            } else {
              setUserData({
                uid: user.uid,
                email: user.email || "",
                displayName: user.displayName || "",
                role: "parent",
                kindergartenId: "maehwa",
                linkedChildIds: [],
                createdAt: Timestamp.now(),
              });
            }
          } catch (error) {
            console.error("Failed to get user data:", error);
          }
        } else {
          setFirebaseUser(null);
          setUserData(null);
        }
        setLoading(false);
      });
    } catch (error) {
      console.error("Firebase auth init error:", error);
      clearTimeout(timeout);
      setLoading(false);
    }

    return () => {
      clearTimeout(timeout);
      if (unsubscribeFn) unsubscribeFn();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    if (DEMO_MODE) {
      const account = DEMO_ACCOUNTS.find(
        (a) => a.email === email && a.password === password
      );
      if (account) {
        setFirebaseUser({
          uid: account.user.uid,
          email: account.user.email,
          displayName: account.user.displayName,
        });
        setUserData(account.user);
        return;
      }
      throw new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
    }

    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (
    email: string,
    password: string,
    displayName: string,
    role: UserRole,
    kindergartenId: string
  ) => {
    if (DEMO_MODE) {
      const newUser: User = {
        uid: `user-${Date.now()}`,
        email,
        displayName,
        role,
        kindergartenId: kindergartenId || "maehwa",
        linkedChildIds: [],
        createdAt: Timestamp.now(),
      };
      setFirebaseUser({ uid: newUser.uid, email, displayName });
      setUserData(newUser);
      return;
    }

    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName });
    await setDoc(doc(db, "users", credential.user.uid), {
      email,
      displayName,
      role,
      kindergartenId,
      linkedChildIds: [],
      createdAt: serverTimestamp(),
    });
  };

  const handleSignOut = async () => {
    if (DEMO_MODE) {
      setFirebaseUser(null);
      setUserData(null);
      return;
    }
    await firebaseSignOut(auth);
    setUserData(null);
  };

  return (
    <AuthContext.Provider
      value={{ firebaseUser, userData, loading, signIn, signUp, signOut: handleSignOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
