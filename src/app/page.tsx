"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function LandingPage() {
  const { firebaseUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (firebaseUser) {
        router.replace("/home");
      } else {
        router.replace("/login");
      }
    }
  }, [firebaseUser, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <img src="/logo.png" alt="매화유치원" className="w-52 mx-auto mb-4" />
        <p className="text-gray-500 mb-6">우리 아이 독서 기록 서비스</p>
        <LoadingSpinner text="로딩중..." />
      </div>
    </div>
  );
}
