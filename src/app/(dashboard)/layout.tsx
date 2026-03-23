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
  const { firebaseUser, loading } = useAuth();
  const router = useRouter();

  // 로딩 완료 후 로그인 안 되어있으면 리다이렉트
  useEffect(() => {
    if (!loading && !firebaseUser) {
      router.replace("/login");
    }
  }, [firebaseUser, loading, router]);

  // 로딩 중이어도 페이지를 바로 보여줌 (스피너 없음)
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto pb-20">
        {children}
      </div>
      {firebaseUser && <BottomTabBar />}
    </div>
  );
}
