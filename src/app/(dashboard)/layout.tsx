"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import BottomTabBar from "@/components/layout/BottomTabBar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { firebaseUser, loading } = useAuth();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!firebaseUser) {
        router.replace("/login");
      } else {
        setReady(true);
      }
    }
    // 3초 이상 로딩이면 로그인으로
    const timeout = setTimeout(() => {
      if (!ready) router.replace("/login");
    }, 3000);
    return () => clearTimeout(timeout);
  }, [firebaseUser, loading, router, ready]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white">
        <img src="/logo.png" alt="매화유치원" className="w-40 mx-auto animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto pb-20">
        {children}
      </div>
      <BottomTabBar />
    </div>
  );
}
