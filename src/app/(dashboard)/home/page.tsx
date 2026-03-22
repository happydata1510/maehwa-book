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
  getWeeklyGoal,
  setWeeklyGoal as saveWeeklyGoal,
  getThisWeekCount,
  getRecommendedBooks,
  RecommendedBook,
} from "@/lib/firebase/firestore";
import { Child, Class, Message, ReadingRecord, FEELING_OPTIONS } from "@/types";
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
  const [loading, setLoading] = useState(true);

  // 부모 전용 state
  const [streak, setStreak] = useState(0);
  const [weeklyGoalVal, setWeeklyGoalVal] = useState(5);
  const [weeklyProgress, setWeeklyProgressVal] = useState(0);
  const [recentRecords, setRecentRecords] = useState<ReadingRecord[]>([]);
  const [recommendedBooks, setRecommendedBooks] = useState<RecommendedBook[]>([]);

  // 주간 목표 설정 모달
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [tempGoal, setTempGoal] = useState(5);

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

        // 부모: 첫 번째 아이 기준 데이터
        if (!isTeacher && childResult.length > 0) {
          const child = childResult[0];
          const records = await getReadingRecords(child.id, 100);
          setStreak(calculateReadingStreak(records));
          setWeeklyGoalVal(await getWeeklyGoal(child.id));
          setWeeklyProgressVal(getThisWeekCount(records));
          setRecentRecords(records.slice(0, 5));

          const recs = await getRecommendedBooks(child.classId);
          setRecommendedBooks(recs);

          const msgs = await getUnreadMessages([child.id]);
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

  const dismissMessage = () => {
    if (currentMessage) markMessageRead(currentMessage.id);
    const remaining = unreadMessages.filter((m) => m.id !== currentMessage?.id);
    if (remaining.length > 0) {
      setCurrentMessage(remaining[0]);
      setUnreadMessages(remaining);
    } else {
      setShowMessagePopup(false);
      setCurrentMessage(null);
    }
  };

  const handleSaveGoal = async () => {
    if (children.length > 0) {
      await saveWeeklyGoal(children[0].id, tempGoal);
      setWeeklyGoalVal(tempGoal);
    }
    setShowGoalModal(false);
  };

  // ===================== 부모 홈 =====================
  if (!isTeacher) {
    const child = children[0];
    const nextBadge = child ? getNextBadge(child.totalBooksRead) : null;
    const booksUntil = child ? getBooksUntilNextBadge(child.totalBooksRead) : 0;
    const progress = nextBadge ? ((child.totalBooksRead % 100) / 100) * 100 : 100;
    const earnedCount = child
      ? BADGE_DEFINITIONS.filter((b) => child.totalBooksRead >= b.threshold).length
      : 0;
    const weeklyAchieved = weeklyProgress >= weeklyGoalVal;

    return (
      <>
        <Header />
        <div className="px-4 py-3 space-y-4 pb-24">
          {loading ? (
            <LoadingSpinner text="불러오는 중..." />
          ) : !child ? (
            <Card className="text-center py-8">
              <p className="text-gray-500 mb-3">등록된 아이가 없습니다</p>
              <Link href="/children" className="text-green-600 font-semibold text-sm">
                아이 등록하기
              </Link>
            </Card>
          ) : (
            <>
              {/* 1. 기록 버튼 */}
              <div className="grid grid-cols-2 gap-3">
                <Link href="/record">
                  <Card hoverable className="text-center py-4 bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300">
                    <span className="text-2xl">📝</span>
                    <p className="font-bold text-sm mt-1 text-green-800">독서 기록</p>
                  </Card>
                </Link>
                <Link href="/record-kid">
                  <Card hoverable className="text-center py-4 bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-300">
                    <span className="text-2xl">👶</span>
                    <p className="font-bold text-sm mt-1 text-yellow-800">아이가 직접</p>
                  </Card>
                </Link>
              </div>

              {/* 2. 독서량 (최상단 강조) */}
              <Card className="bg-gradient-to-r from-green-500 to-teal-500 text-white border-0 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-xs">{child.name}</p>
                    <p className="text-4xl font-black mt-1">{child.totalBooksRead}<span className="text-lg font-normal">권</span></p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-green-200 text-xs">이번 달</span>
                      <span className="font-bold">{child.monthlyBooksRead}권</span>
                    </div>
                    {streak > 0 && (
                      <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                        {streak}일 연속!
                      </span>
                    )}
                  </div>
                </div>
              </Card>

              {/* 3. 뱃지 진행도 */}
              {nextBadge && (
                <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
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
                    <p className="font-bold text-sm" style={{ color: nextBadge.color }}>
                      {booksUntil}권 남음
                    </p>
                  </div>
                  <div className="h-4 bg-white rounded-full overflow-hidden shadow-inner">
                    <div
                      className="h-full rounded-full transition-all duration-700 relative"
                      style={{ width: `${Math.max(progress, 5)}%`, backgroundColor: nextBadge.color }}
                    >
                      <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-white font-bold">
                        {Math.round(progress)}%
                      </span>
                    </div>
                  </div>
                  {/* 뱃지 미니 컬렉션 */}
                  <div className="flex gap-1 mt-3 justify-center">
                    {BADGE_DEFINITIONS.map((def) => {
                      const earned = child.totalBooksRead >= def.threshold;
                      return (
                        <div
                          key={def.type}
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                            earned
                              ? "bg-yellow-200 border border-yellow-400"
                              : "bg-gray-100 border border-gray-200 opacity-30"
                          }`}
                        >
                          {def.isKing ? "👑" : "🏅"}
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}

              {/* 4. 주간 목표 */}
              <Card>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{weeklyAchieved ? "🎉" : "📖"}</span>
                    <span className="font-bold text-sm text-gray-800">이번 주 목표</span>
                  </div>
                  <button
                    onClick={() => { setTempGoal(weeklyGoalVal); setShowGoalModal(true); }}
                    className="text-xs text-blue-600"
                  >
                    목표 변경
                  </button>
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: weeklyGoalVal }).map((_, i) => (
                    <div
                      key={i}
                      className={`flex-1 h-10 rounded-xl flex items-center justify-center text-xl transition-all ${
                        i < weeklyProgress ? "bg-green-400 shadow-sm" : "bg-gray-100"
                      }`}
                    >
                      {i < weeklyProgress ? "⭐" : ""}
                    </div>
                  ))}
                </div>
                <p className="text-center text-xs text-gray-500 mt-2">
                  {weeklyAchieved
                    ? "이번 주 목표 달성! 대단해요!"
                    : `${weeklyGoalVal - weeklyProgress}권 더 읽으면 목표 달성!`}
                </p>
              </Card>

              {/* 5. 달력 스티커 */}
              <Card>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-sm text-gray-800">이번 달 독서 달력</h3>
                  <Link href={`/children/${child.id}/calendar`} className="text-xs text-blue-600">
                    상세보기
                  </Link>
                </div>
                {(() => {
                  const now = new Date();
                  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
                  const today = now.getDate();
                  const readDays = new Set<number>();
                  for (let i = 0; i < Math.min(streak, today); i++) readDays.add(today - i);
                  const monthly = child.monthlyBooksRead || 0;
                  for (let i = 0; i < Math.min(monthly, daysInMonth); i++) readDays.add(Math.max(1, today - i * 2));

                  return (
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const isRead = readDays.has(day);
                        const isToday = day === today;
                        const isFuture = day > today;
                        return (
                          <div
                            key={day}
                            className={`aspect-square rounded-lg flex items-center justify-center text-[10px] ${
                              isToday ? "ring-2 ring-green-400" : ""
                            } ${isFuture ? "bg-gray-50 text-gray-300" : isRead ? "bg-green-100" : "bg-gray-50"}`}
                          >
                            {isRead ? "⭐" : <span className={isFuture ? "text-gray-300" : "text-gray-400"}>{day}</span>}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </Card>

              {/* 6. 추천도서 */}
              {recommendedBooks.length > 0 && (
                <Card className="border-blue-200 bg-blue-50/50">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">📚</span>
                    <h3 className="font-bold text-sm text-blue-800">선생님 추천도서</h3>
                  </div>
                  <div className="space-y-1.5">
                    {recommendedBooks.slice(0, 3).map((book) => (
                      <div key={book.id} className="flex items-center gap-2 bg-white rounded-xl p-2">
                        <span className="text-lg">📕</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-xs text-gray-800 truncate">{book.title}</p>
                          <p className="text-[10px] text-blue-600 truncate">{book.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* 7. 최근 기록 + 바로가기 */}
              <div className="grid grid-cols-2 gap-3">
                <Link href={`/children/${child.id}`}>
                  <Card hoverable className="text-center py-3">
                    <span className="text-lg">📊</span>
                    <p className="font-semibold text-xs mt-1 text-gray-800">상세 현황</p>
                  </Card>
                </Link>
                <Link href={`/report/${child.id}`}>
                  <Card hoverable className="text-center py-3">
                    <span className="text-lg">📋</span>
                    <p className="font-semibold text-xs mt-1 text-gray-800">월간 리포트</p>
                  </Card>
                </Link>
              </div>

              {/* 8. 최근 읽은 책 */}
              {recentRecords.length > 0 && (
                <div>
                  <h3 className="font-bold text-sm text-gray-800 mb-2">최근 읽은 책</h3>
                  <div className="space-y-2">
                    {recentRecords.map((rec) => (
                      <Card key={rec.id} className="flex items-center gap-3 py-2.5">
                        <div className="w-8 h-10 bg-gray-100 rounded flex items-center justify-center text-sm">
                          📕
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-xs text-gray-800 truncate">{rec.bookTitle}</p>
                          <p className="text-[10px] text-gray-500">{rec.bookAuthor}</p>
                        </div>
                        {rec.feeling && (
                          <span className="text-sm">
                            {FEELING_OPTIONS.find((f) => f.value === rec.feeling)?.emoji}
                          </span>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* 9. 도서관 */}
              <Link href="/library">
                <Card hoverable className="flex items-center gap-3 bg-purple-50 border-purple-200">
                  <span className="text-2xl">📚</span>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-purple-800">우리 도서관</p>
                    <p className="text-[10px] text-purple-600">모든 아이가 읽은 책 검색</p>
                  </div>
                </Card>
              </Link>
            </>
          )}
        </div>

        {/* 주간 목표 설정 모달 */}
        <Modal isOpen={showGoalModal} onClose={() => setShowGoalModal(false)} title="주간 독서 목표" size="sm">
          <div className="text-center space-y-4">
            <p className="text-sm text-gray-600">매주 몇 권을 읽을까요?</p>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setTempGoal(Math.max(1, tempGoal - 1))}
                className="w-10 h-10 rounded-full bg-gray-100 text-xl font-bold text-gray-600"
              >
                -
              </button>
              <span className="text-4xl font-black text-green-600">{tempGoal}</span>
              <button
                onClick={() => setTempGoal(Math.min(20, tempGoal + 1))}
                className="w-10 h-10 rounded-full bg-gray-100 text-xl font-bold text-gray-600"
              >
                +
              </button>
            </div>
            <p className="text-xs text-gray-500">권</p>
            <Button onClick={handleSaveGoal} fullWidth>
              저장
            </Button>
          </div>
        </Modal>

        {/* 선생님 메시지 팝업 */}
        <Modal
          isOpen={showMessagePopup && currentMessage !== null}
          onClose={dismissMessage}
          title="선생님이 보낸 메시지"
          size="sm"
        >
          {currentMessage && (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl">💌</span>
              </div>
              <p className="text-sm text-gray-500">{currentMessage.fromName} 선생님</p>
              <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                {currentMessage.content}
              </p>
              <Button onClick={dismissMessage} fullWidth size="sm">
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
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            안녕하세요, {userData?.displayName}님! 👋
          </h2>
          <p className="text-gray-500 text-sm mt-1">선생님</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-gradient-to-br from-green-400 to-green-600 text-white border-0">
            <p className="text-green-100 text-sm">유치원 전체</p>
            <p className="text-3xl font-bold mt-1">{totalBooks}<span className="text-lg font-normal">권</span></p>
          </Card>
          <Card className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white border-0">
            <p className="text-yellow-100 text-sm">이번 달</p>
            <p className="text-3xl font-bold mt-1">{totalMonthly}<span className="text-lg font-normal">권</span></p>
          </Card>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Link href="/manage">
            <Card hoverable className="text-center py-4">
              <span className="text-2xl">📋</span>
              <p className="font-semibold text-xs mt-1 text-gray-800">기록 관리</p>
            </Card>
          </Link>
          <Link href="/recommend">
            <Card hoverable className="text-center py-4">
              <span className="text-2xl">📚</span>
              <p className="font-semibold text-xs mt-1 text-gray-800">추천도서</p>
            </Card>
          </Link>
          <Link href="/classes">
            <Card hoverable className="text-center py-4">
              <span className="text-2xl">🏫</span>
              <p className="font-semibold text-xs mt-1 text-gray-800">반 관리</p>
            </Card>
          </Link>
        </div>

        <Link href="/library">
          <Card hoverable className="flex items-center gap-3 bg-purple-50 border-purple-200">
            <span className="text-2xl">📚</span>
            <div className="flex-1">
              <p className="font-semibold text-purple-800">우리 도서관</p>
              <p className="text-xs text-purple-600">전체 독서 이력 검색</p>
            </div>
          </Card>
        </Link>

        {/* 아이 목록 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900">아이들 현황</h3>
            <Link href="/children" className="text-sm text-green-600 font-medium">전체보기</Link>
          </div>
          {loading ? (
            <LoadingSpinner text="불러오는 중..." />
          ) : (
            <div className="space-y-3">
              {children.slice(0, 6).map((child) => {
                const nb = getNextBadge(child.totalBooksRead);
                const bu = getBooksUntilNextBadge(child.totalBooksRead);
                const pr = nb ? ((child.totalBooksRead % 100) / 100) * 100 : 100;
                return (
                  <Link key={child.id} href={`/children/${child.id}`}>
                    <Card hoverable className="flex items-center gap-3">
                      <Avatar name={child.name} imageUrl={child.profileImageUrl} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm text-gray-900">{child.name}</p>
                          <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                            {getClassName(child.classId)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {child.totalBooksRead}권 · 이번달 {child.monthlyBooksRead}권
                        </p>
                        {nb && (
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1">
                            <div className="h-full bg-green-400 rounded-full" style={{ width: `${pr}%` }} />
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
