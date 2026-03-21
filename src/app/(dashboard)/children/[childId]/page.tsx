"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  getChild,
  getReadingRecords,
  getBadgesByChild,
  getClassesByKindergarten,
  getChildrenByKindergarten,
} from "@/lib/firebase/firestore";
import { Child, ReadingRecord, Badge, Class } from "@/types";
import { BADGE_DEFINITIONS, getNextBadge, getBooksUntilNextBadge } from "@/lib/badge-rules";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
import Avatar from "@/components/ui/Avatar";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

// 주별/월별 통계 계산 함수
function calculateWeeklyStats(records: ReadingRecord[]): { label: string; count: number }[] {
  const weeks: { label: string; count: number }[] = [];
  const now = new Date();

  for (let i = 0; i < 8; i++) {
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() - i * 7);
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 6);

    const count = records.filter((r) => {
      const d = r.readDate?.toDate?.();
      if (!d) return false;
      return d >= weekStart && d <= weekEnd;
    }).length;

    const label =
      i === 0
        ? "이번 주"
        : i === 1
          ? "지난 주"
          : `${weekStart.getMonth() + 1}/${weekStart.getDate()}~`;

    weeks.push({ label, count });
  }

  return weeks;
}

function calculateMonthlyStats(records: ReadingRecord[]): { label: string; count: number }[] {
  const months: { label: string; count: number }[] = [];
  const now = new Date();

  for (let i = 0; i < 6; i++) {
    const targetMonth = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = targetMonth.getFullYear();
    const month = targetMonth.getMonth();

    const count = records.filter((r) => {
      const d = r.readDate?.toDate?.();
      if (!d) return false;
      return d.getFullYear() === year && d.getMonth() === month;
    }).length;

    const label = i === 0 ? "이번 달" : `${month + 1}월`;
    months.push({ label, count });
  }

  return months;
}

