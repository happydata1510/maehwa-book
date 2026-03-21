"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  getChildrenByKindergarten,
  getChildrenByParent,
  getClassesByKindergarten,
  addChild,
  addClass,
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
  const [showAddChild, setShowAddChild] = useState(false);
  const [showAddClass, setShowAddClass] = useState(false);

  // Add child form
  const [childName, setChildName] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [addingChild, setAddingChild] = useState(false);

  // Add class form
  const [className, setClassName] = useState("");
  const [ageGroup, setAgeGroup] = useState(5);
  const [addingClass, setAddingClass] = useState(false);

  const fetchData = async () => {
    if (!userData) return;
    try {
      const [childResult, classResult] = await Promise.all([
        userData.role === "parent"
          ? getChildrenByParent(userData.uid)
          : getChildrenByKindergarten(userData.kindergartenId),
        getClassesByKindergarten(userData.kindergartenId),
      ]);
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

  const getClassName = (classId: string) => {
    return classes.find((c) => c.id === classId)?.name || "";
  };

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
      <div className="px-4 py-4 space-y-6">
        {/* 반 관리 */}
        {userData?.role !== "parent" && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900">반 목록</h3>
              <Button size="sm" onClick={() => setShowAddClass(true)}>
                + 반 추가
              </Button>
            </div>
            {classes.length === 0 ? (
              <Card className="text-center py-6">
                <p className="text-gray-500 text-sm">반을 먼저 추가해주세요</p>
              </Card>
            ) : (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {classes.map((cls) => (
                  <Card key={cls.id} className="flex-shrink-0 px-4 py-3">
                    <p className="font-semibold text-sm">{cls.name}</p>
                    <p className="text-xs text-gray-500">{cls.ageGroup}세</p>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 아이 목록 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900">
              아이 목록 ({children.length}명)
            </h3>
            {classes.length > 0 && (
              <Button size="sm" onClick={() => setShowAddChild(true)}>
                + 아이 등록
              </Button>
            )}
          </div>

          {children.length === 0 ? (
            <Card className="text-center py-8">
              <p className="text-gray-500">등록된 아이가 없습니다</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {children.map((child) => (
                <Link key={child.id} href={`/children/${child.id}`}>
                  <Card hoverable className="flex items-center gap-3">
                    <Avatar name={child.name} imageUrl={child.profileImageUrl} />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{child.name}</p>
                      <p className="text-xs text-gray-500">
                        {getClassName(child.classId)} · {child.totalBooksRead}권 읽음
                      </p>
                    </div>
                    <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Card>
                </Link>
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
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              연령
            </label>
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

      {/* 아이 등록 모달 */}
      <Modal isOpen={showAddChild} onClose={() => setShowAddChild(false)} title="아이 등록">
        <form onSubmit={handleAddChild} className="space-y-4">
          <Input
            label="아이 이름"
            placeholder="홍길동"
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              소속 반
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-400 focus:outline-none text-base bg-white"
            >
              <option value="">반을 선택하세요</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({cls.ageGroup}세)
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" fullWidth loading={addingChild}>
            등록하기
          </Button>
        </form>
      </Modal>
    </>
  );
}
