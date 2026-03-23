"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuth } from "@/contexts/AuthContext";
import {
  getChildrenByKindergarten,
  getChildrenByParent,
  addReadingRecord,
} from "@/lib/firebase/firestore";
import { Child, BadgeDefinition, ReadingFeeling, FEELING_OPTIONS } from "@/types";
import Avatar from "@/components/ui/Avatar";

const BadgeCelebration = dynamic(
  () => import("@/components/badges/BadgeCelebration"),
  { ssr: false }
);

type Step = "child" | "title" | "author" | "feeling" | "confirm" | "done";

export default function KidRecordPage() {
  const { userData } = useAuth();
  const router = useRouter();
  const [children, setChildren] = useState<Child[]>([]);
  const [step, setStep] = useState<Step>("child");
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [bookTitle, setBookTitle] = useState("");
  const [bookAuthor, setBookAuthor] = useState("");
  const [feeling, setFeeling] = useState<ReadingFeeling>(null);
  const [saving, setSaving] = useState(false);
  const [newBadges, setNewBadges] = useState<BadgeDefinition[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    async function fetchChildren() {
      if (!userData) return;
      const result =
        userData.role === "parent"
          ? await getChildrenByParent(userData.uid)
          : await getChildrenByKindergarten(userData.kindergartenId);
      setChildren(result);
    }
    fetchChildren();
  }, [userData]);

  const handleSelectChild = (child: Child) => {
    setSelectedChild(child);
    setStep("title");
  };

  const handleTitleNext = () => {
    if (bookTitle.trim()) setStep("author");
  };

  const handleAuthorNext = () => {
    setStep("feeling");
  };

  const handleFeelingNext = () => {
    setStep("confirm");
  };

  const handleSave = async () => {
    if (!userData || !selectedChild || !bookTitle.trim()) return;
    setSaving(true);
    try {
      const result = await addReadingRecord({
        childId: selectedChild.id,
        classId: selectedChild.classId,
        kindergartenId: userData.kindergartenId,
        bookTitle: bookTitle.trim(),
        bookAuthor: bookAuthor.trim() || "모름",
        bookIsbn: null,
        bookCoverUrl: null,
        bookPublisher: null,
        readDate: new Date(),
        recordedBy: userData.uid,
        memo: "(아이가 직접 입력)",
        feeling,
      });

      if (result.newBadges.length > 0) {
        setNewBadges(result.newBadges);
        setShowCelebration(true);
      } else {
        setStep("done");
      }
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setStep("child");
    setSelectedChild(null);
    setBookTitle("");
    setBookAuthor("");
    setFeeling(null);
    setNewBadges([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-green-50 flex flex-col">
      {/* 상단 바 */}
      <div className="flex items-center justify-between p-4">
        <button
          onClick={() => router.back()}
          className="text-gray-500 text-sm px-3 py-1.5 rounded-lg bg-white/70"
        >
          &larr; 돌아가기
        </button>
        <span className="text-sm font-medium text-green-700 bg-green-100 px-3 py-1 rounded-full">
          아이 모드
        </span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
        {/* ===== Step 1: 아이 선택 ===== */}
        {step === "child" && (
          <div className="w-full max-w-sm text-center space-y-6">
            <div>
              <p className="text-3xl mb-2">👋</p>
              <h1 className="text-2xl font-bold text-gray-800">
                안녕! 누구야?
              </h1>
              <p className="text-gray-500 mt-1">이름을 눌러줘!</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {children.map((child) => (
                <button
                  key={child.id}
                  onClick={() => handleSelectChild(child)}
                  className="flex flex-col items-center gap-2 p-5 bg-white rounded-3xl border-3 border-gray-200 hover:border-green-400 hover:bg-green-50 transition-all active:scale-95 shadow-sm"
                >
                  <Avatar
                    name={child.name}
                    imageUrl={child.profileImageUrl}
                    size="lg"
                  />
                  <span className="text-lg font-bold text-gray-800">
                    {child.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ===== Step 2: 책 제목 입력 ===== */}
        {step === "title" && (
          <div className="w-full max-w-sm text-center space-y-6">
            <div>
              <p className="text-3xl mb-2">📖</p>
              <h1 className="text-2xl font-bold text-gray-800">
                어떤 책을 읽었어?
              </h1>
              <p className="text-gray-500 mt-1">책 이름을 써줘!</p>
            </div>

            <div className="bg-white rounded-3xl p-4 shadow-sm">
              <input
                type="text"
                value={bookTitle}
                onChange={(e) => setBookTitle(e.target.value)}
                placeholder="예: 구름빵"
                autoFocus
                className="w-full text-center text-2xl font-bold text-gray-800 bg-transparent outline-none placeholder:text-gray-300 py-4"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleTitleNext();
                }}
              />
            </div>

            <div className="bg-yellow-50 rounded-2xl p-3 text-sm text-yellow-700">
              <p className="font-medium">TIP!</p>
              <p>책 표지에 있는 제목을 그대로 써봐요</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep("child")}
                className="flex-1 py-4 rounded-2xl bg-gray-100 text-gray-600 font-bold text-lg active:scale-95 transition-transform"
              >
                &larr; 이전
              </button>
              <button
                onClick={handleTitleNext}
                disabled={!bookTitle.trim()}
                className="flex-1 py-4 rounded-2xl bg-green-500 text-white font-bold text-lg disabled:opacity-40 active:scale-95 transition-transform"
              >
                다음 &rarr;
              </button>
            </div>
          </div>
        )}

        {/* ===== Step 3: 저자 입력 (선택) ===== */}
        {step === "author" && (
          <div className="w-full max-w-sm text-center space-y-6">
            <div>
              <p className="text-3xl mb-2">✏️</p>
              <h1 className="text-2xl font-bold text-gray-800">
                누가 쓴 책이야?
              </h1>
              <p className="text-gray-500 mt-1">
                몰라도 괜찮아! 건너뛰기 눌러도 돼
              </p>
            </div>

            <div className="bg-white rounded-3xl p-4 shadow-sm">
              <input
                type="text"
                value={bookAuthor}
                onChange={(e) => setBookAuthor(e.target.value)}
                placeholder="예: 백희나"
                autoFocus
                className="w-full text-center text-2xl font-bold text-gray-800 bg-transparent outline-none placeholder:text-gray-300 py-4"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAuthorNext();
                }}
              />
            </div>

            <div className="bg-blue-50 rounded-2xl p-3 text-sm text-blue-700">
              <p className="font-medium">TIP!</p>
              <p>책 표지 아래에 글쓴이 이름이 있어요</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep("title")}
                className="flex-1 py-4 rounded-2xl bg-gray-100 text-gray-600 font-bold text-lg active:scale-95 transition-transform"
              >
                &larr; 이전
              </button>
              <button
                onClick={handleAuthorNext}
                className="flex-1 py-4 rounded-2xl bg-green-500 text-white font-bold text-lg active:scale-95 transition-transform"
              >
                {bookAuthor.trim() ? "다음 →" : "건너뛰기 →"}
              </button>
            </div>
          </div>
        )}

        {/* ===== Step 4: 감상 이모지 ===== */}
        {step === "feeling" && (
          <div className="w-full max-w-sm text-center space-y-6">
            <div>
              <p className="text-3xl mb-2">💭</p>
              <h1 className="text-2xl font-bold text-gray-800">
                책을 읽고 어땠어?
              </h1>
              <p className="text-gray-500 mt-1">느낌을 골라줘!</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {FEELING_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFeeling(opt.value)}
                  className={`flex items-center gap-4 p-4 rounded-2xl border-3 text-left transition-all active:scale-95 ${
                    feeling === opt.value
                      ? "border-green-400 bg-green-50 shadow-sm"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <span className="text-4xl">{opt.emoji}</span>
                  <span className="text-lg font-bold text-gray-800">{opt.label}</span>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep("author")}
                className="flex-1 py-4 rounded-2xl bg-gray-100 text-gray-600 font-bold text-lg active:scale-95 transition-transform"
              >
                &larr; 이전
              </button>
              <button
                onClick={handleFeelingNext}
                className="flex-1 py-4 rounded-2xl bg-green-500 text-white font-bold text-lg active:scale-95 transition-transform"
              >
                {feeling ? "다음 →" : "건너뛰기 →"}
              </button>
            </div>
          </div>
        )}

        {/* ===== Step 5: 확인 ===== */}
        {step === "confirm" && (
          <div className="w-full max-w-sm text-center space-y-6">
            <div>
              <p className="text-3xl mb-2">🎉</p>
              <h1 className="text-2xl font-bold text-gray-800">맞는지 확인해줘!</h1>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm space-y-4">
              <div>
                <p className="text-sm text-gray-400">읽은 사람</p>
                <p className="text-xl font-bold text-gray-800">
                  {selectedChild?.name}
                </p>
              </div>
              <div className="h-px bg-gray-100" />
              <div>
                <p className="text-sm text-gray-400">책 이름</p>
                <p className="text-xl font-bold text-gray-800">{bookTitle}</p>
              </div>
              {bookAuthor.trim() && (
                <>
                  <div className="h-px bg-gray-100" />
                  <div>
                    <p className="text-sm text-gray-400">글쓴이</p>
                    <p className="text-xl font-bold text-gray-800">
                      {bookAuthor}
                    </p>
                  </div>
                </>
              )}
              {feeling && (
                <>
                  <div className="h-px bg-gray-100" />
                  <div>
                    <p className="text-sm text-gray-400">느낌</p>
                    <p className="text-xl">
                      {FEELING_OPTIONS.find((f) => f.value === feeling)?.emoji}{" "}
                      <span className="font-bold text-gray-800">
                        {FEELING_OPTIONS.find((f) => f.value === feeling)?.label}
                      </span>
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep("feeling")}
                className="flex-1 py-4 rounded-2xl bg-gray-100 text-gray-600 font-bold text-lg active:scale-95 transition-transform"
              >
                수정하기
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-4 rounded-2xl bg-green-500 text-white font-bold text-lg disabled:opacity-60 active:scale-95 transition-transform"
              >
                {saving ? "저장 중..." : "저장하기!"}
              </button>
            </div>
          </div>
        )}

        {/* ===== Step 5: 완료 ===== */}
        {step === "done" && (
          <div className="w-full max-w-sm text-center space-y-6">
            <div>
              <p className="text-6xl mb-4">📚</p>
              <h1 className="text-2xl font-bold text-gray-800">잘했어!</h1>
              <p className="text-lg text-gray-500 mt-2">
                <span className="font-bold text-green-600">
                  {selectedChild?.name}
                </span>
                이(가) &ldquo;{bookTitle}&rdquo; 을 읽었어요!
              </p>
              <p className="text-sm text-gray-400 mt-1">
                지금까지 총{" "}
                <span className="font-bold text-green-600">
                  {(selectedChild?.totalBooksRead || 0) + 1}
                </span>
                권 읽었어요!
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 py-4 rounded-2xl bg-green-500 text-white font-bold text-lg active:scale-95 transition-transform"
              >
                한 권 더 기록하기!
              </button>
            </div>
            <button
              onClick={() => router.push("/home")}
              className="text-gray-400 text-sm"
            >
              홈으로 돌아가기
            </button>
          </div>
        )}
      </div>

      {/* 뱃지 축하 */}
      {showCelebration && newBadges.length > 0 && (
        <BadgeCelebration
          badges={newBadges}
          onClose={() => {
            setShowCelebration(false);
            setNewBadges([]);
            setStep("done");
          }}
        />
      )}
    </div>
  );
}
