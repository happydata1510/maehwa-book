"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { DEMO_MODE, DEMO_CLASSES } from "@/lib/demo-data";
import { UserRole, Class } from "@/types";
import { getClassesByKindergarten } from "@/lib/firebase/firestore";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function SignupPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<UserRole>("parent");

  // 공통
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 학부모 전용
  const [parent1Name, setParent1Name] = useState("");
  const [parent2Name, setParent2Name] = useState("");
  const [childName, setChildName] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [classes, setClasses] = useState<Class[]>([]);

  // 선생님 전용
  const [teacherName, setTeacherName] = useState("");

  const { signUp } = useAuth();
  const router = useRouter();

  useEffect(() => {
    async function loadClasses() {
      if (DEMO_MODE) {
        setClasses(DEMO_CLASSES);
      } else {
        const result = await getClassesByKindergarten("maehwa");
        setClasses(result);
      }
    }
    loadClasses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
      return;
    }

    setError("");
    setLoading(true);

    try {
      const displayName = role === "parent" ? parent1Name : teacherName;

      if (!DEMO_MODE) {
        const { doc, setDoc, serverTimestamp } = await import("firebase/firestore");
        const { db } = await import("@/lib/firebase/config");
        const kindergartenRef = doc(db, "kindergartens", "maehwa");
        await setDoc(
          kindergartenRef,
          { name: "매화유치원", address: "", createdAt: serverTimestamp() },
          { merge: true }
        );
      }

      await signUp(email, password, displayName, role, "maehwa");
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
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <img src="/logo.png" alt="매화유치원" className="w-40 mx-auto mb-2" />
          <h1 className="text-xl font-bold text-gray-900">책대장 회원가입</h1>
          <p className="text-gray-500 text-sm mt-1">
            {step === 1 ? "역할을 선택해주세요" : role === "parent" ? "학부모 정보 입력" : "선생님 정보 입력"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {step === 1 ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("parent")}
                  className={`p-4 rounded-2xl border-2 text-center transition-all ${
                    role === "parent"
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="text-3xl mb-1">👨‍👩‍👧</div>
                  <div className="font-semibold text-sm">학부모</div>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("teacher")}
                  className={`p-4 rounded-2xl border-2 text-center transition-all ${
                    role === "teacher"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="text-3xl mb-1">👩‍🏫</div>
                  <div className="font-semibold text-sm">선생님</div>
                </button>
              </div>
              <Button type="submit" fullWidth size="lg">
                다음
              </Button>
            </>
          ) : role === "parent" ? (
            <>
              {/* 학부모 가입 폼 */}
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
              <Input
                label="아이 이름"
                placeholder="홍민준"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                required
              />
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
                label="이메일 (로그인용)"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                label="비밀번호"
                type="password"
                placeholder="6자 이상"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                helperText="설정에서 언제든 변경할 수 있어요"
              />

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1" size="lg">
                  이전
                </Button>
                <Button
                  type="submit"
                  loading={loading}
                  className="flex-1"
                  size="lg"
                  disabled={!parent1Name || !childName || !selectedClassId}
                >
                  가입하기
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* 선생님 가입 폼 */}
              <Input
                label="선생님 이름"
                placeholder="김선생"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                required
              />
              <Input
                label="이메일 (로그인용)"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                label="비밀번호"
                type="password"
                placeholder="6자 이상"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1" size="lg">
                  이전
                </Button>
                <Button type="submit" loading={loading} className="flex-1" size="lg" disabled={!teacherName}>
                  가입하기
                </Button>
              </div>
            </>
          )}
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
