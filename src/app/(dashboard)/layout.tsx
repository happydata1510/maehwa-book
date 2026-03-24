"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import BottomTabBar from "@/components/layout/BottomTabBar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { firebaseUser, userData, loading } = useAuth();
  const router = useRouter();

  // Auth 로딩 완료 후 로그인 안 되어있으면 리다이렉트
  useEffect(() => {
    if (!loading && !firebaseUser) {
      router.replace("/login");
    }
  }, [firebaseUser, loading, router]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto pb-20">
        {children}
      </div>
      {userData && <BottomTabBar />}
    </div>
  );
}
