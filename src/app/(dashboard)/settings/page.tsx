"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { DEMO_MODE } from "@/lib/demo-data";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";

export default function SettingsPage() {
  const { userData, signOut } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/login";
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    if (newPassword.length < 6) {
      setPwError("비밀번호는 6자 이상이어야 합니다.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("비밀번호가 일치하지 않습니다.");
      return;
    }

    if (DEMO_MODE) {
      setPwSuccess(true);
      setTimeout(() => {
        setShowPassword(false);
        setPwSuccess(false);
        setNewPassword("");
        setConfirmPassword("");
      }, 1500);
      return;
    }

    try {
      const { updatePassword } = await import("firebase/auth");
      const { auth } = await import("@/lib/firebase/config");
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
        setPwSuccess(true);
        setTimeout(() => {
          setShowPassword(false);
          setPwSuccess(false);
        }, 1500);
      }
    } catch {
      setPwError("비밀번호 변경에 실패했습니다. 다시 로그인 후 시도해주세요.");
    }
  };

  return (
    <>
      <Header title="설정" />
      <div className="px-4 py-4 space-y-4">
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
                {userData?.role === "teacher" ? "선생님" : "학부모"}
              </span>
            </div>
          </div>
        </Card>

        <Button variant="outline" fullWidth onClick={() => setShowPassword(true)}>
          비밀번호 변경
        </Button>

        <Button variant="danger" fullWidth onClick={handleSignOut}>
          로그아웃
        </Button>
      </div>

      <Modal isOpen={showPassword} onClose={() => setShowPassword(false)} title="비밀번호 변경" size="sm">
        {pwSuccess ? (
          <div className="text-center py-4">
            <span className="text-4xl">✅</span>
            <p className="font-bold text-gray-800 mt-3">비밀번호가 변경되었습니다</p>
          </div>
        ) : (
          <form onSubmit={handleChangePassword} className="space-y-4">
            <Input
              label="새 비밀번호"
              type="password"
              placeholder="6자 이상"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <Input
              label="비밀번호 확인"
              type="password"
              placeholder="다시 입력"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            {pwError && (
              <p className="text-sm text-red-500">{pwError}</p>
            )}
            <Button type="submit" fullWidth>
              변경하기
            </Button>
          </form>
        )}
      </Modal>
    </>
  );
}
