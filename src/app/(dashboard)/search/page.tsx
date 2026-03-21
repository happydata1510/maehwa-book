"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useBookSearch } from "@/hooks/useBookSearch";
import { getPopularBooks } from "@/lib/firebase/firestore";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function SearchPage() {
  const { userData } = useAuth();
  const { results, loading, searchByQuery } = useBookSearch();
  const [query, setQuery] = useState("");
  const [popularBooks, setPopularBooks] = useState<
    { title: string; author: string; coverUrl: string; count: number }[]
  >([]);
  const [loadingPopular, setLoadingPopular] = useState(true);

  useEffect(() => {
    async function fetchPopular() {
      if (!userData) return;
      try {
        const books = await getPopularBooks(userData.kindergartenId);
        setPopularBooks(books);
      } catch (error) {
        console.error("Failed to fetch popular books:", error);
      } finally {
        setLoadingPopular(false);
      }
    }
    fetchPopular();
  }, [userData]);

  const handleSearch = () => {
    if (query.trim()) {
      searchByQuery(query);
    }
  };

  return (
    <>
      <Header title="책 검색" />
      <div className="px-4 py-4 space-y-6">
        {/* 검색 */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="책 제목, 저자를 검색하세요"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSearch();
                }
              }}
            />
          </div>
          <Button onClick={handleSearch} loading={loading}>
            검색
          </Button>
        </div>

        {/* 검색 결과 */}
        {results.length > 0 && (
          <div>
            <h3 className="font-bold text-gray-900 mb-3">검색 결과</h3>
            <div className="space-y-3">
              {results.map((book, i) => (
                <Card key={i} className="flex items-start gap-3">
                  {book.image ? (
                    <img
                      src={book.image}
                      alt={book.title}
                      className="w-16 h-22 object-cover rounded-lg flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-22 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">📕</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-semibold text-sm"
                      dangerouslySetInnerHTML={{ __html: book.title }}
                    />
                    <p className="text-xs text-gray-500 mt-0.5">{book.author}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{book.publisher}</p>
                    {book.description && (
                      <p
                        className="text-xs text-gray-500 mt-1 line-clamp-2"
                        dangerouslySetInnerHTML={{ __html: book.description }}
                      />
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* 인기 도서 */}
        {!results.length && (
          <div>
            <h3 className="font-bold text-gray-900 mb-3">우리 유치원 인기 도서</h3>
            {loadingPopular ? (
              <LoadingSpinner text="인기 도서 불러오는 중..." />
            ) : popularBooks.length === 0 ? (
              <Card className="text-center py-6">
                <p className="text-gray-500 text-sm">
                  아직 독서 기록이 없습니다. 첫 기록을 남겨보세요!
                </p>
              </Card>
            ) : (
              <div className="space-y-2">
                {popularBooks.map((book, i) => (
                  <Card key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center text-sm font-bold text-yellow-600">
                      {i + 1}
                    </div>
                    {book.coverUrl ? (
                      <img
                        src={book.coverUrl}
                        alt={book.title}
                        className="w-10 h-14 object-cover rounded"
                      />
                    ) : (
                      <div className="w-10 h-14 bg-gray-100 rounded flex items-center justify-center">
                        📕
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{book.title}</p>
                      <p className="text-xs text-gray-500">{book.author}</p>
                    </div>
                    <span className="text-xs text-gray-400">{book.count}회</span>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
