"use client";

import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default function SettingsPage() {
  const { userData, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/login";
  };

  return (
    <>
      <Header title="설정" />
      <div className="px-4 py-4 space-y-4">
        {/* 사용자 정보 */}
        <Card>
          <h3 className="font-bold text-gray-900 mb-3">내 정보</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">이름</span>
              <span className="font-medium">{userData?.displayName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">이메일</span>
              <span className="font-medium">{userData?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">역할</span>
              <span className="font-medium">
                {userData?.role === "teacher"
                  ? "선생님"
                  : userData?.role === "parent"
                    ? "학부모"
                    : "관리자"}
              </span>
            </div>
          </div>
        </Card>

        {/* 앱 정보 */}
        <Card>
          <h3 className="font-bold text-gray-900 mb-3">앱 정보</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">버전</span>
              <span className="font-medium">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">서비스</span>
              <span className="font-medium">매화유치원 책대장</span>
            </div>
          </div>
        </Card>

        {/* 로그아웃 */}
        <Button variant="danger" fullWidth onClick={handleSignOut}>
          로그아웃
        </Button>
      </div>
    </>
  );
}
