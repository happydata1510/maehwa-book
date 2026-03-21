"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getChild, getReadingRecords } from "@/lib/firebase/firestore";
import { Child, ReadingRecord } from "@/types";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function RecordsPage() {
  const params = useParams();
  const childId = params.childId as string;

  const [child, setChild] = useState<Child | null>(null);
  const [records, setRecords] = useState<ReadingRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [childData, recordData] = await Promise.all([
          getChild(childId),
          getReadingRecords(childId, 200),
        ]);
        setChild(childData);
        setRecords(recordData);
      } catch (error) {
        console.error("Failed to fetch:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [childId]);

  if (loading) {
    return (
      <>
        <Header title="독서 기록" showBack />
        <LoadingSpinner />
      </>
    );
  }

  return (
    <>
      <Header title={`${child?.name || ""} 독서 기록`} showBack />
      <div className="px-4 py-4">
        <p className="text-sm text-gray-500 mb-4">
          총 {records.length}권
        </p>

        {records.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-gray-500">독서 기록이 없습니다</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {records.map((record, index) => (
              <Card key={record.id} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-sm font-bold text-green-600">
                  {records.length - index}
                </div>
                {record.bookCoverUrl ? (
                  <img
                    src={record.bookCoverUrl}
                    alt={record.bookTitle}
                    className="w-10 h-14 object-cover rounded"
                  />
                ) : (
                  <div className="w-10 h-14 bg-gray-100 rounded flex items-center justify-center text-lg">
                    📕
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">
                    {record.bookTitle}
                  </p>
                  <p className="text-xs text-gray-500">{record.bookAuthor}</p>
                </div>
                <p className="text-xs text-gray-400 whitespace-nowrap">
                  {record.readDate?.toDate?.()
                    ? record.readDate.toDate().toLocaleDateString("ko-KR", {
                        month: "short",
                        day: "numeric",
                      })
                    : ""}
                </p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
