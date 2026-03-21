"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { DEMO_MODE, DEMO_ACCOUNTS } from "@/lib/demo-data";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signIn(email, password);
      router.push("/home");
    } catch {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (accountEmail: string, accountPassword: string) => {
    setEmail(accountEmail);
    setPassword(accountPassword);
    setError("");
    setLoading(true);
    try {
      await signIn(accountEmail, accountPassword);
      router.push("/home");
    } catch {
      setError("로그인 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">📚</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">매화유치원 책대장</h1>
          <p className="text-gray-500 mt-1">로그인하고 독서 기록을 시작하세요</p>
        </div>

        {/* 데모 모드: 역할 선택 버튼 */}
        {DEMO_MODE && (
          <div className="mb-6 space-y-3">
            <p className="text-center text-sm font-semibold text-blue-600">
              데모 계정으로 바로 시작하기
            </p>
            <div className="grid grid-cols-2 gap-3">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  onClick={() => handleDemoLogin(account.email, account.password)}
                  disabled={loading}
                  className={`p-4 rounded-2xl border-2 text-center transition-all active:scale-95 disabled:opacity-50 ${
                    account.user.role === "teacher"
                      ? "border-blue-200 bg-blue-50 hover:border-blue-400"
                      : "border-green-200 bg-green-50 hover:border-green-400"
                  }`}
                >
                  <div className="text-3xl mb-1">
                    {account.user.role === "teacher" ? "👩‍🏫" : "👨‍👩‍👧"}
                  </div>
                  <p className="font-semibold text-sm text-gray-800">
                    {account.label}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {account.user.role === "teacher"
                      ? "관리 화면 체험"
                      : "기록 화면 체험"}
                  </p>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">또는 직접 로그인</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            label="이메일"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            label="비밀번호"
            placeholder="비밀번호를 입력하세요"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              {error}
            </div>
          )}

          <Button type="submit" fullWidth loading={loading} size="lg">
            로그인
          </Button>
        </form>

        <p className="text-center mt-6 text-sm text-gray-500">
          아직 계정이 없으신가요?{" "}
          <Link href="/signup" className="text-green-600 font-semibold hover:underline">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}
