"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { getChildrenByClass } from "@/lib/firebase/firestore";
import { Class, Child } from "@/types";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
import Avatar from "@/components/ui/Avatar";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function ClassDetailPage() {
  const params = useParams();
  const classId = params.classId as string;

  const [classData, setClassData] = useState<Class | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const classDoc = await getDoc(doc(db, "classes", classId));
        if (classDoc.exists()) {
          setClassData({ id: classDoc.id, ...classDoc.data() } as Class);
        }
        const childResult = await getChildrenByClass(classId);
        setChildren(childResult.sort((a, b) => b.totalBooksRead - a.totalBooksRead));
      } catch (error) {
        console.error("Failed to fetch:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [classId]);

  if (loading) {
    return (
      <>
        <Header title="반 상세" showBack />
        <LoadingSpinner />
      </>
    );
  }

  const totalBooks = children.reduce((sum, c) => sum + c.totalBooksRead, 0);

  return (
    <>
      <Header title={classData?.name || "반 상세"} showBack />
      <div className="px-4 py-4 space-y-6">
        {/* 반 통계 */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="text-center">
            <p className="text-sm text-gray-500">인원</p>
            <p className="text-2xl font-bold text-blue-600">{children.length}</p>
            <p className="text-xs text-gray-400">명</p>
          </Card>
          <Card className="text-center">
            <p className="text-sm text-gray-500">총 독서량</p>
            <p className="text-2xl font-bold text-green-600">{totalBooks}</p>
            <p className="text-xs text-gray-400">권</p>
          </Card>
        </div>

        {/* 독서 랭킹 */}
        <div>
          <h3 className="font-bold text-gray-900 mb-3">독서 랭킹</h3>
          <div className="space-y-2">
            {children.map((child, i) => (
              <Link key={child.id} href={`/children/${child.id}`}>
                <Card hoverable className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      i === 0
                        ? "bg-yellow-100 text-yellow-600"
                        : i === 1
                          ? "bg-gray-100 text-gray-500"
                          : i === 2
                            ? "bg-orange-100 text-orange-500"
                            : "bg-gray-50 text-gray-400"
                    }`}
                  >
                    {i + 1}
                  </div>
                  <Avatar name={child.name} imageUrl={child.profileImageUrl} size="sm" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{child.name}</p>
                  </div>
                  <p className="font-bold text-green-600">
                    {child.totalBooksRead}<span className="text-xs font-normal text-gray-400">권</span>
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
