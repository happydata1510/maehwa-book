"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  getChildrenByClass,
  getClassesByKindergarten,
  addChild,
  updateChild,
  deleteChild,
} from "@/lib/firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { Class, Child } from "@/types";
import { getNextBadge } from "@/lib/badge-rules";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function ClassDetailPage() {
  const params = useParams();
  const { userData } = useAuth();
  const classId = params.classId as string;

  const [classData, setClassData] = useState<Class | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(false);

  // 아이 관리
  const [showAddChild, setShowAddChild] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMoveChild, setShowMoveChild] = useState(false);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [childName, setChildName] = useState("");
  const [moveToClassId, setMoveToClassId] = useState("");
  const [addingChild, setAddingChild] = useState(false);

  const fetchData = async () => {
    if (!userData) return;
    try {
      const clsList = await getClassesByKindergarten(userData.kindergartenId);
      setClasses(clsList);
      const cls = clsList.find((c) => c.id === classId);
      setClassData(cls || null);

      const childResult = await getChildrenByClass(classId);
      setChildren(childResult.sort((a, b) => b.totalBooksRead - a.totalBooksRead));
    } catch (error) {
      console.error("Failed to fetch:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [classId, userData]);

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData || !childName.trim()) return;
    setAddingChild(true);
    try {
      await addChild({
        name: childName.trim(),
        classId,
        kindergartenId: userData.kindergartenId,
      });
      setChildName("");
      setShowAddChild(false);
      fetchData();
    } catch (error) {
      console.error("Failed:", error);
    } finally {
      setAddingChild(false);
    }
  };

  const handleDeleteChild = async () => {
    if (!selectedChild) return;
    await deleteChild(selectedChild.id);
    setShowDeleteConfirm(false);
    setSelectedChild(null);
    fetchData();
  };

  const handleMoveChild = async () => {
    if (!selectedChild || !moveToClassId) return;
    await updateChild(selectedChild.id, { classId: moveToClassId });
    setShowMoveChild(false);
    setSelectedChild(null);
    setMoveToClassId("");
    fetchData();
  };

  if (loading) {
    return (
      <>
        <Header title="반 상세" showBack />
        <LoadingSpinner />
      </>
    );
  }

  const totalBooks = children.reduce((sum, c) => sum + c.totalBooksRead, 0);
  const monthlyBooks = children.reduce((sum, c) => sum + c.monthlyBooksRead, 0);
  const avgBooks = children.length > 0 ? Math.round(totalBooks / children.length) : 0;

  return (
    <>
      <Header title={classData ? `${classData.name} (${classData.ageGroup}세)` : "반 상세"} showBack />
      <div className="px-4 py-4 space-y-5 pb-24">
        {/* 반 통계 */}
        <div className="grid grid-cols-4 gap-2">
          <Card className="text-center py-3">
            <p className="text-[10px] text-gray-500">인원</p>
            <p className="text-xl font-bold text-blue-600">{children.length}</p>
            <p className="text-[9px] text-gray-400">명</p>
          </Card>
          <Card className="text-center py-3">
            <p className="text-[10px] text-gray-500">전체</p>
            <p className="text-xl font-bold text-green-600">{totalBooks}</p>
            <p className="text-[9px] text-gray-400">권</p>
          </Card>
          <Card className="text-center py-3">
            <p className="text-[10px] text-gray-500">이번 달</p>
            <p className="text-xl font-bold text-orange-500">{monthlyBooks}</p>
            <p className="text-[9px] text-gray-400">권</p>
          </Card>
          <Card className="text-center py-3">
            <p className="text-[10px] text-gray-500">1인 평균</p>
            <p className="text-xl font-bold text-purple-500">{avgBooks}</p>
            <p className="text-[9px] text-gray-400">권</p>
          </Card>
        </div>

        {/* 아이 목록 + 관리 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm text-gray-900">원아 목록</h3>
            <Button size="sm" onClick={() => setShowAddChild(true)}>+ 아이 등록</Button>
          </div>

          {children.length === 0 ? (
            <Card className="text-center py-8">
              <p className="text-gray-500 text-sm">등록된 아이가 없습니다</p>
            </Card>
          ) : (
            <div className="space-y-1.5">
              {children.map((child, i) => {
                const nb = getNextBadge(child.totalBooksRead);
                const pr = nb ? ((child.totalBooksRead % 100) / 100) * 100 : 100;
                return (
                  <Card key={child.id} className="flex items-center gap-2.5">
                    {/* 순위 */}
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                      i === 0 ? "bg-yellow-100 text-yellow-600"
                        : i === 1 ? "bg-gray-100 text-gray-500"
                        : i === 2 ? "bg-orange-100 text-orange-500"
                        : "bg-gray-50 text-gray-400"
                    }`}>
                      {i + 1}
                    </div>

                    {/* 프로필 + 정보 */}
                    <Link href={`/children/${child.id}`} className="flex items-center gap-2 flex-1 min-w-0">
                      <Avatar name={child.name} imageUrl={child.profileImageUrl} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-xs text-gray-900">{child.name}</p>
                        {nb && (
                          <div className="h-1 bg-gray-100 rounded-full overflow-hidden mt-1">
                            <div className="h-full bg-green-400 rounded-full" style={{ width: `${pr}%` }} />
                          </div>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-xs text-green-600">{child.totalBooksRead}권</p>
                        <p className="text-[9px] text-gray-400">이번달 {child.monthlyBooksRead}</p>
                      </div>
                    </Link>

                    {/* 관리 버튼 */}
                    <div className="flex gap-0.5 flex-shrink-0">
                      <button
                        onClick={() => { setSelectedChild(child); setMoveToClassId(""); setShowMoveChild(true); }}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-400"
                        title="반 이동"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                      </button>
                      <button
                        onClick={() => { setSelectedChild(child); setShowDeleteConfirm(true); }}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-300"
                        title="삭제"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 아이 등록 모달 */}
      <Modal isOpen={showAddChild} onClose={() => setShowAddChild(false)} title="아이 등록" size="sm">
        <form onSubmit={handleAddChild} className="space-y-4">
          <Input
            label="아이 이름"
            placeholder="이름을 입력하세요"
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            required
          />
          <p className="text-xs text-gray-500">{classData?.name}에 등록됩니다</p>
          <Button type="submit" fullWidth loading={addingChild} disabled={!childName.trim()}>등록하기</Button>
        </form>
      </Modal>

      {/* 삭제 확인 모달 */}
      <Modal isOpen={showDeleteConfirm} onClose={() => { setShowDeleteConfirm(false); setSelectedChild(null); }} title="원아 삭제" size="sm">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="font-bold text-gray-900">{selectedChild?.name}</p>
          <p className="text-sm text-gray-500">정말 삭제하시겠습니까?</p>
          <p className="text-xs text-red-500">독서 기록과 뱃지가 모두 사라집니다.</p>
          <div className="flex gap-3">
            <Button variant="outline" fullWidth onClick={() => { setShowDeleteConfirm(false); setSelectedChild(null); }}>취소</Button>
            <button onClick={handleDeleteChild} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600">삭제하기</button>
          </div>
        </div>
      </Modal>

      {/* 반 이동 모달 */}
      <Modal isOpen={showMoveChild} onClose={() => { setShowMoveChild(false); setSelectedChild(null); }} title="반 이동" size="sm">
        <div className="space-y-4">
          <div className="text-center">
            <p className="font-bold text-gray-900">{selectedChild?.name}</p>
            <p className="text-sm text-gray-500">현재: {classData?.name}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {classes.filter((c) => c.id !== classId).map((cls) => (
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
          <Button fullWidth onClick={handleMoveChild} disabled={!moveToClassId}>이동하기</Button>
        </div>
      </Modal>
    </>
  );
}
