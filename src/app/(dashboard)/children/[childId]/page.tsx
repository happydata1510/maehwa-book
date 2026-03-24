"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  getChild,
  getReadingRecords,
  getBadgesByChild,
  getClassesByKindergarten,
  getChildrenByKindergarten,
  updateChild,
  deleteChild,
} from "@/lib/firebase/firestore";
import { Child, ReadingRecord, Badge, Class, FEELING_OPTIONS } from "@/types";
import { BADGE_DEFINITIONS, getNextBadge, getBooksUntilNextBadge } from "@/lib/badge-rules";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

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
      return d ? d >= weekStart && d <= weekEnd : false;
    }).length;
    const label = i === 0 ? "이번 주" : i === 1 ? "지난 주" : `${weekStart.getMonth() + 1}/${weekStart.getDate()}~`;
    weeks.push({ label, count });
  }
  return weeks;
}

function calculateMonthlyStats(records: ReadingRecord[]): { label: string; count: number }[] {
  const months: { label: string; count: number }[] = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const target = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = target.getFullYear();
    const month = target.getMonth();
    const count = records.filter((r) => {
      const d = r.readDate?.toDate?.();
      return d ? d.getFullYear() === year && d.getMonth() === month : false;
    }).length;
    months.push({ label: i === 0 ? "이번 달" : `${month + 1}월`, count });
  }
  return months;
}

