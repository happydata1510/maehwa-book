"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function LandingPage() {
  const { firebaseUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(firebaseUser ? "/home" : "/login");
  }, [firebaseUser, loading, router]);

  return <div className="min-h-screen bg-gray-50" />;
}