export default function ChildDetailPage() {
  const params = useParams();
  const childId = params.childId as string;

  const [child, setChild] = useState<Child | null>(null);
  const [allRecords, setAllRecords] = useState<ReadingRecord[]>([]);
  const [recentRecords, setRecentRecords] = useState<ReadingRecord[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [className, setClassName] = useState("");
  const [kindergartenTotal, setKindergartenTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [childData, recordData, badgeData] = await Promise.all([
          getChild(childId),
          getReadingRecords(childId, 200),
          getBadgesByChild(childId),
        ]);
        setChild(childData);
        setAllRecords(recordData);
        setRecentRecords(recordData.slice(0, 10));
        setBadges(badgeData);

        // 반 이름 + 유치원 전체 합산
        if (childData) {
          const [classes, allChildren] = await Promise.all([
            getClassesByKindergarten(childData.kindergartenId),
            getChildrenByKindergarten(childData.kindergartenId),
          ]);
          const cls = classes.find((c) => c.id === childData.classId);
          setClassName(cls ? `${cls.name} (${cls.ageGroup}세)` : "");
          setKindergartenTotal(
            allChildren.reduce((s, c) => s + (c.totalBooksRead || 0), 0)
          );
        }
      } catch (error) {
        console.error("Failed to fetch:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [childId]);

  if (loading) {
    return (
      <>
        <Header title="아이 상세" showBack />
        <LoadingSpinner />
      </>
    );
  }

  if (!child) {
    return (
      <>
        <Header title="아이 상세" showBack />
        <div className="px-4 py-8 text-center text-gray-500">
          아이 정보를 찾을 수 없습니다
        </div>
      </>
    );
  }

  const nextBadge = getNextBadge(child.totalBooksRead);
  const booksUntil = getBooksUntilNextBadge(child.totalBooksRead);
  const progress = nextBadge
    ? ((child.totalBooksRead % 100) / 100) * 100
    : 100;
  const weeklyStats = calculateWeeklyStats(allRecords);
  const monthlyStats = calculateMonthlyStats(allRecords);
  const maxWeekly = Math.max(...weeklyStats.map((w) => w.count), 1);
  const maxMonthly = Math.max(...monthlyStats.map((m) => m.count), 1);

  return (
    <>
      <Header title={child.name} showBack />
      <div className="px-4 py-4 space-y-6">
        {/* 프로필 + 반 이름 */}
        <div className="text-center">
          <Avatar
            name={child.name}
            imageUrl={child.profileImageUrl}
            size="xl"
            className="mx-auto"
          />
          <h2 className="text-xl font-bold mt-3">{child.name}</h2>
          {className && (
            <p className="text-sm text-gray-500 mt-1">{className}</p>
          )}
        </div>

        {/* 독서 통계 카드 */}
        <div className="grid grid-cols-3 gap-2">
          <Card className="text-center">
            <p className="text-xs text-gray-500">전체</p>
            <p className="text-2xl font-bold text-green-600">{child.totalBooksRead}</p>
            <p className="text-[10px] text-gray-400">권</p>
          </Card>
          <Card className="text-center">
            <p className="text-xs text-gray-500">이번 달</p>
            <p className="text-2xl font-bold text-orange-500">{child.monthlyBooksRead}</p>
            <p className="text-[10px] text-gray-400">권</p>
          </Card>
          <Card className="text-center">
            <p className="text-xs text-gray-500">유치원 전체</p>
            <p className="text-2xl font-bold text-purple-500">{kindergartenTotal}</p>
            <p className="text-[10px] text-gray-400">권</p>
          </Card>
        </div>

        {/* 다음 뱃지 진행도 */}
        {nextBadge && (
          <Card>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700">
                다음 목표: {nextBadge.label}
              </span>
              <span className="text-sm text-gray-500">{booksUntil}권 남음</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%`, backgroundColor: nextBadge.color }}
              />
            </div>
          </Card>
        )}

        {/* ===== 주별 독서량 차트 ===== */}
        <div>
          <h3 className="font-bold text-gray-900 mb-3">주별 독서량</h3>
          <Card>
            <div className="space-y-2">
              {weeklyStats.map((week, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-14 text-right flex-shrink-0">
                    {week.label}
                  </span>
                  <div className="flex-1 h-6 bg-gray-50 rounded-full overflow-hidden">
                    {week.count > 0 && (
                      <div
                        className="h-full bg-green-400 rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                        style={{ width: `${Math.max((week.count / maxWeekly) * 100, 15)}%` }}
                      >
                        <span className="text-[10px] text-white font-bold">{week.count}</span>
                      </div>
                    )}
                  </div>
                  {week.count === 0 && (
                    <span className="text-xs text-gray-300">0</span>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ===== 월별 독서량 차트 ===== */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900">월별 독서량</h3>
            <Link
              href={`/children/${childId}/calendar`}
              className="text-sm text-blue-600 font-medium"
            >
              캘린더 보기
            </Link>
          </div>
          <Card>
            <div className="flex items-end justify-between gap-1 h-32">
              {[...monthlyStats].reverse().map((month, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-bold text-gray-700">
                    {month.count > 0 ? month.count : ""}
                  </span>
                  <div className="w-full bg-gray-50 rounded-t-lg relative" style={{ height: "100%" }}>
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-500 to-blue-300 rounded-t-lg transition-all duration-500"
                      style={{
                        height: month.count > 0 ? `${Math.max((month.count / maxMonthly) * 100, 8)}%` : "0%",
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-500">{month.label}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* 뱃지 컬렉션 */}
        <div>
          <h3 className="font-bold text-gray-900 mb-3">뱃지 컬렉션</h3>
          <div className="grid grid-cols-5 gap-2">
            {BADGE_DEFINITIONS.map((def) => {
              const earned = badges.some((b) => b.type === def.type);
              return (
                <div
                  key={def.type}
                  className={`aspect-square rounded-2xl flex flex-col items-center justify-center p-2 ${
                    earned
                      ? "bg-gradient-to-b from-yellow-50 to-yellow-100 border-2 border-yellow-300"
                      : "bg-gray-100 border-2 border-gray-200 opacity-40"
                  }`}
                >
                  <span className={`text-2xl ${def.isKing ? "text-3xl" : ""}`}>
                    {def.isKing ? "👑" : "🏅"}
                  </span>
                  <span className="text-xs font-bold mt-1" style={{ color: earned ? def.color : "#9ca3af" }}>
                    {def.threshold}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 최근 독서 기록 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900">최근 독서 기록</h3>
            <div className="flex gap-3">
              <Link
                href={`/children/${childId}/calendar`}
                className="text-sm text-blue-600 font-medium"
              >
                월별 캘린더
              </Link>
              <Link
                href={`/children/${childId}/records`}
                className="text-sm text-green-600 font-medium"
              >
                전체보기
              </Link>
            </div>
          </div>
          {recentRecords.length === 0 ? (
            <Card className="text-center py-6">
              <p className="text-gray-500 text-sm">아직 독서 기록이 없습니다</p>
              <Link
                href="/record"
                className="text-green-600 font-semibold text-sm mt-2 inline-block"
              >
                첫 번째 기록하기
              </Link>
            </Card>
          ) : (
            <div className="space-y-2">
              {recentRecords.map((record) => (
                <Card key={record.id} className="flex items-center gap-3">
                  {record.bookCoverUrl ? (
                    <img
                      src={record.bookCoverUrl}
                      alt={record.bookTitle}
                      className="w-12 h-16 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-12 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">📕</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">
                      {record.bookTitle}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {record.bookAuthor}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {record.readDate?.toDate?.()
                        ? record.readDate.toDate().toLocaleDateString("ko-KR")
                        : ""}
                    </p>
                  </div>
                  {record.feeling && (
                    <span className="text-lg">
                      {record.feeling === "love" ? "❤️" : record.feeling === "fun" ? "😄" : record.feeling === "sad" ? "😢" : record.feeling === "scary" ? "😱" : "🧠"}
                    </span>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
