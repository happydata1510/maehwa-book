"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { DEMO_CLASSES } from "@/lib/demo-data";
import { Class } from "@/types";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function SignupPage() {
  const [parent1Name, setParent1Name] = useState("");
  const [parent2Name, setParent2Name] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const classes: Class[] = DEMO_CLASSES;
  const { signUp } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parent1Name.trim() || !selectedClassId || !password) return;

    setError("");
    setLoading(true);

    try {
      // 이름 기반 이메일 생성 (내부용)
      const emailBase = parent1Name.trim().replace(/\s/g, "").toLowerCase();
      const email = `${emailBase}@maehwa.kr`;

      await signUp(email, password, parent1Name.trim(), "parent", "maehwa");
      router.push("/home");
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes("email-already-in-use")) {
          setError("이미 등록된 이름입니다. 로그인해주세요.");
        } else if (err.message.includes("weak-password")) {
          setError("비밀번호는 6자 이상이어야 합니다.");
        } else {
          setError("회원가입 중 오류가 발생했습니다.");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <img src="/logo.png" alt="매화유치원" className="w-40 mx-auto mb-2" />
          <h1 className="text-xl font-bold text-gray-900">책대장 회원가입</h1>
          <p className="text-gray-500 text-sm mt-1">학부모 정보를 입력해주세요</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="부모님 1 이름"
              placeholder="홍길동"
              value={parent1Name}
              onChange={(e) => setParent1Name(e.target.value)}
              required
            />
            <Input
              label="부모님 2 이름"
              placeholder="김영희 (선택)"
              value={parent2Name}
              onChange={(e) => setParent2Name(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              소속 반
            </label>
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
          <Input
            label="비밀번호"
            type="password"
            placeholder="6자 이상"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            helperText="로그인할 때 부모님 이름 + 비밀번호를 사용합니다"
          />

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              {error}
            </div>
          )}

          <Button
            type="submit"
            loading={loading}
            fullWidth
            size="lg"
            disabled={!parent1Name.trim() || !selectedClassId || !password}
          >
            가입하기
          </Button>
        </form>

        <p className="text-center mt-4 text-sm text-gray-500">
          이미 계정이 있으신가요?{" "}
          <Link href="/login" className="text-green-600 font-semibold hover:underline">
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
