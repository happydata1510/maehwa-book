"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { DEMO_MODE, DEMO_ACCOUNTS } from "@/lib/demo-data";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

type LoginTab = "parent" | "teacher";

export default function LoginPage() {
  const [tab, setTab] = useState<LoginTab>("parent");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !password) return;
    setError("");
    setLoading(true);
    try {
      await signIn(name.trim(), password);
      router.push("/home");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("invalid-credential") || msg.includes("wrong-password") || msg.includes("user-not-found")) {
        setError("이름 또는 비밀번호가 올바르지 않습니다.");
      } else {
        setError("로그인 실패. 다시 시도해주세요.");
      }
      setLoading(false);
    }
  };

  const handleQuickLogin = async (accountEmail: string, accountPassword: string) => {
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

  const teacherAccounts = DEMO_ACCOUNTS.filter((a) => a.user.role === "teacher" || a.user.role === "admin");
  const parentAccounts = DEMO_ACCOUNTS.filter((a) => a.user.role === "parent");

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-sm">
        {/* 로고 */}
        <div className="text-center mb-5">
          <img src="/logo.png" alt="매화유치원" className="w-44 mx-auto mb-2" />
          <h1 className="text-lg font-bold text-gray-900">책대장 서비스</h1>
        </div>

        {/* 탭 선택 */}
        <div className="flex rounded-2xl bg-gray-100 p-1 mb-5">
          <button
            onClick={() => { setTab("parent"); setName(""); setPassword(""); setError(""); }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === "parent" ? "bg-white text-green-600 shadow-sm" : "text-gray-500"
            }`}
          >
            👨‍👩‍👧 학부모
          </button>
          <button
            onClick={() => { setTab("teacher"); setName(""); setPassword(""); setError(""); }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === "teacher" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"
            }`}
          >
            👩‍🏫 선생님
          </button>
        </div>

        {/* 로그인 폼 */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            label={tab === "parent" ? "부모님 이름" : "선생님 이름"}
            placeholder={tab === "parent" ? "이름을 입력하세요" : "선생님 이름을 입력하세요"}
            value={name}
            onChange={(e) => setName(e.target.value)}
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

        {/* 데모 모드: 빠른 로그인 버튼 */}
        {DEMO_MODE && (
          <div className="mt-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-[10px] text-gray-400">테스트 계정</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {tab === "teacher" ? (
              <div className="space-y-1.5">
                {teacherAccounts.map((acc) => (
                  <button
                    key={acc.email}
                    onClick={() => handleQuickLogin(acc.email, acc.password)}
                    disabled={loading}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50 ${
                      acc.user.role === "admin"
                        ? "border-purple-200 bg-purple-50"
                        : "border-blue-200 bg-blue-50"
                    }`}
                  >
                    <span className="text-lg">{acc.user.role === "admin" ? "👑" : "👩‍🏫"}</span>
                    <div>
                      <p className="font-semibold text-xs text-gray-800">{acc.label}</p>
                      <p className="text-[10px] text-gray-500">
                        {acc.user.role === "admin" ? "전체 반 관리" : "담당 반 관리"}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-1.5">
                {parentAccounts.map((acc) => (
                  <button
                    key={acc.email}
                    onClick={() => handleQuickLogin(acc.email, acc.password)}
                    disabled={loading}
                    className="w-full p-2.5 rounded-xl border border-green-200 bg-green-50 text-left flex items-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    <span className="text-lg">👨‍👩‍👧</span>
                    <div>
                      <p className="font-semibold text-xs text-gray-800">{acc.label}</p>
                      <p className="text-[10px] text-gray-500">독서 기록 체험</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 학부모 탭에서만 회원가입 링크 */}
        {tab === "parent" && (
          <p className="text-center mt-5 text-sm text-gray-500">
            처음이신가요?{" "}
            <Link href="/signup" className="text-green-600 font-semibold hover:underline">
              회원가입
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
