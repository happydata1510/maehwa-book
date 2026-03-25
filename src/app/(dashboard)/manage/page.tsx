"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  getClassesByKindergarten,
  getWeeklyTableData,
  WeeklyData,
  sendMessage,
} from "@/lib/firebase/firestore";
import { Class } from "@/types";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function ManagePage() {
  const { userData } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [tableData, setTableData] = useState<WeeklyData[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("all");
  const [loading, setLoading] = useState(false);

  // 메시지 모달
  const [showMessage, setShowMessage] = useState(false);
  const [messageChildId, setMessageChildId] = useState("");
  const [messageChildName, setMessageChildName] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!userData) return;
      try {
        const [classResult, weeklyResult] = await Promise.all([
          getClassesByKindergarten(userData.kindergartenId),
          getWeeklyTableData(userData.kindergartenId, 8),
        ]);
        if (classResult.length > 0) setClasses(classResult);
        setTableData(weeklyResult);
      } catch (error) {
        console.error("Failed to fetch:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [userData]);

  const handleDownloadExcel = () => {
    const weekLabels = tableData[0]?.weeks.map((w) => w.weekLabel) || [];
    const rows = filtered.map((row) => {
      const weekCols = row.weeks.reduce(
        (acc, w) => ({ ...acc, [w.weekLabel]: w.count }),
        {} as Record<string, number>
      );
      return {
        이름: row.childName,
        반: getClassName(row.classId),
        총합: row.totalBooks,
        ...weekCols,
      };
    });

    // CSV 생성
    const headers = ["이름", "반", "총합", ...weekLabels];
    const csv = [
      headers.join(","),
      ...rows.map((r) => headers.map((h) => r[h as keyof typeof r] ?? 0).join(",")),
    ].join("\n");

    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `독서현황_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getClassName = (classId: string) =>
    classes.find((c) => c.id === classId)?.name || "";

  const filtered =
    selectedClassId === "all"
      ? tableData
      : tableData.filter((d) => d.classId === selectedClassId);

  const totalAll = tableData.reduce((s, d) => s + d.totalBooks, 0);

  const openMessage = (childId: string, childName: string) => {
    setMessageChildId(childId);
    setMessageChildName(childName);
    setMessageContent("");
    setSent(false);
    setShowMessage(true);
  };

  const handleSendMessage = async () => {
    if (!userData || !messageContent.trim()) return;
    setSending(true);
    try {
      await sendMessage({
        fromUserId: userData.uid,
        fromName: userData.displayName,
        toChildId: messageChildId,
        kindergartenId: userData.kindergartenId,
        content: messageContent.trim(),
      });
      setSent(true);
      setTimeout(() => setShowMessage(false), 1500);
    } catch (error) {
      console.error("Failed to send:", error);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header title="기록 관리" />
        <LoadingSpinner text="불러오는 중..." />
      </>
    );
  }

  const weekLabels = tableData[0]?.weeks.map((w) => w.weekLabel) || [];

  return (
    <>
      <Header title="기록 관리" />
      <div className="px-4 py-4 space-y-5">
        {/* 전체 통계 */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="text-center bg-gradient-to-br from-blue-400 to-blue-600 text-white border-0">
            <p className="text-blue-100 text-xs">전체 아이</p>
            <p className="text-2xl font-bold">{tableData.length}</p>
            <p className="text-blue-200 text-xs">명</p>
          </Card>
          <Card className="text-center bg-gradient-to-br from-green-400 to-green-600 text-white border-0">
            <p className="text-green-100 text-xs">전체 독서량</p>
            <p className="text-2xl font-bold">{totalAll}</p>
            <p className="text-green-200 text-xs">권</p>
          </Card>
          <Card className="text-center bg-gradient-to-br from-orange-400 to-orange-600 text-white border-0">
            <p className="text-orange-100 text-xs">반 수</p>
            <p className="text-2xl font-bold">{classes.length}</p>
            <p className="text-orange-200 text-xs">개</p>
          </Card>
        </div>

        {/* 반 필터 + 엑셀 다운 */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadExcel}
            className="px-3 py-2 rounded-full text-sm font-medium bg-green-500 text-white whitespace-nowrap flex-shrink-0"
          >
            엑셀 다운
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedClassId("all")}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              selectedClassId === "all"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            전체
          </button>
          {classes.map((cls) => (
            <button
              key={cls.id}
              onClick={() => setSelectedClassId(cls.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedClassId === cls.id
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {cls.name}
            </button>
          ))}
        </div>

        {/* 엑셀 형태 테이블 */}
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="sticky left-0 bg-gray-50 z-10 text-left px-3 py-2.5 font-semibold text-gray-700 min-w-[100px]">
                    이름
                  </th>
                  <th className="text-center px-2 py-2.5 font-semibold text-gray-700 min-w-[50px]">
                    총합
                  </th>
                  {weekLabels.map((label, i) => (
                    <th
                      key={i}
                      className={`text-center px-2 py-2.5 font-medium min-w-[55px] ${
                        i === 0 ? "text-green-700 bg-green-50" : "text-gray-500"
                      }`}
                    >
                      {label}
                    </th>
                  ))}
                  <th className="text-center px-2 py-2.5 font-medium text-gray-500 min-w-[50px]">
                    메시지
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, idx) => (
                  <tr
                    key={row.childId}
                    className={`border-b border-gray-100 ${
                      idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                    } hover:bg-blue-50/50 transition-colors`}
                  >
                    <td className="sticky left-0 bg-inherit z-10 px-3 py-2.5">
                      <Link
                        href={`/children/${row.childId}`}
                        className="flex items-center gap-2 hover:text-green-600"
                      >
                        <span className="font-medium text-gray-900">{row.childName}</span>
                        {selectedClassId === "all" && (
                          <span className="text-[10px] text-gray-400">
                            {getClassName(row.classId)}
                          </span>
                        )}
                      </Link>
                    </td>
                    <td className="text-center px-2 py-2.5">
                      <span className="font-bold text-blue-600">{row.totalBooks}</span>
                    </td>
                    {row.weeks.map((week, i) => (
                      <td
                        key={i}
                        className={`text-center px-2 py-2.5 ${
                          i === 0 ? "bg-green-50/50" : ""
                        }`}
                      >
                        {week.count > 0 ? (
                          <span
                            className={`inline-block min-w-[24px] rounded-full px-1.5 py-0.5 text-xs font-bold ${
                              week.count >= 5
                                ? "bg-green-500 text-white"
                                : week.count >= 3
                                  ? "bg-green-200 text-green-800"
                                  : "bg-green-100 text-green-700"
                            }`}
                          >
                            {week.count}
                          </span>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                    ))}
                    <td className="text-center px-2 py-2.5">
                      <button
                        onClick={() => openMessage(row.childId, row.childName)}
                        className="text-blue-500 hover:text-blue-700 transition-colors"
                        title="메시지 보내기"
                      >
                        <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              {/* 합계 행 */}
              <tfoot>
                <tr className="bg-blue-50 border-t-2 border-blue-200">
                  <td className="sticky left-0 bg-blue-50 z-10 px-3 py-2.5 font-bold text-blue-800">
                    합계
                  </td>
                  <td className="text-center px-2 py-2.5 font-bold text-blue-800">
                    {filtered.reduce((s, d) => s + d.totalBooks, 0)}
                  </td>
                  {weekLabels.map((_, i) => (
                    <td key={i} className="text-center px-2 py-2.5 font-bold text-blue-700">
                      {filtered.reduce((s, d) => s + (d.weeks[i]?.count || 0), 0) || "-"}
                    </td>
                  ))}
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      </div>

      {/* 메시지 보내기 모달 */}
      <Modal
        isOpen={showMessage}
        onClose={() => setShowMessage(false)}
        title={`${messageChildName} 부모님께 메시지`}
      >
        {sent ? (
          <div className="text-center py-6">
            <span className="text-4xl">✅</span>
            <p className="font-bold text-gray-800 mt-3">메시지를 보냈습니다!</p>
          </div>
        ) : (
          <div className="space-y-4">
            <textarea
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              placeholder="부모님께 전할 메시지를 작성하세요..."
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:outline-none text-sm resize-none h-32"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setMessageContent("이번 주 독서 활동을 잘 하고 있어요! 계속 응원해주세요 📚")}
                className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full"
              >
                독서 칭찬
              </button>
              <button
                onClick={() => setMessageContent("독서 기록이 조금 부족해요. 함께 읽어주시면 좋겠어요 😊")}
                className="text-xs bg-orange-50 text-orange-600 px-3 py-1.5 rounded-full"
              >
                독서 독려
              </button>
              <button
                onClick={() => setMessageContent("뱃지 달성이 곧이에요! 조금만 더 힘내요! 🏅")}
                className="text-xs bg-yellow-50 text-yellow-600 px-3 py-1.5 rounded-full"
              >
                뱃지 응원
              </button>
            </div>
            <Button
              onClick={handleSendMessage}
              fullWidth
              loading={sending}
              disabled={!messageContent.trim()}
            >
              메시지 보내기
            </Button>
          </div>
        )}
      </Modal>
    </>
  );
}