export default function ChildDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { userData } = useAuth();
  const childId = params.childId as string;

  const [child, setChild] = useState<Child | null>(null);
  const [allRecords, setAllRecords] = useState<ReadingRecord[]>([]);
  const [recentRecords, setRecentRecords] = useState<ReadingRecord[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [className, setClassName] = useState("");
  const [kindergartenTotal, setKindergartenTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // 관리 모달
  const [showMoveClass, setShowMoveClass] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showManageMenu, setShowManageMenu] = useState(false);
  const [moveToClassId, setMoveToClassId] = useState("");

  const isTeacher = userData?.role === "teacher" || userData?.role === "admin";

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

        if (childData) {
          const [clsList, allChildren] = await Promise.all([
            getClassesByKindergarten(childData.kindergartenId),
            getChildrenByKindergarten(childData.kindergartenId),
          ]);
          setClasses(clsList);
          const cls = clsList.find((c) => c.id === childData.classId);
          setClassName(cls ? `${cls.name} (${cls.ageGroup}세)` : "");
          setKindergartenTotal(allChildren.reduce((s, c) => s + (c.totalBooksRead || 0), 0));
        }
      } catch (error) {
        console.error("Failed to fetch:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [childId]);

  const handleMoveClass = async () => {
    if (!child || !moveToClassId) return;
    await updateChild(child.id, { classId: moveToClassId });
    const cls = classes.find((c) => c.id === moveToClassId);
    setClassName(cls ? `${cls.name} (${cls.ageGroup}세)` : "");
    setChild({ ...child, classId: moveToClassId });
    setShowMoveClass(false);
    setMoveToClassId("");
  };

  const handleDelete = async () => {
    if (!child) return;
    await deleteChild(child.id);
    setShowDeleteConfirm(false);
    router.push("/children");
  };

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
        <div className="px-4 py-8 text-center text-gray-500">아이 정보를 찾을 수 없습니다</div>
      </>
    );
  }

  const nextBadge = getNextBadge(child.totalBooksRead);
  const booksUntil = getBooksUntilNextBadge(child.totalBooksRead);
  const progress = nextBadge ? ((child.totalBooksRead % 100) / 100) * 100 : 100;
  const weeklyStats = calculateWeeklyStats(allRecords);
  const monthlyStats = calculateMonthlyStats(allRecords);
  const maxWeekly = Math.max(...weeklyStats.map((w) => w.count), 1);
  const maxMonthly = Math.max(...monthlyStats.map((m) => m.count), 1);

  return (
    <>
      <Header title={child.name} showBack />
      <div className="px-4 py-4 space-y-5 pb-24">
        {/* 프로필 + 관리 버튼 */}
        <div className="flex items-start gap-4">
          <Avatar name={child.name} imageUrl={child.profileImageUrl} size="xl" />
          <div className="flex-1">
            <h2 className="text-xl font-bold">{child.name}</h2>
            {className && <p className="text-sm text-gray-500 mt-0.5">{className}</p>}
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div className="text-center bg-green-50 rounded-xl py-2">
                <p className="text-lg font-bold text-green-600">{child.totalBooksRead}</p>
                <p className="text-[9px] text-gray-500">전체</p>
              </div>
              <div className="text-center bg-orange-50 rounded-xl py-2">
                <p className="text-lg font-bold text-orange-500">{child.monthlyBooksRead}</p>
                <p className="text-[9px] text-gray-500">이번 달</p>
              </div>
              <div className="text-center bg-purple-50 rounded-xl py-2">
                <p className="text-lg font-bold text-purple-500">{kindergartenTotal}</p>
                <p className="text-[9px] text-gray-500">유치원</p>
              </div>
            </div>
          </div>

          {/* 선생님: 관리 메뉴 */}
          {isTeacher && (
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setShowManageMenu(!showManageMenu)}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
              {showManageMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowManageMenu(false)} />
                  <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-xl shadow-lg z-50 w-40 overflow-hidden">
                    <button
                      onClick={() => { setShowManageMenu(false); setShowMoveClass(true); }}
                      className="w-full px-4 py-3 text-left text-sm hover:bg-blue-50 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                      <span className="text-gray-700">반 변경</span>
                    </button>
                    <button
                      onClick={() => { setShowManageMenu(false); setShowDeleteConfirm(true); }}
                      className="w-full px-4 py-3 text-left text-sm hover:bg-red-50 flex items-center gap-2 border-t border-gray-100"
                    >
                      <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span className="text-red-600">삭제</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* 다음 뱃지 진행도 */}
        {nextBadge && (
          <Card>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700">다음 목표: {nextBadge.label}</span>
              <span className="text-sm text-gray-500">{booksUntil}권 남음</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, backgroundColor: nextBadge.color }} />
            </div>
          </Card>
        )}

        {/* 주별 독서량 */}
        <div>
          <h3 className="font-bold text-sm text-gray-900 mb-2">주별 독서량</h3>
          <Card>
            <div className="space-y-1.5">
              {weeklyStats.map((week, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-500 w-12 text-right flex-shrink-0">{week.label}</span>
                  <div className="flex-1 h-5 bg-gray-50 rounded-full overflow-hidden">
                    {week.count > 0 && (
                      <div
                        className="h-full bg-green-400 rounded-full flex items-center justify-end pr-1.5 transition-all"
                        style={{ width: `${Math.max((week.count / maxWeekly) * 100, 15)}%` }}
                      >
                        <span className="text-[9px] text-white font-bold">{week.count}</span>
                      </div>
                    )}
                  </div>
                  {week.count === 0 && <span className="text-[10px] text-gray-300">0</span>}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* 월별 독서량 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-sm text-gray-900">월별 독서량</h3>
            <Link href={`/children/${childId}/calendar`} className="text-xs text-blue-600 font-medium">캘린더</Link>
          </div>
          <Card>
            <div className="flex items-end justify-between gap-1 h-28">
              {[...monthlyStats].reverse().map((month, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] font-bold text-gray-700">{month.count > 0 ? month.count : ""}</span>
                  <div className="w-full bg-gray-50 rounded-t-lg relative" style={{ height: "100%" }}>
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-500 to-blue-300 rounded-t-lg transition-all"
                      style={{ height: month.count > 0 ? `${Math.max((month.count / maxMonthly) * 100, 8)}%` : "0%" }}
                    />
                  </div>
                  <span className="text-[9px] text-gray-500">{month.label}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* 뱃지 컬렉션 */}
        <div>
          <h3 className="font-bold text-sm text-gray-900 mb-2">뱃지 컬렉션</h3>
          <div className="grid grid-cols-5 gap-2">
            {BADGE_DEFINITIONS.map((def) => {
              const earned = badges.some((b) => b.type === def.type);
              return (
                <div
                  key={def.type}
                  className={`aspect-square rounded-2xl flex flex-col items-center justify-center p-1 ${
                    earned
                      ? "bg-gradient-to-b from-yellow-50 to-yellow-100 border-2 border-yellow-300"
                      : "bg-gray-100 border-2 border-gray-200 opacity-40"
                  }`}
                >
                  <span className={`${def.isKing ? "text-2xl" : "text-xl"}`}>{def.isKing ? "👑" : "🏅"}</span>
                  <span className="text-[10px] font-bold mt-0.5" style={{ color: earned ? def.color : "#9ca3af" }}>{def.threshold}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 최근 독서 기록 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-sm text-gray-900">최근 독서 기록</h3>
            <Link href={`/children/${childId}/records`} className="text-xs text-green-600 font-medium">전체보기</Link>
          </div>
          {recentRecords.length === 0 ? (
            <Card className="text-center py-6">
              <p className="text-gray-500 text-sm">아직 독서 기록이 없습니다</p>
              <Link href="/record" className="text-green-600 font-semibold text-sm mt-2 inline-block">첫 번째 기록하기</Link>
            </Card>
          ) : (
            <div className="space-y-1.5">
              {recentRecords.map((record) => (
                <Card key={record.id} className="flex items-center gap-3 py-2.5">
                  <div className="w-10 h-13 bg-gray-100 rounded-lg flex items-center justify-center text-xl">📕</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-xs text-gray-900 truncate">{record.bookTitle}</p>
                    <p className="text-[10px] text-gray-500 truncate">{record.bookAuthor}</p>
                    <p className="text-[10px] text-gray-400">
                      {record.readDate?.toDate?.() ? record.readDate.toDate().toLocaleDateString("ko-KR") : ""}
                    </p>
                  </div>
                  {record.feeling && (
                    <span className="text-sm">{FEELING_OPTIONS.find((f) => f.value === record.feeling)?.emoji}</span>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 반 변경 모달 */}
      <Modal
        isOpen={showMoveClass}
        onClose={() => { setShowMoveClass(false); setMoveToClassId(""); }}
        title="반 변경"
        size="sm"
      >
        <div className="space-y-4">
          <div className="text-center">
            <p className="font-bold text-gray-900">{child.name}</p>
            <p className="text-sm text-gray-500">현재: {className}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">이동할 반 선택</p>
            <div className="grid grid-cols-2 gap-2">
              {classes.filter((cls) => cls.id !== child.classId).map((cls) => (
                <button
                  key={cls.id}
                  onClick={() => setMoveToClassId(cls.id)}
                  className={`py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                    moveToClassId === cls.id ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600"
                  }`}
                >
                  {cls.name} ({cls.ageGroup}세)
                </button>
              ))}
            </div>
          </div>
          <Button fullWidth onClick={handleMoveClass} disabled={!moveToClassId}>이동하기</Button>
        </div>
      </Modal>

      {/* 삭제 확인 모달 */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="원아 삭제"
        size="sm"
      >
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-gray-900 text-lg">{child.name}</p>
            <p className="text-sm text-gray-500 mt-1">정말 삭제하시겠습니까?</p>
            <p className="text-xs text-red-500 mt-2">삭제하면 독서 기록과 뱃지가 모두 사라집니다. 이 작업은 되돌릴 수 없습니다.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" fullWidth onClick={() => setShowDeleteConfirm(false)}>취소</Button>
            <button onClick={handleDelete} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors">삭제하기</button>
          </div>
        </div>
      </Modal>
    </>
  );
}
