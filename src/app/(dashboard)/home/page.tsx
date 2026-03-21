"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  getChildrenByKindergarten,
  getChildrenByParent,
  getClassesByKindergarten,
  getReadingRecords,
  calculateReadingStreak,
  getUnreadMessages,
  markMessageRead,
} from "@/lib/firebase/firestore";
import { Child, Class, Message } from "@/types";
import { BADGE_DEFINITIONS, getNextBadge, getBooksUntilNextBadge } from "@/lib/badge-rules";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
import Avatar from "@/components/ui/Avatar";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function HomePage() {
  const { userData } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [streaks, setStreaks] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // 메시지 팝업
  const [unreadMessages, setUnreadMessages] = useState<Message[]>([]);
  const [showMessagePopup, setShowMessagePopup] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<Message | null>(null);

  const isTeacher = userData?.role === "teacher" || userData?.role === "admin";

  useEffect(() => {
    async function fetchData() {
      if (!userData) return;
      try {
        const [childResult, classResult] = await Promise.all([
          isTeacher
            ? getChildrenByKindergarten(userData.kindergartenId)
            : getChildrenByParent(userData.uid),
          getClassesByKindergarten(userData.kindergartenId),
        ]);
        setChildren(childResult);
        setClasses(classResult);

        if (!isTeacher) {
          const streakData: Record<string, number> = {};
          await Promise.all(
            childResult.map(async (child) => {
              const records = await getReadingRecords(child.id, 100);
              streakData[child.id] = calculateReadingStreak(records);
            })
          );
          setStreaks(streakData);

          // 읽지 않은 메시지 확인
          const childIds = childResult.map((c) => c.id);
          const msgs = await getUnreadMessages(childIds);
          if (msgs.length > 0) {
            setUnreadMessages(msgs);
            setCurrentMessage(msgs[0]);
            setShowMessagePopup(true);
          }
        }
      } catch (error) {
        console.error("Failed to fetch:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [userData, isTeacher]);

  const totalBooks = children.reduce((sum, c) => sum + (c.totalBooksRead || 0), 0);
  const totalMonthly = children.reduce((sum, c) => sum + (c.monthlyBooksRead || 0), 0);
  const getClassName = (classId: string) =>
    classes.find((c) => c.id === classId)?.name || "";

  // ===================== 부모 홈 =====================
  if (!isTeacher) {
    return (
      <>
        <Header />
        <div className="px-4 py-4 space-y-5">
          {/* 환영 */}
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              안녕하세요, {userData?.displayName}님! 👋
            </h2>
            <p className="text-gray-500 text-sm mt-1">학부모</p>
          </div>

          {/* ===== 1) 기록 버튼 (맨 위) ===== */}
          <div className="grid grid-cols-2 gap-3">
            <Link href="/record">
              <Card hoverable className="text-center py-5 bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300">
                <span className="text-3xl">📝</span>
                <p className="font-bold text-base mt-2 text-green-800">독서 기록하기</p>
                <p className="text-xs text-green-600 mt-0.5">직접입력 / 검색 / 바코드</p>
              </Card>
            </Link>
            <Link href="/record-kid">
              <Card hoverable className="text-center py-5 bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-300">
                <span className="text-3xl">👶</span>
                <p className="font-bold text-base mt-2 text-yellow-800">아이가 직접!</p>
                <p className="text-xs text-yellow-600 mt-0.5">큰 글씨 가이드 모드</p>
              </Card>
            </Link>
          </div>

          {/* ===== 2) 독서량 통계 ===== */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-gradient-to-br from-green-400 to-green-600 text-white border-0">
              <p className="text-green-100 text-sm">전체 독서량</p>
              <p className="text-3xl font-bold mt-1">
                {totalBooks}<span className="text-lg font-normal">권</span>
              </p>
            </Card>
            <Card className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white border-0">
              <p className="text-yellow-100 text-sm">이번 달</p>
              <p className="text-3xl font-bold mt-1">
                {totalMonthly}<span className="text-lg font-normal">권</span>
              </p>
            </Card>
          </div>

          {/* ===== 3) 아이별 뱃지 진행도 + 현황 ===== */}
          {loading ? (
            <LoadingSpinner text="불러오는 중..." />
          ) : children.length === 0 ? (
            <Card className="text-center py-8">
              <p className="text-gray-500 mb-3">등록된 아이가 없습니다</p>
              <Link href="/children" className="text-green-600 font-semibold text-sm hover:underline">
                아이 등록하기
              </Link>
            </Card>
          ) : (
            <div className="space-y-3">
              {children.map((child) => {
                const nextBadge = getNextBadge(child.totalBooksRead);
                const booksUntil = getBooksUntilNextBadge(child.totalBooksRead);
                const progress = nextBadge
                  ? ((child.totalBooksRead % 100) / 100) * 100
                  : 100;
                const earnedCount = BADGE_DEFINITIONS.filter(
                  (b) => child.totalBooksRead >= b.threshold
                ).length;
                const streak = streaks[child.id] || 0;

                return (
                  <Card key={child.id} className="border-2 border-green-100 bg-gradient-to-r from-green-50 to-yellow-50">
                    {/* 아이 이름 + 태그 */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={child.name} imageUrl={child.profileImageUrl} size="md" />
                        <div>
                          <p className="font-bold text-gray-900">{child.name}</p>
                          <p className="text-xs text-gray-500">
                            총 {child.totalBooksRead}권 · 이번 달 {child.monthlyBooksRead}권
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {streak > 0 && (
                          <span className="text-[10px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-semibold">
                            {streak}일 연속!
                          </span>
                        )}
                        <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-semibold">
                          {earnedCount > 0 ? `${earnedCount > 9 ? "👑" : "🏅"} ${earnedCount}개` : "뱃지 도전중"}
                        </span>
                      </div>
                    </div>

                    {/* 뱃지 진행도 - 100권 마일스톤 강조 */}
                    {nextBadge ? (
                      <div className="bg-white rounded-2xl p-3 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{nextBadge.isKing ? "👑" : "🏅"}</span>
                            <div>
                              <p className="text-xs text-gray-500">다음 목표</p>
                              <p className="font-bold text-sm" style={{ color: nextBadge.color }}>
                                {nextBadge.threshold}권 뱃지
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-black text-gray-800">{child.totalBooksRead}</p>
                            <p className="text-[10px] text-gray-400">/ {nextBadge.threshold}권</p>
                          </div>
                        </div>
                        <div className="h-5 bg-gray-100 rounded-full overflow-hidden shadow-inner relative">
                          <div
                            className="h-full rounded-full transition-all duration-700 relative"
                            style={{
                              width: `${Math.max(progress, 5)}%`,
                              backgroundColor: nextBadge.color,
                            }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/30 rounded-full" />
                            <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-white font-bold">
                              {Math.round(progress)}%
                            </span>
                          </div>
                        </div>
                        <p className="text-center text-xs text-gray-500 mt-1.5">
                          <span className="font-bold" style={{ color: nextBadge.color }}>{booksUntil}권</span> 더 읽으면 뱃지 획득!
                        </p>
                      </div>
                    ) : (
                      <div className="bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-2xl p-4 text-center">
                        <span className="text-3xl">👑</span>
                        <p className="font-bold text-yellow-800 mt-1">
                          모든 뱃지를 획득했어요! 🎉
                        </p>
                      </div>
                    )}

                    {/* 빠른 링크 */}
                    <div className="flex gap-2 mt-3">
                      <Link
                        href={`/children/${child.id}`}
                        className="flex-1 text-center text-xs py-1.5 rounded-lg bg-white text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        상세보기
                      </Link>
                      <Link
                        href={`/children/${child.id}/calendar`}
                        className="flex-1 text-center text-xs py-1.5 rounded-lg bg-white text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        월별 캘린더
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* ===== 4) 도서관 바로가기 ===== */}
          <Link href="/library">
            <Card hoverable className="flex items-center gap-3 bg-purple-50 border-purple-200">
              <span className="text-3xl">📚</span>
              <div className="flex-1">
                <p className="font-semibold text-purple-800">우리 도서관</p>
                <p className="text-xs text-purple-600">모든 아이가 읽은 책을 검색해보세요</p>
              </div>
              <svg className="w-5 h-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Card>
          </Link>
        </div>

        {/* ===== 선생님 메시지 팝업 ===== */}
        <Modal
          isOpen={showMessagePopup && currentMessage !== null}
          onClose={() => {
            if (currentMessage) {
              markMessageRead(currentMessage.id);
            }
            const remaining = unreadMessages.filter((m) => m.id !== currentMessage?.id);
            if (remaining.length > 0) {
              setCurrentMessage(remaining[0]);
              setUnreadMessages(remaining);
            } else {
              setShowMessagePopup(false);
              setCurrentMessage(null);
            }
          }}
          title="선생님이 보낸 메시지"
          size="sm"
        >
          {currentMessage && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <span className="text-3xl">💌</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">
                  {currentMessage.fromName} 선생님
                </p>
                <p className="text-base text-gray-800 mt-2 leading-relaxed whitespace-pre-wrap">
                  {currentMessage.content}
                </p>
                <p className="text-xs text-gray-400 mt-3">
                  {currentMessage.createdAt?.toDate?.()
                    ? currentMessage.createdAt.toDate().toLocaleDateString("ko-KR", {
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : ""}
                </p>
              </div>
              <Button
                onClick={() => {
                  if (currentMessage) markMessageRead(currentMessage.id);
                  const remaining = unreadMessages.filter(
                    (m) => m.id !== currentMessage?.id
                  );
                  if (remaining.length > 0) {
                    setCurrentMessage(remaining[0]);
                    setUnreadMessages(remaining);
                  } else {
                    setShowMessagePopup(false);
                    setCurrentMessage(null);
                  }
                }}
                fullWidth
              >
                {unreadMessages.length > 1 ? `확인 (${unreadMessages.length - 1}개 더)` : "확인했어요"}
              </Button>
            </div>
          )}
        </Modal>
      </>
    );
  }

  // ===================== 선생님 홈 =====================
  return (
    <>
      <Header />
      <div className="px-4 py-4 space-y-5">
        {/* 환영 */}
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            안녕하세요, {userData?.displayName}님! 👋
          </h2>
          <p className="text-gray-500 text-sm mt-1">선생님</p>
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-gradient-to-br from-green-400 to-green-600 text-white border-0">
            <p className="text-green-100 text-sm">유치원 전체</p>
            <p className="text-3xl font-bold mt-1">
              {totalBooks}<span className="text-lg font-normal">권</span>
            </p>
          </Card>
          <Card className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white border-0">
            <p className="text-yellow-100 text-sm">이번 달</p>
            <p className="text-3xl font-bold mt-1">
              {totalMonthly}<span className="text-lg font-normal">권</span>
            </p>
          </Card>
        </div>

        {/* 관리 메뉴 */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/manage">
            <Card hoverable className="text-center py-4">
              <span className="text-2xl">📋</span>
              <p className="font-semibold text-sm mt-1 text-gray-800">기록 관리</p>
              <p className="text-xs text-gray-500">부모님이 입력한 기록 확인</p>
            </Card>
          </Link>
          <Link href="/classes">
            <Card hoverable className="text-center py-4">
              <span className="text-2xl">🏫</span>
              <p className="font-semibold text-sm mt-1 text-gray-800">반 관리</p>
              <p className="text-xs text-gray-500">{classes.length}개 반</p>
            </Card>
          </Link>
        </div>

        {/* 도서관 */}
        <Link href="/library">
          <Card hoverable className="flex items-center gap-3 bg-purple-50 border-purple-200">
            <span className="text-3xl">📚</span>
            <div className="flex-1">
              <p className="font-semibold text-purple-800">우리 도서관</p>
              <p className="text-xs text-purple-600">모든 아이가 읽은 책을 검색해보세요</p>
            </div>
            <svg className="w-5 h-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Card>
        </Link>

        {/* 아이 목록 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900">아이들 현황</h3>
            <Link href="/children" className="text-sm text-green-600 font-medium">
              전체보기
            </Link>
          </div>

          {loading ? (
            <LoadingSpinner text="불러오는 중..." />
          ) : (
            <div className="space-y-3">
              {children.slice(0, 6).map((child) => {
                const nextBadge = getNextBadge(child.totalBooksRead);
                const booksUntil = getBooksUntilNextBadge(child.totalBooksRead);
                const progress = nextBadge
                  ? ((child.totalBooksRead % 100) / 100) * 100
                  : 100;

                return (
                  <Link key={child.id} href={`/children/${child.id}`}>
                    <Card hoverable className="flex items-center gap-4">
                      <Avatar name={child.name} imageUrl={child.profileImageUrl} size="lg" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-900">{child.name}</p>
                          <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                            {getClassName(child.classId)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          총 {child.totalBooksRead}권 · 이번 달 {child.monthlyBooksRead}권
                        </p>
                        {nextBadge && (
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                              <span>다음 뱃지까지</span>
                              <span>{booksUntil}권 남음</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-400 rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
