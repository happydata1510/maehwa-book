"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  getChildrenByKindergarten,
  getClassesByKindergarten,
  getReadingRecords,
} from "@/lib/firebase/firestore";
import { Child, Class, ReadingRecord } from "@/types";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
import Avatar from "@/components/ui/Avatar";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface ChildWithRecent extends Child {
  recentRecords: ReadingRecord[];
}

export default function ManagePage() {
  const { userData } = useAuth();
  const [children, setChildren] = useState<ChildWithRecent[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!userData) return;
      try {
        const [childResult, classResult] = await Promise.all([
          getChildrenByKindergarten(userData.kindergartenId),
          getClassesByKindergarten(userData.kindergartenId),
        ]);
        setClasses(classResult);

        // 각 아이의 최근 기록 3개 가져오기
        const childrenWithRecords: ChildWithRecent[] = await Promise.all(
          childResult.map(async (child) => {
            const records = await getReadingRecords(child.id, 3);
            return { ...child, recentRecords: records };
          })
        );

        // 최근 기록이 있는 아이 우선 정렬
        childrenWithRecords.sort((a, b) => {
          const aLatest = a.recentRecords[0]?.createdAt?.toMillis?.() || 0;
          const bLatest = b.recentRecords[0]?.createdAt?.toMillis?.() || 0;
          return bLatest - aLatest;
        });

        setChildren(childrenWithRecords);
      } catch (error) {
        console.error("Failed to fetch:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [userData]);

  const getClassName = (classId: string) =>
    classes.find((c) => c.id === classId)?.name || "";

  const filtered =
    selectedClassId === "all"
      ? children
      : children.filter((c) => c.classId === selectedClassId);

  const totalRecordsToday = children.reduce((sum, c) => {
    const today = new Date().toDateString();
    return (
      sum +
      c.recentRecords.filter(
        (r) => r.createdAt?.toDate?.()?.toDateString?.() === today
      ).length
    );
  }, 0);

  if (loading) {
    return (
      <>
        <Header title="기록 관리" />
        <LoadingSpinner text="불러오는 중..." />
      </>
    );
  }

  return (
    <>
      <Header title="기록 관리" />
      <div className="px-4 py-4 space-y-5">
        {/* 오늘 현황 요약 */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="text-center bg-gradient-to-br from-blue-400 to-blue-600 text-white border-0">
            <p className="text-blue-100 text-xs">전체 아이</p>
            <p className="text-2xl font-bold">{children.length}</p>
            <p className="text-blue-200 text-xs">명</p>
          </Card>
          <Card className="text-center bg-gradient-to-br from-green-400 to-green-600 text-white border-0">
            <p className="text-green-100 text-xs">전체 독서량</p>
            <p className="text-2xl font-bold">
              {children.reduce((s, c) => s + c.totalBooksRead, 0)}
            </p>
            <p className="text-green-200 text-xs">권</p>
          </Card>
          <Card className="text-center bg-gradient-to-br from-orange-400 to-orange-600 text-white border-0">
            <p className="text-orange-100 text-xs">오늘 기록</p>
            <p className="text-2xl font-bold">{totalRecordsToday}</p>
            <p className="text-orange-200 text-xs">건</p>
          </Card>
        </div>

        {/* 반 필터 */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedClassId("all")}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              selectedClassId === "all"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            전체
          </button>
          {classes.map((cls) => (
            <button
              key={cls.id}
              onClick={() => setSelectedClassId(cls.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedClassId === cls.id
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {cls.name}
            </button>
          ))}
        </div>

        {/* 아이별 최근 기록 */}
        <div>
          <h3 className="font-bold text-gray-900 mb-3">
            아이별 독서 현황 ({filtered.length}명)
          </h3>
          <div className="space-y-3">
            {filtered.map((child) => (
              <Card key={child.id} className="space-y-3">
                {/* 아이 정보 */}
                <Link
                  href={`/children/${child.id}`}
                  className="flex items-center gap-3"
                >
                  <Avatar
                    name={child.name}
                    imageUrl={child.profileImageUrl}
                    size="md"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-gray-900">{child.name}</p>
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                        {getClassName(child.classId)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      총 {child.totalBooksRead}권 · 이번 달 {child.monthlyBooksRead}권
                    </p>
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>

                {/* 최근 기록 미니 리스트 */}
                {child.recentRecords.length > 0 ? (
                  <div className="pl-2 border-l-2 border-green-200 ml-6 space-y-1.5">
                    {child.recentRecords.map((rec) => (
                      <div
                        key={rec.id}
                        className="flex items-center gap-2 text-sm"
                      >
                        <span className="text-green-500 text-xs">
                          {rec.readDate?.toDate?.()
                            ? rec.readDate
                                .toDate()
                                .toLocaleDateString("ko-KR", {
                                  month: "short",
                                  day: "numeric",
                                })
                            : ""}
                        </span>
                        <span className="text-gray-700 truncate flex-1">
                          {rec.bookTitle}
                        </span>
                        <span className="text-gray-400 text-xs truncate max-w-[80px]">
                          {rec.bookAuthor}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 ml-6 pl-2">
                    아직 기록이 없습니다
                  </p>
                )}
              </Card>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
