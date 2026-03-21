"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getAllBooksInLibrary, LibraryBook } from "@/lib/firebase/firestore";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function LibraryPage() {
  const { userData } = useAuth();
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBooks() {
      if (!userData) return;
      try {
        const result = await getAllBooksInLibrary(userData.kindergartenId);
        setBooks(result);
      } catch (error) {
        console.error("Failed to fetch library:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchBooks();
  }, [userData]);

  const filtered = searchQuery.trim()
    ? books.filter(
        (b) =>
          b.title.includes(searchQuery) ||
          b.author.includes(searchQuery)
      )
    : books;

  const totalUniqueBooks = books.length;
  const totalReads = books.reduce((s, b) => s + b.totalReads, 0);

  if (loading) {
    return (
      <>
        <Header title="우리 도서관" showBack />
        <LoadingSpinner text="도서관 불러오는 중..." />
      </>
    );
  }

  return (
    <>
      <Header title="우리 도서관" showBack />
      <div className="px-4 py-4 space-y-5">
        {/* 도서관 통계 */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="text-center bg-gradient-to-br from-purple-400 to-purple-600 text-white border-0">
            <p className="text-purple-100 text-xs">보유 도서</p>
            <p className="text-2xl font-bold">{totalUniqueBooks}</p>
            <p className="text-purple-200 text-xs">종</p>
          </Card>
          <Card className="text-center bg-gradient-to-br from-indigo-400 to-indigo-600 text-white border-0">
            <p className="text-indigo-100 text-xs">총 대출 횟수</p>
            <p className="text-2xl font-bold">{totalReads}</p>
            <p className="text-indigo-200 text-xs">회</p>
          </Card>
        </div>

        {/* 검색 */}
        <Input
          placeholder="책 제목이나 저자로 검색해보세요"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {/* 도서 목록 */}
        <div>
          <h3 className="font-bold text-gray-900 mb-3">
            {searchQuery ? `검색 결과 (${filtered.length}건)` : `전체 도서 (${filtered.length}종)`}
          </h3>
          {filtered.length === 0 ? (
            <Card className="text-center py-8">
              <p className="text-gray-500">
                {searchQuery ? "검색 결과가 없습니다" : "아직 등록된 도서가 없습니다"}
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {filtered.map((book, i) => (
                <Card key={i} className="space-y-2">
                  <div className="flex items-start gap-3">
                    {book.coverUrl ? (
                      <img
                        src={book.coverUrl}
                        alt={book.title}
                        className="w-12 h-16 object-cover rounded-lg flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-16 bg-gradient-to-b from-purple-100 to-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl">📕</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900">{book.title}</p>
                      <p className="text-sm text-gray-500">{book.author}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                          {book.totalReads}회 읽힘
                        </span>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          {book.readByChildren.length}명이 읽음
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 누가 읽었는지 */}
                  <div className="flex flex-wrap gap-1 ml-15">
                    {book.readByChildren.map((reader, j) => (
                      <Link
                        key={j}
                        href={`/children/${reader.childId}`}
                        className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full hover:bg-gray-200 transition-colors"
                      >
                        {reader.childName}
                      </Link>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
