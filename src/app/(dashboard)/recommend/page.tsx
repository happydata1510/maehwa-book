"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getClassesByKindergarten,
  getRecommendedBooks,
  addRecommendedBook,
  RecommendedBook,
} from "@/lib/firebase/firestore";
import { Class } from "@/types";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function RecommendPage() {
  const { userData } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [books, setBooks] = useState<RecommendedBook[]>([]);
  const [loading, setLoading] = useState(false);

  // 추가 모달
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [reason, setReason] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!userData) return;
      try {
        const classResult = await getClassesByKindergarten(userData.kindergartenId);
        setClasses(classResult);
        if (classResult.length > 0) {
          setSelectedClassId(classResult[0].id);
        }
      } catch (error) {
        console.error("Failed to fetch:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [userData]);

  useEffect(() => {
    async function fetchBooks() {
      if (!selectedClassId) return;
      const result = await getRecommendedBooks(selectedClassId);
      setBooks(result);
    }
    fetchBooks();
  }, [selectedClassId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData || !selectedClassId || !title.trim()) return;
    setAdding(true);
    try {
      await addRecommendedBook({
        title: title.trim(),
        author: author.trim(),
        reason: reason.trim(),
        classId: selectedClassId,
        addedBy: userData.uid,
        addedByName: userData.displayName,
      });
      setTitle("");
      setAuthor("");
      setReason("");
      setShowAdd(false);
      const result = await getRecommendedBooks(selectedClassId);
      setBooks(result);
    } catch (error) {
      console.error("Failed to add:", error);
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header title="추천도서 관리" showBack />
        <LoadingSpinner />
      </>
    );
  }

  return (
    <>
      <Header title="추천도서 관리" showBack />
      <div className="px-4 py-4 space-y-5">
        {/* 반 선택 */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {classes.map((cls) => (
            <button
              key={cls.id}
              onClick={() => setSelectedClassId(cls.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedClassId === cls.id
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {cls.name}
            </button>
          ))}
        </div>

        {/* 추가 버튼 */}
        <Button onClick={() => setShowAdd(true)} fullWidth>
          + 추천도서 등록하기
        </Button>

        {/* 추천도서 목록 */}
        {books.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-gray-500">등록된 추천도서가 없습니다</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {books.map((book) => (
              <Card key={book.id} className="flex items-start gap-3">
                <div className="w-10 h-14 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">📕</span>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm text-gray-800">{book.title}</p>
                  <p className="text-xs text-gray-500">{book.author}</p>
                  {book.reason && (
                    <p className="text-xs text-blue-600 mt-1">&ldquo;{book.reason}&rdquo;</p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 추가 모달 */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="추천도서 등록">
        <form onSubmit={handleAdd} className="space-y-4">
          <Input
            label="책 제목"
            placeholder="추천할 책 제목"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <Input
            label="저자"
            placeholder="저자명"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
          />
          <Input
            label="추천 이유"
            placeholder="왜 이 책을 추천하나요?"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <Button type="submit" fullWidth loading={adding}>
            등록하기
          </Button>
        </form>
      </Modal>
    </>
  );
}
