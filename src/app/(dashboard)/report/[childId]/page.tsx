"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { generateMonthlyReport, MonthlyReport } from "@/lib/firebase/firestore";
import { FEELING_OPTIONS } from "@/types";
import { BADGE_DEFINITIONS } from "@/lib/badge-rules";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function ReportPage() {
  const params = useParams();
  const childId = params.childId as string;

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReport() {
      setLoading(true);
      try {
        const data = await generateMonthlyReport(childId, year, month);
        setReport(data);
      } catch (error) {
        console.error("Failed to generate report:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, [childId, year, month]);

  const goToPrev = () => {
    if (month === 1) { setYear(year - 1); setMonth(12); }
    else setMonth(month - 1);
  };
  const goToNext = () => {
    if (month === 12) { setYear(year + 1); setMonth(1); }
    else setMonth(month + 1);
  };

  const getFeelingEmoji = (feeling: string) =>
    FEELING_OPTIONS.find((f) => f.value === feeling)?.emoji || "";
  const getFeelingLabel = (feeling: string) =>
    FEELING_OPTIONS.find((f) => f.value === feeling)?.label || "";

  if (loading) {
    return (
      <>
        <Header title="독서 리포트" showBack />
        <LoadingSpinner text="리포트 생성 중..." />
      </>
    );
  }

  if (!report) {
    return (
      <>
        <Header title="독서 리포트" showBack />
        <div className="px-4 py-8 text-center text-gray-500">
          리포트를 생성할 수 없습니다
        </div>
      </>
    );
  }

  const earnedBadges = BADGE_DEFINITIONS.filter((b) =>
    report.badgesEarned.includes(b.type)
  );

  return (
    <>
      <Header title={`${report.childName} 독서 리포트`} showBack />
      <div className="px-4 py-4 space-y-5">
        {/* 월 네비게이션 */}
        <div className="flex items-center justify-between">
          <button onClick={goToPrev} className="p-2 rounded-lg hover:bg-gray-100">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-lg font-bold text-gray-900">
            {year}년 {month}월
          </h2>
          <button onClick={goToNext} className="p-2 rounded-lg hover:bg-gray-100">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* 핵심 지표 */}
        <div className="grid grid-cols-4 gap-2">
          <Card className="text-center bg-green-50">
            <p className="text-2xl font-black text-green-600">{report.monthBooks}</p>
            <p className="text-[10px] text-green-700">이번 달</p>
          </Card>
          <Card className="text-center bg-blue-50">
            <p className="text-2xl font-black text-blue-600">{report.readingDays}</p>
            <p className="text-[10px] text-blue-700">독서일</p>
          </Card>
          <Card className="text-center bg-orange-50">
            <p className="text-2xl font-black text-orange-600">{report.streak}</p>
            <p className="text-[10px] text-orange-700">연속일</p>
          </Card>
          <Card className="text-center bg-purple-50">
            <p className="text-2xl font-black text-purple-600">{report.totalBooks}</p>
            <p className="text-[10px] text-purple-700">전체 누적</p>
          </Card>
        </div>

        {/* 감상 분석 */}
        {report.feelingStats.length > 0 && (
          <Card>
            <h3 className="font-bold text-sm text-gray-800 mb-3">감상 분석</h3>
            <div className="flex justify-center gap-4">
              {report.feelingStats.map((fs) => {
                const maxCount = Math.max(...report.feelingStats.map((f) => f.count));
                return (
                  <div key={fs.feeling} className="text-center">
                    <div
                      className="w-12 bg-yellow-100 rounded-t-lg mx-auto flex items-end justify-center"
                      style={{ height: `${Math.max((fs.count / maxCount) * 60, 20)}px` }}
                    >
                      <span className="text-2xl">{getFeelingEmoji(fs.feeling)}</span>
                    </div>
                    <p className="text-xs font-bold text-gray-700 mt-1">{fs.count}</p>
                    <p className="text-[10px] text-gray-500">{getFeelingLabel(fs.feeling)}</p>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* 자주 읽은 책 */}
        {report.topBooks.length > 0 && (
          <Card>
            <h3 className="font-bold text-sm text-gray-800 mb-3">자주 읽은 책</h3>
            <div className="space-y-2">
              {report.topBooks.map((book, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    i === 0 ? "bg-yellow-200 text-yellow-700" : "bg-gray-100 text-gray-500"
                  }`}>
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm text-gray-800 truncate">{book.title}</span>
                  <span className="text-xs text-gray-500">{book.count}회</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* 뱃지 현황 */}
        <Card>
          <h3 className="font-bold text-sm text-gray-800 mb-3">뱃지 현황</h3>
          <div className="flex flex-wrap gap-2 justify-center">
            {BADGE_DEFINITIONS.map((def) => {
              const earned = earnedBadges.some((b) => b.type === def.type);
              return (
                <div
                  key={def.type}
                  className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center ${
                    earned
                      ? "bg-yellow-100 border-2 border-yellow-300"
                      : "bg-gray-100 border border-gray-200 opacity-30"
                  }`}
                >
                  <span className="text-lg">{def.isKing ? "👑" : "🏅"}</span>
                  <span className="text-[9px] font-bold" style={{ color: earned ? def.color : "#999" }}>
                    {def.threshold}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* 한줄 요약 */}
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 text-center py-5">
          <p className="text-sm text-gray-700">
            {report.childName}은(는) {month}월에{" "}
            <span className="font-bold text-green-600">{report.monthBooks}권</span>의 책을 읽었고,{" "}
            <span className="font-bold text-blue-600">{report.readingDays}일</span> 동안 독서를 했어요!
            {report.monthBooks >= 20 && " 정말 대단해요! 🌟"}
            {report.monthBooks >= 10 && report.monthBooks < 20 && " 잘 하고 있어요! 👏"}
            {report.monthBooks < 10 && report.monthBooks > 0 && " 조금 더 힘내요! 💪"}
          </p>
        </Card>
      </div>
    </>
  );
}
