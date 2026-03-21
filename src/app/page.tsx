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
        <h1 className="text-4xl font-bold text-green-600 mb-2">
          매화유치원 책대장
        </h1>
        <p className="text-gray-500 mb-8">우리 아이 독서 기록 서비스</p>
        <LoadingSpinner text="로딩중..." />
      </div>
    </div>
  );
}
