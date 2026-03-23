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

  useEffect(() => {
    if (!loading && !firebaseUser) {
      router.replace("/login");
    }
  }, [firebaseUser, loading, router]);

  if (loading) {
    return <div className="min-h-screen bg-gray-50" />;
  }

  if (!firebaseUser) {
    return <div className="min-h-screen bg-gray-50" />;
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
