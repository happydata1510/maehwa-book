"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function LandingPage() {
  const { firebaseUser, loading } = useAuth();
  const router = useRouter();
  const [forced, setForced] = useState(false);

  // 1.5초 후 강제로 로그인 페이지 이동 (Firebase가 안 되더라도)
  useEffect(() => {
    const t = setTimeout(() => setForced(true), 1500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (loading && !forced) return;
    router.replace(firebaseUser ? "/home" : "/login");
  }, [firebaseUser, loading, forced, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white">
      <img src="/logo.png" alt="매화유치원" className="w-52 mx-auto" />
    </div>
  );
}
