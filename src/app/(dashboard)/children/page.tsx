"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  getChildrenByKindergarten,
  getChildrenByParent,
  getClassesByKindergarten,
  addChild,
  updateChild,
  deleteChild,
  addClass,
  updateClassName,
  deleteClass,
} from "@/lib/firebase/firestore";
import { Child, Class } from "@/types";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function ChildrenPage() {
  const { userData } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);

  // 검색 + 정렬
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "books">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // 모달 상태
  const [showAddChild, setShowAddChild] = useState(false);
  const [showAddClass, setShowAddClass] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMoveChild, setShowMoveChild] = useState(false);
  const [showRenameClass, setShowRenameClass] = useState(false);
  const [showDeleteClass, setShowDeleteClass] = useState(false);

  // 선택된 아이 (이동/삭제용)
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);

  // 선택된 반 (이름변경/삭제용)
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [renameClassValue, setRenameClassValue] = useState("");

  // 반 필터
  const [filterClassId, setFilterClassId] = useState("all");

  // Add child form
  const [childName, setChildName] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [addingChild, setAddingChild] = useState(false);

  // Add class form
  const [className, setClassName] = useState("");
  const [ageGroup, setAgeGroup] = useState(5);
  const [addingClass, setAddingClass] = useState(false);

  // Move class
  const [moveToClassId, setMoveToClassId] = useState("");

  const isTeacher = userData?.role === "teacher" || userData?.role === "admin";

  const fetchData = async () => {
    if (!userData) return;
    try {
      const [allChildResult, classResult] = await Promise.all([
        isTeacher
          ? getChildrenByKindergarten(userData.kindergartenId)
          : getChildrenByParent(userData.uid),
        getClassesByKindergarten(userData.kindergartenId),
      ]);
      // 반선생님은 자기 반만, 원장은 전체
      const childResult = (userData.role === "teacher" && userData.managedClassId)
        ? allChildResult.filter((c) => c.classId === userData.managedClassId)
        : allChildResult;
      setChildren(childResult);
      setClasses(classResult);
    } catch (error) {
      console.error("Failed to fetch:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userData]);

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData) return;
    setAddingClass(true);
    try {
      await addClass({
        name: className,
        kindergartenId: userData.kindergartenId,
        teacherId: userData.uid,
        ageGroup,
      });
      setClassName("");
      setShowAddClass(false);
      fetchData();
    } catch (error) {
      console.error("Failed to add class:", error);
    } finally {
      setAddingClass(false);
    }
  };

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData || !selectedClassId) return;
    setAddingChild(true);
    try {
      await addChild({
        name: childName,
        classId: selectedClassId,
        kindergartenId: userData.kindergartenId,
        parentUserIds: isTeacher ? [] : [userData.uid],
      });
      setChildName("");
      setSelectedClassId("");
      setShowAddChild(false);
      fetchData();
    } catch (error) {
      console.error("Failed to add child:", error);
    } finally {
      setAddingChild(false);
    }
  };

  // 반 이름 변경
  const handleRenameClass = async () => {
    if (!selectedClass || !renameClassValue.trim()) return;
    try {
      await updateClassName(selectedClass.id, renameClassValue.trim());
      setShowRenameClass(false);
      setSelectedClass(null);
      setRenameClassValue("");
      fetchData();
    } catch (error) {
      console.error("Failed to rename class:", error);
    }
  };

  // 반 삭제
  const handleDeleteClass = async () => {
    if (!selectedClass) return;
    const hasChildren = children.some((c) => c.classId === selectedClass.id);
    if (hasChildren) {
      alert("해당 반에 아이가 있어 삭제할 수 없습니다.\n먼저 아이들을 다른 반으로 이동해주세요.");
      return;
    }
    try {
      await deleteClass(selectedClass.id);
      setShowDeleteClass(false);
      setSelectedClass(null);
      if (filterClassId === selectedClass.id) setFilterClassId("all");
      fetchData();
    } catch (error) {
      console.error("Failed to delete class:", error);
    }
  };

  // 아이 삭제
  const handleDeleteChild = async () => {
    if (!selectedChild) return;
    try {
      await deleteChild(selectedChild.id);
      setShowDeleteConfirm(false);
      setSelectedChild(null);
      fetchData();
    } catch (error) {
      console.error("Failed to delete child:", error);
    }
  };

  // 아이 반 이동
  const handleMoveChild = async () => {
    if (!selectedChild || !moveToClassId) return;
    try {
      await updateChild(selectedChild.id, { classId: moveToClassId });
      setShowMoveChild(false);
      setSelectedChild(null);
      setMoveToClassId("");
      fetchData();
    } catch (error) {
      console.error("Failed to move child:", error);
    }
  };

  const getClassName = (classId: string) =>
    classes.find((c) => c.id === classId)?.name || "";

  // 필터링 + 검색
  const filteredChildren = children.filter((child) => {
    const matchClass = filterClassId === "all" || child.classId === filterClassId;
    const matchSearch =
      !searchQuery ||
      child.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchClass && matchSearch;
  }).sort((a, b) => {
    if (sortBy === "name") {
      return sortDir === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    }
    return sortDir === "asc" ? a.totalBooksRead - b.totalBooksRead : b.totalBooksRead - a.totalBooksRead;
  });

  if (loading) {
    return (
      <>
        <Header title="아이 관리" />
        <LoadingSpinner text="불러오는 중..." />
      </>
    );
  }

  return (
    <>
      <Header title="아이 관리" />
      <div className="px-4 py-4 space-y-4 pb-24">
        {/* 선생님: 반 관리 */}
        {isTeacher && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-sm text-gray-900">반 목록</h3>
              <Button size="sm" variant="outline" onClick={() => setShowAddClass(true)}>
                + 반 추가
              </Button>
            </div>
            <div className="space-y-1.5">
              {classes.map((cls) => {
                const count = children.filter((c) => c.classId === cls.id).length;
                const isActive = filterClassId === cls.id;
                return (
                  <div
                    key={cls.id}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl transition-all ${
                      isActive ? "bg-green-50 border border-green-300" : "bg-gray-50 border border-transparent"
                    }`}
                  >
                    <button
                      onClick={() => setFilterClassId(isActive ? "all" : cls.id)}
                      className="flex items-center gap-2 flex-1 min-w-0"
                    >
                      <span className={`text-sm font-semibold ${isActive ? "text-green-700" : "text-gray-800"}`}>
                        {cls.name}
                      </span>
                      <span className="text-xs text-gray-400">{cls.ageGroup}세 · {count}명</span>
                    </button>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => {
                          setSelectedClass(cls);
                          setRenameClassValue(cls.name);
                          setShowRenameClass(true);
                        }}
                        className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400"
                        title="이름 변경"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedClass(cls);
                          setShowDeleteClass(true);
                        }}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-300"
                        title="삭제"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 검색 + 추가 버튼 */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="아이 이름 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-green-400 focus:outline-none text-sm"
            />
          </div>
          <Button size="sm" onClick={() => setShowAddChild(true)}>
            + {isTeacher ? "아이 등록" : "아이 추가"}
          </Button>
        </div>

        {/* 정렬 + 아이 목록 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500">
              {searchQuery ? `"${searchQuery}" 검색 결과: ` : ""}
              {filteredChildren.length}명
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => { setSortBy("name"); setSortDir(sortBy === "name" && sortDir === "asc" ? "desc" : "asc"); }}
                className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-all ${
                  sortBy === "name" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                }`}
              >
                이름 {sortBy === "name" ? (sortDir === "asc" ? "▲" : "▼") : ""}
              </button>
              <button
                onClick={() => { setSortBy("books"); setSortDir(sortBy === "books" && sortDir === "desc" ? "asc" : "desc"); }}
                className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-all ${
                  sortBy === "books" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                }`}
              >
                독서량 {sortBy === "books" ? (sortDir === "asc" ? "▲" : "▼") : ""}
              </button>
            </div>
          </div>

          {filteredChildren.length === 0 ? (
            <Card className="text-center py-8">
              <p className="text-gray-500">
                {searchQuery ? "검색 결과가 없습니다" : "등록된 아이가 없습니다"}
              </p>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredChildren.map((child) => (
                <Card key={child.id} className="flex items-center gap-3">
                  <Link href={`/children/${child.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar name={child.name} imageUrl={child.profileImageUrl} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900">{child.name}</p>
                      <p className="text-xs text-gray-500">
                        {getClassName(child.classId)} · {child.totalBooksRead}권
                      </p>
                    </div>
                  </Link>

                  {/* 선생님: 관리 버튼 */}
                  {isTeacher && (
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => {
                          setSelectedChild(child);
                          setMoveToClassId("");
                          setShowMoveChild(true);
                        }}
                        className="p-2 rounded-lg hover:bg-blue-50 text-blue-500"
                        title="반 이동"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedChild(child);
                          setShowDeleteConfirm(true);
                        }}
                        className="p-2 rounded-lg hover:bg-red-50 text-red-400"
                        title="삭제"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 반 추가 모달 */}
      <Modal isOpen={showAddClass} onClose={() => setShowAddClass(false)} title="반 추가">
        <form onSubmit={handleAddClass} className="space-y-4">
          <Input
            label="반 이름"
            placeholder="예: 장미반"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">연령</label>
            <div className="flex gap-2">
              {[5, 6, 7].map((age) => (
                <button
                  key={age}
                  type="button"
                  onClick={() => setAgeGroup(age)}
                  className={`flex-1 py-2.5 rounded-xl border-2 font-semibold transition-all ${
                    ageGroup === age
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-gray-200 text-gray-500"
                  }`}
                >
                  {age}세
                </button>
              ))}
            </div>
          </div>
          <Button type="submit" fullWidth loading={addingClass}>
            추가하기
          </Button>
        </form>
      </Modal>

      {/* 아이 등록/추가 모달 */}
      <Modal
        isOpen={showAddChild}
        onClose={() => setShowAddChild(false)}
        title={isTeacher ? "아이 등록" : "아이 추가"}
      >
        <form onSubmit={handleAddChild} className="space-y-4">
          <Input
            label="아이 이름"
            placeholder="홍길동"
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">소속 반</label>
            <div className="grid grid-cols-2 gap-2">
              {classes.map((cls) => (
                <button
                  key={cls.id}
                  type="button"
                  onClick={() => setSelectedClassId(cls.id)}
                  className={`py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                    selectedClassId === cls.id
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-gray-200 text-gray-600"
                  }`}
                >
                  {cls.name} ({cls.ageGroup}세)
                </button>
              ))}
            </div>
          </div>
          {!isTeacher && (
            <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-xl">
              형제/자매가 있으면 여기서 아이를 추가할 수 있어요.
              같은 계정으로 여러 아이를 관리합니다.
            </p>
          )}
          <Button
            type="submit"
            fullWidth
            loading={addingChild}
            disabled={!childName || !selectedClassId}
          >
            {isTeacher ? "등록하기" : "추가하기"}
          </Button>
        </form>
      </Modal>

      {/* 삭제 확인 모달 */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setSelectedChild(null);
        }}
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
            <p className="font-bold text-gray-900 text-lg">
              {selectedChild?.name}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              정말 삭제하시겠습니까?
            </p>
            <p className="text-xs text-red-500 mt-2">
              삭제하면 독서 기록과 뱃지가 모두 사라집니다.
              이 작업은 되돌릴 수 없습니다.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              fullWidth
              onClick={() => {
                setShowDeleteConfirm(false);
                setSelectedChild(null);
              }}
            >
              취소
            </Button>
            <button
              onClick={handleDeleteChild}
              className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors"
            >
              삭제하기
            </button>
          </div>
        </div>
      </Modal>

      {/* 반 이동 모달 */}
      <Modal
        isOpen={showMoveChild}
        onClose={() => {
          setShowMoveChild(false);
          setSelectedChild(null);
        }}
        title="반 이동"
        size="sm"
      >
        <div className="space-y-4">
          <div className="text-center">
            <p className="font-bold text-gray-900">{selectedChild?.name}</p>
            <p className="text-sm text-gray-500">
              현재: {selectedChild ? getClassName(selectedChild.classId) : ""}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">이동할 반 선택</p>
            <div className="grid grid-cols-2 gap-2">
              {classes
                .filter((cls) => cls.id !== selectedChild?.classId)
                .map((cls) => (
                  <button
                    key={cls.id}
                    onClick={() => setMoveToClassId(cls.id)}
                    className={`py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                      moveToClassId === cls.id
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 text-gray-600"
                    }`}
                  >
                    {cls.name} ({cls.ageGroup}세)
                  </button>
                ))}
            </div>
          </div>

          <Button
            fullWidth
            onClick={handleMoveChild}
            disabled={!moveToClassId}
          >
            이동하기
          </Button>
        </div>
      </Modal>

      {/* 반 이름 변경 모달 */}
      <Modal
        isOpen={showRenameClass}
        onClose={() => { setShowRenameClass(false); setSelectedClass(null); }}
        title="반 이름 변경"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500 text-center">
            현재: <span className="font-semibold text-gray-800">{selectedClass?.name}</span>
          </p>
          <Input
            label="새 반 이름"
            placeholder="새 반 이름을 입력하세요"
            value={renameClassValue}
            onChange={(e) => setRenameClassValue(e.target.value)}
          />
          <Button
            fullWidth
            onClick={handleRenameClass}
            disabled={!renameClassValue.trim() || renameClassValue === selectedClass?.name}
          >
            변경하기
          </Button>
        </div>
      </Modal>

      {/* 반 삭제 확인 모달 */}
      <Modal
        isOpen={showDeleteClass}
        onClose={() => { setShowDeleteClass(false); setSelectedClass(null); }}
        title="반 삭제"
        size="sm"
      >
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-gray-900 text-lg">{selectedClass?.name}</p>
            <p className="text-sm text-gray-500 mt-1">정말 삭제하시겠습니까?</p>
            {children.some((c) => c.classId === selectedClass?.id) && (
              <p className="text-xs text-red-500 mt-2 bg-red-50 p-2 rounded-lg">
                해당 반에 아이가 있습니다. 먼저 아이들을 다른 반으로 이동해주세요.
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              fullWidth
              onClick={() => { setShowDeleteClass(false); setSelectedClass(null); }}
            >
              취소
            </Button>
            <button
              onClick={handleDeleteClass}
              disabled={children.some((c) => c.classId === selectedClass?.id)}
              className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              삭제하기
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
