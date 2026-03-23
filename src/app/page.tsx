"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function LandingPage() {
  const { firebaseUser, loading } = useAuth();
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    // 로그인 되어있으면 홈으로
    if (!loading && firebaseUser) {
      setRedirecting(true);
      router.replace("/home");
      return;
    }
    // 로딩 끝났는데 로그인 안 되어있으면 로그인으로
    if (!loading && !firebaseUser) {
      router.replace("/login");
      return;
    }
    // 2초 이상 로딩이면 그냥 로그인으로 보내기
    const timeout = setTimeout(() => {
      if (!redirecting) {
        router.replace("/login");
      }
    }, 2000);
    return () => clearTimeout(timeout);
  }, [firebaseUser, loading, router, redirecting]);

  // 스플래시 화면 (최대 2초만 표시)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white">
      <div className="text-center">
        <img src="/logo.png" alt="매화유치원" className="w-52 mx-auto mb-4 animate-pulse" />
      </div>
    </div>
  );
}
