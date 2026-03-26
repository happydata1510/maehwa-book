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
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("invalid-credential") || msg.includes("wrong-password") || msg.includes("user-not-found")) {
        setError("이름 또는 비밀번호가 올바르지 않습니다.");
      } else {
        setError(`로그인 실패: ${msg || "알 수 없는 오류"}`);
      }
      setLoading(false);
    }
  };

  const handleDemoLogin = async (accountEmail: string, accountPassword: string) => {
    setError("");
    setLoading(true);
    try {
      await signIn(accountEmail, accountPassword);
      router.push("/home");
    } catch {
      setError("로그인 실패");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <img src="/logo.png" alt="매화유치원" className="w-48 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-gray-900">책대장 서비스</h1>
          <p className="text-gray-500 text-sm mt-1">우리 아이 독서 기록을 시작하세요</p>
        </div>

        {/* 데모 모드: 역할 선택 버튼 */}
        {DEMO_MODE && (
          <div className="mb-6 space-y-3">
            <p className="text-center text-sm font-semibold text-blue-600">
              데모 계정으로 바로 시작하기
            </p>
            {/* 원장선생님 */}
            <div className="space-y-2">
              {DEMO_ACCOUNTS.filter((a) => a.user.role === "admin").map((account) => (
                <button
                  key={account.email}
                  onClick={() => handleDemoLogin(account.email, account.password)}
                  disabled={loading}
                  className="w-full p-3 rounded-2xl border-2 border-purple-200 bg-purple-50 hover:border-purple-400 text-center transition-all active:scale-95 disabled:opacity-50"
                >
                  <p className="font-semibold text-sm text-purple-800">👑 {account.label}</p>
                  <p className="text-[10px] text-purple-500">전체 반 관리</p>
                </button>
              ))}
            </div>

            {/* 반선생님들 */}
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.filter((a) => a.user.role === "teacher").map((account) => (
                <button
                  key={account.email}
                  onClick={() => handleDemoLogin(account.email, account.password)}
                  disabled={loading}
                  className="p-3 rounded-2xl border-2 border-blue-200 bg-blue-50 hover:border-blue-400 text-center transition-all active:scale-95 disabled:opacity-50"
                >
                  <p className="text-lg">👩‍🏫</p>
                  <p className="font-semibold text-xs text-blue-800">{account.label}</p>
                  <p className="text-[10px] text-blue-500">담당 반 관리</p>
                </button>
              ))}
            </div>

            {/* 학부모 */}
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.filter((a) => a.user.role === "parent").map((account) => (
                <button
                  key={account.email}
                  onClick={() => handleDemoLogin(account.email, account.password)}
                  disabled={loading}
                  className="p-3 rounded-2xl border-2 border-green-200 bg-green-50 hover:border-green-400 text-center transition-all active:scale-95 disabled:opacity-50"
                >
                  <p className="text-lg">👨‍👩‍👧</p>
                  <p className="font-semibold text-xs text-green-800">{account.label}</p>
                  <p className="text-[10px] text-green-500">독서 기록 체험</p>
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
            label="이름"
            placeholder="부모님 이름을 입력하세요"
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
