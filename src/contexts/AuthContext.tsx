"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { User, UserRole } from "@/types";
import { DEMO_MODE, DEMO_ACCOUNTS } from "@/lib/demo-data";
import { Timestamp } from "firebase/firestore";

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
  const [loading, setLoading] = useState(!DEMO_MODE);

  useEffect(() => {
    if (DEMO_MODE) return;

    // 실제 Firebase 모드
    let unsubscribe: (() => void) | undefined;
    (async () => {
      const { onAuthStateChanged } = await import("firebase/auth");
      const { auth } = await import("@/lib/firebase/config");
      const { doc, getDoc } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase/config");

      unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          setFirebaseUser({ uid: user.uid, email: user.email, displayName: user.displayName });
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setUserData({ uid: user.uid, ...userDoc.data() } as User);
          }
        } else {
          setFirebaseUser(null);
          setUserData(null);
        }
        setLoading(false);
      });
    })();

    return () => {
      if (unsubscribe) unsubscribe();
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

    const { signInWithEmailAndPassword } = await import("firebase/auth");
    const { auth } = await import("@/lib/firebase/config");
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

    const { createUserWithEmailAndPassword, updateProfile } = await import("firebase/auth");
    const { doc, setDoc, serverTimestamp } = await import("firebase/firestore");
    const { auth } = await import("@/lib/firebase/config");
    const { db } = await import("@/lib/firebase/config");

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

  const signOut = async () => {
    if (DEMO_MODE) {
      setFirebaseUser(null);
      setUserData(null);
      return;
    }
    const { signOut: firebaseSignOut } = await import("firebase/auth");
    const { auth } = await import("@/lib/firebase/config");
    await firebaseSignOut(auth);
    setUserData(null);
  };

  return (
    <AuthContext.Provider
      value={{ firebaseUser, userData, loading, signIn, signUp, signOut }}
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
