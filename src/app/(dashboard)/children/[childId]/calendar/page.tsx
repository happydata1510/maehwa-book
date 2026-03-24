"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getChild, getReadingRecordsByMonth } from "@/lib/firebase/firestore";
import { Child, ReadingRecord, FEELING_OPTIONS } from "@/types";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function CalendarPage() {
  const params = useParams();
  const childId = params.childId as string;

  const [child, setChild] = useState<Child | null>(null);
  const [records, setRecords] = useState<ReadingRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [childData, recordData] = await Promise.all([
          getChild(childId),
          getReadingRecordsByMonth(childId, year, month),
        ]);
        setChild(childData);
        setRecords(recordData);
      } catch (error) {
        console.error("Failed to fetch:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [childId, year, month]);

  const goToPrev = () => {
    if (month === 1) {
      setYear(year - 1);
      setMonth(12);
    } else {
      setMonth(month - 1);
    }
  };

  const goToNext = () => {
    if (month === 12) {
      setYear(year + 1);
      setMonth(1);
    } else {
      setMonth(month + 1);
    }
  };

  // 날짜별로 그룹핑
  const recordsByDate = new Map<string, ReadingRecord[]>();
  for (const rec of records) {
    const d = rec.readDate?.toDate?.();
    if (!d) continue;
    const key = d.toISOString().split("T")[0];
    if (!recordsByDate.has(key)) recordsByDate.set(key, []);
    recordsByDate.get(key)!.push(rec);
  }

  // 해당 월의 날짜 생성
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];

  const getFeelingEmoji = (feeling: string | null) => {
    const opt = FEELING_OPTIONS.find((f) => f.value === feeling);
    return opt?.emoji || "";
  };

  return (
    <>
      <Header title={`${child?.name || ""} 월별 독서`} showBack />
      <div className="px-4 py-4 space-y-5">
        {/* 월 네비게이션 */}
        <div className="flex items-center justify-between">
          <button
            onClick={goToPrev}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-lg font-bold text-gray-900">
            {year}년 {month}월
          </h2>
          <button
            onClick={goToNext}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* 월간 요약 */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="text-center">
            <p className="text-xs text-gray-500">이번 달</p>
            <p className="text-xl font-bold text-green-600">{records.length}</p>
            <p className="text-xs text-gray-400">권</p>
          </Card>
          <Card className="text-center">
            <p className="text-xs text-gray-500">독서일</p>
            <p className="text-xl font-bold text-blue-600">{recordsByDate.size}</p>
            <p className="text-xs text-gray-400">일</p>
          </Card>
          <Card className="text-center">
            <p className="text-xs text-gray-500">일 평균</p>
            <p className="text-xl font-bold text-orange-500">
              {recordsByDate.size > 0 ? (records.length / recordsByDate.size).toFixed(1) : "0"}
            </p>
            <p className="text-xs text-gray-400">권</p>
          </Card>
        </div>

        {/* 캘린더 그리드 */}
        <Card>
          <div className="grid grid-cols-7 gap-1">
            {dayNames.map((d) => (
              <div
                key={d}
                className={`text-center text-xs font-medium py-1 ${
                  d === "일" ? "text-red-400" : d === "토" ? "text-blue-400" : "text-gray-400"
                }`}
              >
                {d}
              </div>
            ))}
            {/* 빈 칸 */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {/* 날짜 */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const dayRecords = recordsByDate.get(dateKey);
              const count = dayRecords?.length || 0;
              const isToday =
                year === now.getFullYear() &&
                month === now.getMonth() + 1 &&
                day === now.getDate();

              return (
                <div
                  key={day}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center text-xs relative ${
                    isToday ? "ring-2 ring-green-400" : ""
                  } ${count > 0 ? "bg-green-50" : ""}`}
                >
                  <span className={`font-medium ${count > 0 ? "text-green-700" : "text-gray-400"}`}>
                    {day}
                  </span>
                  {count > 0 && (
                    <span className="text-[10px] text-green-600 font-bold">
                      {count}권
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {loading && <LoadingSpinner />}

        {/* 날짜별 기록 상세 */}
        {!loading && (
          <div className="space-y-4">
            {Array.from(recordsByDate.entries())
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([dateKey, dayRecords]) => {
                const d = new Date(dateKey);
                return (
                  <div key={dateKey}>
                    <p className="text-sm font-semibold text-gray-600 mb-2">
                      {d.toLocaleDateString("ko-KR", {
                        month: "long",
                        day: "numeric",
                        weekday: "short",
                      })}{" "}
                      <span className="text-green-600">({dayRecords.length}권)</span>
                    </p>
                    <div className="space-y-2">
                      {dayRecords.map((rec) => (
                        <Card key={rec.id} className="flex items-center gap-3 py-3">
                          {rec.bookCoverUrl ? (
                            <img
                              src={rec.bookCoverUrl}
                              alt={rec.bookTitle}
                              className="w-10 h-14 object-cover rounded"
                            />
                          ) : (
                            <div className="w-10 h-14 bg-gray-100 rounded flex items-center justify-center text-lg">
                              📕
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-gray-900 truncate">
                              {rec.bookTitle}
                            </p>
                            <p className="text-xs text-gray-500">{rec.bookAuthor}</p>
                          </div>
                          {rec.feeling && (
                            <span className="text-lg">{getFeelingEmoji(rec.feeling)}</span>
                          )}
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}
            {records.length === 0 && (
              <Card className="text-center py-6">
                <p className="text-gray-500 text-sm">이번 달 독서 기록이 없습니다</p>
              </Card>
            )}
          </div>
        )}
      </div>
    </>
  );
}
