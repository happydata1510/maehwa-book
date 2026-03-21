"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { DEMO_MODE } from "@/lib/demo-data";
import { UserRole } from "@/types";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function SignupPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<UserRole>("teacher");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [kindergartenName, setKindergartenName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
      return;
    }

    setError("");
    setLoading(true);

    try {
      // 유치원 ID를 생성하거나 기존 것을 사용
      const kindergartenId = kindergartenName
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9가-힣-]/g, "");

      // 유치원 문서 생성 (데모 모드에서는 건너뜀)
      if (!DEMO_MODE) {
        const { doc, setDoc, serverTimestamp } = await import("firebase/firestore");
        const { db } = await import("@/lib/firebase/config");
        const kindergartenRef = doc(db, "kindergartens", kindergartenId);
        await setDoc(
          kindergartenRef,
          {
            name: kindergartenName,
            address: "",
            createdAt: serverTimestamp(),
          },
          { merge: true }
        );
      }

      await signUp(email, password, displayName, role, kindergartenId);
      router.push("/home");
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes("email-already-in-use")) {
          setError("이미 사용 중인 이메일입니다.");
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
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">📚</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">회원가입</h1>
          <p className="text-gray-500 mt-1">
            {step === 1 ? "역할을 선택해주세요" : "정보를 입력해주세요"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 1 ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("teacher")}
                  className={`p-4 rounded-2xl border-2 text-center transition-all ${
                    role === "teacher"
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="text-3xl mb-2">👩‍🏫</div>
                  <div className="font-semibold text-sm">선생님</div>
                  <div className="text-xs text-gray-500 mt-1">
                    반/아이 관리
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("parent")}
                  className={`p-4 rounded-2xl border-2 text-center transition-all ${
                    role === "parent"
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="text-3xl mb-2">👨‍👩‍👧</div>
                  <div className="font-semibold text-sm">학부모</div>
                  <div className="text-xs text-gray-500 mt-1">
                    독서 기록
                  </div>
                </button>
              </div>
              <Button type="submit" fullWidth size="lg">
                다음
              </Button>
            </>
          ) : (
            <>
              <Input
                label="이름"
                placeholder="홍길동"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
              <Input
                label="이메일"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                label="비밀번호"
                type="password"
                placeholder="6자 이상 입력"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                helperText="비밀번호는 6자 이상이어야 합니다"
              />
              <Input
                label="유치원 이름"
                placeholder="매화유치원"
                value={kindergartenName}
                onChange={(e) => setKindergartenName(e.target.value)}
                required
                helperText="같은 유치원 이름으로 가입하면 자동으로 연결됩니다"
              />

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                  size="lg"
                >
                  이전
                </Button>
                <Button type="submit" loading={loading} className="flex-1" size="lg">
                  가입하기
                </Button>
              </div>
            </>
          )}
        </form>

        <p className="text-center mt-6 text-sm text-gray-500">
          이미 계정이 있으신가요?{" "}
          <Link href="/login" className="text-green-600 font-semibold hover:underline">
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
