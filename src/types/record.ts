import { Timestamp } from "firebase/firestore";

export interface Child {
  id: string;
  name: string;
  classId: string;
  kindergartenId: string;
  profileImageUrl: string | null;
  birthDate: Timestamp | null;
  parentUserIds: string[];
  totalBooksRead: number;
  monthlyBooksRead: number;
  monthlyResetDate: string; // "2026-03" 형식
  createdAt: Timestamp;
}

// 독서 감상 이모지
export type ReadingFeeling = "love" | "fun" | "sad" | "scary" | "learn" | null;

export const FEELING_OPTIONS: { value: ReadingFeeling; emoji: string; label: string }[] = [
  { value: "love", emoji: "❤️", label: "한번 더 읽고 싶어!" },
  { value: "fun", emoji: "😆", label: "너무 재밌어서 웃었어!" },
  { value: "sad", emoji: "🥺", label: "마음이 뭉클했어..." },
  { value: "scary", emoji: "😲", label: "깜짝 놀랐어!" },
  { value: "learn", emoji: "💡", label: "새로운 걸 알게 됐어!" },
];

export interface ReadingRecord {
  id: string;
  childId: string;
  classId: string;
  kindergartenId: string;
  bookTitle: string;
  bookAuthor: string;
  bookIsbn: string | null;
  bookCoverUrl: string | null;
  bookPublisher: string | null;
  readDate: Timestamp;
  recordedBy: string;
  memo: string | null;
  feeling: ReadingFeeling;
  createdAt: Timestamp;
}

export interface NewReadingRecord {
  childId: string;
  classId: string;
  kindergartenId: string;
  bookTitle: string;
  bookAuthor: string;
  bookIsbn: string | null;
  bookCoverUrl: string | null;
  bookPublisher: string | null;
  readDate: Date;
  recordedBy: string;
  memo: string | null;
  feeling: ReadingFeeling;
}
