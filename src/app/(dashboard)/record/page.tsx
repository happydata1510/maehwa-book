"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/contexts/AuthContext";
import { useBookSearch } from "@/hooks/useBookSearch";
import {
  getChildrenByKindergarten,
  getChildrenByParent,
  addReadingRecord,
  getBookSuggestions,
} from "@/lib/firebase/firestore";
import { Child, NaverBookSearchResult, BadgeDefinition, ReadingFeeling, FEELING_OPTIONS } from "@/types";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Avatar from "@/components/ui/Avatar";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

const BadgeCelebration = dynamic(() => import("@/components/badges/BadgeCelebration"), {
  ssr: false,
});

type InputMode = "manual" | "search";

export default function RecordPage() {
  const { userData } = useAuth();
  const { results, loading: searchLoading, searchByQuery, searchByIsbn, clearResults } = useBookSearch();

  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [selectedChildId, setSelectedChildId] = useState("");
  const [inputMode, setInputMode] = useState<InputMode>("manual");
  const [searchQuery, setSearchQuery] = useState("");
  const [bookTitle, setBookTitle] = useState("");
  const [bookAuthor, setBookAuthor] = useState("");
  const [bookIsbn, setBookIsbn] = useState<string | null>(null);
  const [bookCoverUrl, setBookCoverUrl] = useState<string | null>(null);
  const [bookPublisher, setBookPublisher] = useState<string | null>(null);
  const [readDate, setReadDate] = useState(new Date().toISOString().split("T")[0]);
  const [memo, setMemo] = useState("");
  const [feeling, setFeeling] = useState<ReadingFeeling>(null);

  // 자동완성
  const [suggestions, setSuggestions] = useState<{ title: string; author: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Badge celebration
  const [newBadges, setNewBadges] = useState<BadgeDefinition[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);

  // Success state
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    async function fetchChildren() {
      if (!userData) return;
      try {
        const result =
          userData.role === "parent"
            ? await getChildrenByParent(userData.uid)
            : await getChildrenByKindergarten(userData.kindergartenId);
        setChildren(result);
        if (result.length === 1) {
          setSelectedChildId(result[0].id);
        }
      } catch (error) {
        console.error("Failed to fetch children:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchChildren();
  }, [userData]);

  const selectBook = (book: NaverBookSearchResult) => {
    setBookTitle(book.title.replace(/<[^>]*>/g, ""));
    setBookAuthor(book.author);
    setBookIsbn(book.isbn || null);
    setBookCoverUrl(book.image || null);
    setBookPublisher(book.publisher || null);
    clearResults();
    setSearchQuery("");
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      searchByQuery(searchQuery);
    }
  };

  const resetForm = () => {
    setBookTitle("");
    setBookAuthor("");
    setBookIsbn(null);
    setBookCoverUrl(null);
    setBookPublisher(null);
    setMemo("");
    setFeeling(null);
    clearResults();
    setSearchQuery("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData || !selectedChildId || !bookTitle) return;

    const selectedChild = children.find((c) => c.id === selectedChildId);
    if (!selectedChild) return;

    setSaving(true);
    try {
      const result = await addReadingRecord({
        childId: selectedChildId,
        classId: selectedChild.classId,
        kindergartenId: userData.kindergartenId,
        bookTitle,
        bookAuthor,
        bookIsbn,
        bookCoverUrl,
        bookPublisher,
        readDate: new Date(readDate),
        recordedBy: userData.uid,
        memo: memo || null,
        feeling,
      });

      if (result.newBadges.length > 0) {
        setNewBadges(result.newBadges);
        setShowCelebration(true);
      } else {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
      }

      resetForm();
    } catch (error) {
      console.error("Failed to save:", error);
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header title="독서 기록" />
        <LoadingSpinner />
      </>
    );
  }

  return (
    <>
      <Header title="독서 기록 추가" />
      <div className="px-4 py-4">
        {/* 아이 모드 진입 배너 */}
        <a
          href="/record-kid"
          className="flex items-center gap-3 p-4 mb-5 bg-gradient-to-r from-yellow-50 to-green-50 border-2 border-dashed border-yellow-300 rounded-2xl hover:border-green-400 transition-all"
        >
          <span className="text-3xl">👶</span>
          <div className="flex-1">
            <p className="font-bold text-gray-800">아이가 직접 기록할래요!</p>
            <p className="text-xs text-gray-500">큰 글씨 + 단계별 가이드로 쉽게 입력해요</p>
          </div>
          <span className="text-gray-400">&rarr;</span>
        </a>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Step 1: 아이 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              1. 아이 선택
            </label>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {children.map((child) => (
                <button
                  key={child.id}
                  type="button"
                  onClick={() => setSelectedChildId(child.id)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-2xl border-2 min-w-[80px] transition-all ${
                    selectedChildId === child.id
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200"
                  }`}
                >
                  <Avatar name={child.name} imageUrl={child.profileImageUrl} size="sm" />
                  <span className="text-xs font-medium whitespace-nowrap">
                    {child.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: 책 입력 방법 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              2. 책 정보
            </label>

            {/* 입력 방법 탭 */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-3">
              <button
                type="button"
                onClick={() => setInputMode("manual")}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  inputMode === "manual"
                    ? "bg-white shadow text-green-600"
                    : "text-gray-500"
                }`}
              >
                ✏️ 직접입력
              </button>
              <button
                type="button"
                onClick={() => setInputMode("search")}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  inputMode === "search"
                    ? "bg-white shadow text-green-600"
                    : "text-gray-500"
                }`}
              >
                🔍 검색
              </button>
            </div>

            {/* 검색 모드 */}
            {inputMode === "search" && (
              <div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder="책 제목으로 검색"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleSearch();
                        }
                      }}
                    />
                  </div>
                  <Button type="button" onClick={handleSearch} loading={searchLoading}>
                    검색
                  </Button>
                </div>

                {/* 검색 결과 */}
                {results.length > 0 && (
                  <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
                    {results.map((book, i) => (
                      <Card
                        key={i}
                        hoverable
                        onClick={() => selectBook(book)}
                        className="flex items-center gap-3 p-3"
                      >
                        {book.image ? (
                          <img
                            src={book.image}
                            alt={book.title}
                            className="w-10 h-14 object-cover rounded"
                          />
                        ) : (
                          <div className="w-10 h-14 bg-gray-100 rounded flex items-center justify-center">
                            📕
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-sm font-semibold truncate"
                            dangerouslySetInnerHTML={{
                              __html: book.title,
                            }}
                          />
                          <p className="text-xs text-gray-500 truncate">
                            {book.author}
                          </p>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 책 정보 입력 필드 (항상 표시) */}
            {(
              <div className="space-y-3 mt-3">
                {bookCoverUrl && (
                  <div className="flex justify-center">
                    <img
                      src={bookCoverUrl}
                      alt={bookTitle}
                      className="w-24 h-32 object-cover rounded-xl shadow"
                    />
                  </div>
                )}
                <div className="relative">
                  <Input
                    label="책 제목"
                    placeholder="책 제목을 입력하면 자동 검색됩니다"
                    value={bookTitle}
                    onChange={async (e) => {
                      const val = e.target.value;
                      setBookTitle(val);
                      if (val.length >= 1 && userData) {
                        const results = await getBookSuggestions(userData.kindergartenId, val);
                        setSuggestions(results);
                        setShowSuggestions(results.length > 0);
                      } else {
                        setShowSuggestions(false);
                      }
                    }}
                    onFocus={async () => {
                      if (bookTitle.length >= 1 && userData) {
                        const results = await getBookSuggestions(userData.kindergartenId, bookTitle);
                        setSuggestions(results);
                        setShowSuggestions(results.length > 0);
                      }
                    }}
                    onBlur={() => {
                      setTimeout(() => setShowSuggestions(false), 200);
                    }}
                    required
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border-2 border-green-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      <p className="px-3 py-1.5 text-[10px] text-gray-400 bg-gray-50 rounded-t-xl">
                        우리 유치원에서 읽은 책
                      </p>
                      {suggestions.slice(0, 8).map((s, i) => (
                        <button
                          key={i}
                          type="button"
                          className="w-full text-left px-3 py-2.5 hover:bg-green-50 border-b border-gray-50 last:border-0 transition-colors"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setBookTitle(s.title);
                            setBookAuthor(s.author);
                            setShowSuggestions(false);
                          }}
                        >
                          <p className="text-sm font-medium text-gray-800">{s.title}</p>
                          <p className="text-xs text-gray-500">{s.author}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <Input
                  label="저자"
                  placeholder="저자를 입력하세요"
                  value={bookAuthor}
                  onChange={(e) => setBookAuthor(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Step 3: 읽은 날짜 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              3. 읽은 날짜
            </label>
            <input
              type="date"
              value={readDate}
              onChange={(e) => setReadDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-400 focus:outline-none text-base"
            />
          </div>

          {/* 메모 */}
          {/* 감상 이모지 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              4. 이 책 어땠어? (선택)
            </label>
            <div className="flex gap-2">
              {FEELING_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    setFeeling(feeling === opt.value ? null : opt.value)
                  }
                  className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl border-2 transition-all active:scale-95 ${
                    feeling === opt.value
                      ? "border-green-500 bg-green-50 shadow-sm"
                      : "border-gray-200"
                  }`}
                >
                  <span className="text-2xl">{opt.emoji}</span>
                  <span className="text-[10px] text-gray-600">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 메모 */}
          <Input
            label="메모 (선택)"
            placeholder="간단한 메모를 남겨보세요"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />

          {/* 저장 버튼 */}
          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={saving}
            disabled={!selectedChildId || !bookTitle}
          >
            독서 기록 저장하기
          </Button>
        </form>
      </div>

      {/* 뱃지 축하 */}
      {showCelebration && newBadges.length > 0 && (
        <BadgeCelebration
          badges={newBadges}
          onClose={() => {
            setShowCelebration(false);
            setNewBadges([]);
          }}
        />
      )}

      {/* 성공 토스트 */}
      {showSuccess && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-2xl shadow-lg animate-bounce">
          <span className="font-semibold">독서 기록이 저장되었습니다! 📚</span>
        </div>
      )}
    </>
  );
}
