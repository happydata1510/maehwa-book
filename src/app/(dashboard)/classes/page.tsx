"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getClassesByKindergarten, getChildrenByClass } from "@/lib/firebase/firestore";
import { Class } from "@/types";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function ClassesPage() {
  const { userData } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [childCounts, setChildCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!userData) return;
      try {
        const result = await getClassesByKindergarten(userData.kindergartenId);
        setClasses(result);

        const counts: Record<string, number> = {};
        await Promise.all(
          result.map(async (cls) => {
            const children = await getChildrenByClass(cls.id);
            counts[cls.id] = children.length;
          })
        );
        setChildCounts(counts);
      } catch (error) {
        console.error("Failed to fetch:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [userData]);

  if (loading) {
    return (
      <>
        <Header title="반 관리" showBack />
        <LoadingSpinner />
      </>
    );
  }

  return (
    <>
      <Header title="반 관리" showBack />
      <div className="px-4 py-4 space-y-3">
        {classes.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-gray-500">등록된 반이 없습니다</p>
            <Link
              href="/children"
              className="text-green-600 font-semibold text-sm mt-2 inline-block"
            >
              아이 관리에서 반 추가하기
            </Link>
          </Card>
        ) : (
          classes.map((cls) => (
            <Link key={cls.id} href={`/classes/${cls.id}`}>
              <Card hoverable className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-900">{cls.name}</p>
                  <p className="text-sm text-gray-500">
                    {cls.ageGroup}세 · {childCounts[cls.id] || 0}명
                  </p>
                </div>
                <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Card>
            </Link>
          ))
        )}
      </div>
    </>
  );
}
