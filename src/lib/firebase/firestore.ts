import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  limit,
  serverTimestamp,
  runTransaction,
  increment,
  Timestamp,
} from "firebase/firestore";
import { db } from "./config";
import { Class, Child, ReadingRecord, NewReadingRecord, Badge, Message } from "@/types";
import { checkNewBadges, BadgeDefinition } from "@/lib/badge-rules";
import {
  DEMO_MODE,
  DEMO_CLASSES,
  DEMO_CHILDREN,
  DEMO_RECORDS,
  DEMO_MESSAGES,
  DEMO_BADGES,
  DEMO_POPULAR_BOOKS,
} from "@/lib/demo-data";

// ==================== 인메모리 스토어 ====================
// 항상 인메모리에 저장 (즉시 읽기), Firestore는 백그라운드 동기화
const demoClasses = [...DEMO_CLASSES];
const demoChildren = DEMO_CHILDREN.map((c) => ({ ...c }));
const demoRecords: Record<string, ReadingRecord[]> = {};
for (const [k, v] of Object.entries(DEMO_RECORDS)) {
  demoRecords[k] = [...v];
}
const demoBadges: Record<string, Badge[]> = {};
for (const [k, v] of Object.entries(DEMO_BADGES)) {
  demoBadges[k] = [...v];
}

// ==================== Classes ====================

export async function getClassesByKindergarten(kindergartenId: string): Promise<Class[]> {
  if (DEMO_MODE) {
    return demoClasses.filter((c) => c.kindergartenId === kindergartenId);
  }
  try {
    const q = query(collection(db, "classes"), where("kindergartenId", "==", kindergartenId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Class));
  } catch (e) { console.error("getClassesByKindergarten:", e); return []; }
}

export async function addClass(data: {
  name: string;
  kindergartenId: string;
  teacherId: string;
  ageGroup: number;
}): Promise<string> {
  if (DEMO_MODE) {
    const id = `class-${Date.now()}`;
    demoClasses.push({
      id,
      ...data,
      createdAt: Timestamp.now(),
    });
    return id;
  }
  const docRef = await addDoc(collection(db, "classes"), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateClassName(classId: string, newName: string): Promise<void> {
  if (DEMO_MODE) {
    const cls = demoClasses.find((c) => c.id === classId);
    if (cls) cls.name = newName;
    return;
  }
  await updateDoc(doc(db, "classes", classId), { name: newName });
}

export async function deleteClass(classId: string): Promise<void> {
  if (DEMO_MODE) {
    const idx = demoClasses.findIndex((c) => c.id === classId);
    if (idx !== -1) demoClasses.splice(idx, 1);
    return;
  }
  await deleteDoc(doc(db, "classes", classId));
}

// ==================== Children ====================

export async function getChildrenByClass(classId: string): Promise<Child[]> {
  if (DEMO_MODE) return demoChildren.filter((c) => c.classId === classId);
  try {
    const q = query(collection(db, "children"), where("classId", "==", classId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Child));
  } catch (e) { console.error("getChildrenByClass:", e); return []; }
}

export async function getChildrenByKindergarten(kindergartenId: string): Promise<Child[]> {
  const memResult = demoChildren.filter((c) => c.kindergartenId === kindergartenId);
  if (DEMO_MODE || memResult.length > 0) return memResult;
  try {
    const q = query(collection(db, "children"), where("kindergartenId", "==", kindergartenId));
    const snapshot = await getDocs(q);
    const result = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Child));
    for (const child of result) {
      if (!demoChildren.find((c) => c.id === child.id)) demoChildren.push(child);
    }
    return result.length > 0 ? result : memResult;
  } catch (e) { console.error("getChildrenByKindergarten:", e); return memResult; }
}

export async function getChildrenByParent(parentUserId: string): Promise<Child[]> {
  // 인메모리에서 즉시 반환
  const memResult = demoChildren.filter((c) => c.parentUserIds.includes(parentUserId));
  if (DEMO_MODE || memResult.length > 0) return memResult;
  // 인메모리에 없으면 Firestore 조회
  try {
    const q = query(collection(db, "children"), where("parentUserIds", "array-contains", parentUserId));
    const snapshot = await getDocs(q);
    const result = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Child));
    // Firestore 결과를 인메모리에 머지
    for (const child of result) {
      if (!demoChildren.find((c) => c.id === child.id)) demoChildren.push(child);
    }
    return result.length > 0 ? result : memResult;
  } catch (e) { console.error("getChildrenByParent:", e); return memResult; }
}

export async function getChild(childId: string): Promise<Child | null> {
  if (DEMO_MODE) {
    return demoChildren.find((c) => c.id === childId) || null;
  }
  const snap = await getDoc(doc(db, "children", childId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Child;
}

export async function addChild(data: {
  name: string;
  classId: string;
  kindergartenId: string;
  birthDate?: Date | null;
  parentUserIds?: string[];
}): Promise<string> {
  // 항상 인메모리에 즉시 저장
  const id = `child-${Date.now()}`;
  const newChild: Child = {
    id,
    name: data.name,
    classId: data.classId,
    kindergartenId: data.kindergartenId,
    profileImageUrl: null,
    birthDate: data.birthDate ? Timestamp.fromDate(data.birthDate) : null,
    parentUserIds: data.parentUserIds || [],
    totalBooksRead: 0,
    monthlyBooksRead: 0,
    monthlyResetDate: getCurrentMonth(),
    createdAt: Timestamp.now(),
  };
  demoChildren.push(newChild);

  if (DEMO_MODE) return id;
  const docRef = await addDoc(collection(db, "children"), {
    name: data.name,
    classId: data.classId,
    kindergartenId: data.kindergartenId,
    profileImageUrl: null,
    birthDate: data.birthDate ? Timestamp.fromDate(data.birthDate) : null,
    parentUserIds: data.parentUserIds || [],
    totalBooksRead: 0,
    monthlyBooksRead: 0,
    monthlyResetDate: getCurrentMonth(),
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateChild(
  childId: string,
  data: Partial<{ name: string; classId: string; parentUserIds: string[] }>
): Promise<void> {
  // 인메모리 즉시 업데이트
  const child = demoChildren.find((c) => c.id === childId);
  if (child) Object.assign(child, data);
  if (DEMO_MODE) return;
  try { await updateDoc(doc(db, "children", childId), data); } catch (e) { console.error("updateChild:", e); }
}

export async function deleteChild(childId: string): Promise<void> {
  // 인메모리 즉시 삭제
  const idx = demoChildren.findIndex((c) => c.id === childId);
  if (idx !== -1) demoChildren.splice(idx, 1);
  if (DEMO_MODE) return;
  try { await deleteDoc(doc(db, "children", childId)); } catch (e) { console.error("deleteChild:", e); }
}

// ==================== Reading Records ====================

export async function getReadingRecords(
  childId: string,
  limitCount: number = 50
): Promise<ReadingRecord[]> {
  if (DEMO_MODE) {
    return (demoRecords[childId] || []).slice(0, limitCount);
  }
  const q = query(
    collection(db, "readingRecords"),
    where("childId", "==", childId),
    limit(limitCount)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as ReadingRecord));
}

export async function addReadingRecord(
  record: NewReadingRecord
): Promise<{ recordId: string; newBadges: BadgeDefinition[] }> {
  // 항상 인메모리에서 처리 (즉시 반영)
  {
    const child = demoChildren.find((c) => c.id === record.childId);
    if (!child) throw new Error("아이 정보를 찾을 수 없습니다.");

    const previousCount = child.totalBooksRead;
    const newCount = previousCount + 1;

    // 기록 추가
    const recordId = `record-${Date.now()}`;
    const newRecord: ReadingRecord = {
      id: recordId,
      ...record,
      readDate: Timestamp.fromDate(record.readDate),
      createdAt: Timestamp.now(),
    };

    if (!demoRecords[record.childId]) demoRecords[record.childId] = [];
    demoRecords[record.childId].unshift(newRecord);

    // 카운트 업데이트
    child.totalBooksRead = newCount;
    child.monthlyBooksRead += 1;

    // 뱃지 판정
    const newBadges = checkNewBadges(previousCount, newCount);
    for (const badge of newBadges) {
      const badgeObj: Badge = {
        id: `badge-${Date.now()}-${badge.type}`,
        childId: record.childId,
        kindergartenId: record.kindergartenId,
        type: badge.type,
        bookCount: badge.threshold,
        earnedAt: Timestamp.now(),
        celebrated: false,
      };
      if (!demoBadges[record.childId]) demoBadges[record.childId] = [];
      demoBadges[record.childId].push(badgeObj);
    }

    // Firestore에도 백그라운드로 저장
    if (!DEMO_MODE) {
      addDoc(collection(db, "readingRecords"), {
        ...record,
        readDate: Timestamp.fromDate(record.readDate),
        createdAt: serverTimestamp(),
      }).catch((e) => console.error("addReadingRecord firestore:", e));
    }

    return { recordId, newBadges };
  }
}

export async function deleteReadingRecord(recordId: string, childId: string): Promise<void> {
  if (DEMO_MODE) {
    const records = demoRecords[childId];
    if (records) {
      const idx = records.findIndex((r) => r.id === recordId);
      if (idx !== -1) records.splice(idx, 1);
    }
    const child = demoChildren.find((c) => c.id === childId);
    if (child) {
      child.totalBooksRead = Math.max(0, child.totalBooksRead - 1);
      child.monthlyBooksRead = Math.max(0, child.monthlyBooksRead - 1);
    }
    return;
  }
  await runTransaction(db, async (transaction) => {
    transaction.delete(doc(db, "readingRecords", recordId));
    transaction.update(doc(db, "children", childId), {
      totalBooksRead: increment(-1),
      monthlyBooksRead: increment(-1),
    });
  });
}

// ==================== Badges ====================

export async function getBadgesByChild(childId: string): Promise<Badge[]> {
  if (DEMO_MODE) {
    return demoBadges[childId] || [];
  }
  const q = query(
    collection(db, "badges"),
    where("childId", "==", childId),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Badge));
}

export async function getUncelebratedBadges(childId: string): Promise<Badge[]> {
  if (DEMO_MODE) {
    return (demoBadges[childId] || []).filter((b) => !b.celebrated);
  }
  const q = query(
    collection(db, "badges"),
    where("childId", "==", childId),
    where("celebrated", "==", false)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Badge));
}

export async function markBadgeCelebrated(badgeId: string): Promise<void> {
  if (DEMO_MODE) {
    for (const badges of Object.values(demoBadges)) {
      const badge = badges.find((b) => b.id === badgeId);
      if (badge) {
        badge.celebrated = true;
        return;
      }
    }
    return;
  }
  await updateDoc(doc(db, "badges", badgeId), { celebrated: true });
}

// ==================== Popular Books ====================

export async function getPopularBooks(
  kindergartenId: string,
  limitCount: number = 10
): Promise<{ title: string; author: string; coverUrl: string; count: number }[]> {
  if (DEMO_MODE) {
    return DEMO_POPULAR_BOOKS.slice(0, limitCount);
  }
  const q = query(
    collection(db, "readingRecords"),
    where("kindergartenId", "==", kindergartenId),
    limit(200)
  );
  const snapshot = await getDocs(q);

  const bookCounts = new Map<string, { title: string; author: string; coverUrl: string; count: number }>();

  snapshot.docs.forEach((d) => {
    const data = d.data();
    const key = data.bookTitle;
    const existing = bookCounts.get(key);
    if (existing) {
      existing.count++;
    } else {
      bookCounts.set(key, {
        title: data.bookTitle,
        author: data.bookAuthor || "",
        coverUrl: data.bookCoverUrl || "",
        count: 1,
      });
    }
  });

  return Array.from(bookCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limitCount);
}

// ==================== 도서관 모드: 전체 독서 이력 검색 ====================

export interface LibraryBook {
  title: string;
  author: string;
  coverUrl: string;
  isbn: string | null;
  readByChildren: { childId: string; childName: string; readDate: string }[];
  totalReads: number;
}

export async function getAllBooksInLibrary(
  kindergartenId: string
): Promise<LibraryBook[]> {
  if (DEMO_MODE) {
    const bookMap = new Map<string, LibraryBook>();

    for (const child of demoChildren.filter(
      (c) => c.kindergartenId === kindergartenId
    )) {
      const records = demoRecords[child.id] || [];
      for (const rec of records) {
        const key = rec.bookTitle;
        const existing = bookMap.get(key);
        const readDateStr = rec.readDate?.toDate?.()
          ? rec.readDate.toDate().toLocaleDateString("ko-KR")
          : "";
        if (existing) {
          existing.totalReads++;
          if (!existing.readByChildren.find((r) => r.childId === child.id)) {
            existing.readByChildren.push({
              childId: child.id,
              childName: child.name,
              readDate: readDateStr,
            });
          }
        } else {
          bookMap.set(key, {
            title: rec.bookTitle,
            author: rec.bookAuthor,
            coverUrl: rec.bookCoverUrl || "",
            isbn: rec.bookIsbn,
            readByChildren: [
              { childId: child.id, childName: child.name, readDate: readDateStr },
            ],
            totalReads: 1,
          });
        }
      }
    }

    return Array.from(bookMap.values()).sort((a, b) => b.totalReads - a.totalReads);
  }

  // Firebase 모드
  const q = query(
    collection(db, "readingRecords"),
    where("kindergartenId", "==", kindergartenId),
    limit(500)
  );
  const snapshot = await getDocs(q);
  const bookMap = new Map<string, LibraryBook>();

  for (const d of snapshot.docs) {
    const data = d.data();
    const key = data.bookTitle;
    const existing = bookMap.get(key);
    if (existing) {
      existing.totalReads++;
    } else {
      bookMap.set(key, {
        title: data.bookTitle,
        author: data.bookAuthor || "",
        coverUrl: data.bookCoverUrl || "",
        isbn: data.bookIsbn || null,
        readByChildren: [],
        totalReads: 1,
      });
    }
  }

  return Array.from(bookMap.values()).sort((a, b) => b.totalReads - a.totalReads);
}

// ==================== 월별 독서 기록 ====================

export async function getReadingRecordsByMonth(
  childId: string,
  year: number,
  month: number
): Promise<ReadingRecord[]> {
  if (DEMO_MODE) {
    return (demoRecords[childId] || []).filter((r) => {
      const d = r.readDate?.toDate?.();
      if (!d) return false;
      return d.getFullYear() === year && d.getMonth() + 1 === month;
    });
  }

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);
  const q = query(
    collection(db, "readingRecords"),
    where("childId", "==", childId),
    where("readDate", ">=", Timestamp.fromDate(startDate)),
    where("readDate", "<=", Timestamp.fromDate(endDate)),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as ReadingRecord));
}

// ==================== 연속 독서일 계산 ====================

export function calculateReadingStreak(records: ReadingRecord[]): number {
  if (records.length === 0) return 0;

  const dates = new Set<string>();
  for (const r of records) {
    const d = r.readDate?.toDate?.();
    if (d) dates.add(d.toISOString().split("T")[0]);
  }

  let streak = 0;
  const today = new Date();

  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    const key = checkDate.toISOString().split("T")[0];
    if (dates.has(key)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  return streak;
}

// ==================== 메시지 ====================

const demoMessages = [...DEMO_MESSAGES];

export async function sendMessage(data: {
  fromUserId: string;
  fromName: string;
  toChildId: string;
  kindergartenId: string;
  content: string;
}): Promise<string> {
  if (DEMO_MODE) {
    const id = `msg-${Date.now()}`;
    demoMessages.unshift({
      id,
      ...data,
      read: false,
      createdAt: Timestamp.now(),
    });
    return id;
  }
  const docRef = await addDoc(collection(db, "messages"), {
    ...data,
    read: false,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getMessagesForChild(childId: string): Promise<Message[]> {
  if (DEMO_MODE) {
    return demoMessages.filter((m) => m.toChildId === childId);
  }
  const q = query(
    collection(db, "messages"),
    where("toChildId", "==", childId),
    limit(50)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Message));
}

export async function getUnreadMessages(childIds: string[]): Promise<Message[]> {
  if (DEMO_MODE) {
    return demoMessages.filter(
      (m) => childIds.includes(m.toChildId) && !m.read
    );
  }
  // Firebase에서는 childIds별로 쿼리 (10개까지)
  const allMessages: Message[] = [];
  for (const childId of childIds.slice(0, 10)) {
    const q = query(
      collection(db, "messages"),
      where("toChildId", "==", childId),
      where("read", "==", false)
    );
    const snapshot = await getDocs(q);
    allMessages.push(
      ...snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Message))
    );
  }
  return allMessages;
}

export async function markMessageRead(messageId: string): Promise<void> {
  if (DEMO_MODE) {
    const msg = demoMessages.find((m) => m.id === messageId);
    if (msg) msg.read = true;
    return;
  }
  await updateDoc(doc(db, "messages", messageId), { read: true });
}

// ==================== 도서 자동완성 ====================

export async function getBookSuggestions(
  kindergartenId: string,
  queryText: string
): Promise<{ title: string; author: string }[]> {
  if (DEMO_MODE) {
    const allBooks = new Map<string, { title: string; author: string }>();

    for (const child of demoChildren.filter(
      (c) => c.kindergartenId === kindergartenId
    )) {
      for (const rec of demoRecords[child.id] || []) {
        if (!allBooks.has(rec.bookTitle)) {
          allBooks.set(rec.bookTitle, {
            title: rec.bookTitle,
            author: rec.bookAuthor,
          });
        }
      }
    }

    const q = queryText.toLowerCase();
    return Array.from(allBooks.values()).filter(
      (b) => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)
    );
  }

  // Firebase: books 캐시 컬렉션에서 검색
  const q2 = query(collection(db, "books"), limit(100));
  const snapshot = await getDocs(q2);
  const qt = queryText.toLowerCase();
  return snapshot.docs
    .map((d) => ({ title: d.data().title, author: d.data().author }))
    .filter((b) => b.title.toLowerCase().includes(qt) || b.author.toLowerCase().includes(qt));
}

// ==================== 주차별 독서량 (엑셀 테이블용) ====================

export interface WeeklyData {
  childId: string;
  childName: string;
  classId: string;
  totalBooks: number;
  weeks: { weekLabel: string; startDate: string; count: number }[];
}

export async function getWeeklyTableData(
  kindergartenId: string,
  weeksCount: number = 8
): Promise<WeeklyData[]> {
  const children = DEMO_MODE
    ? demoChildren.filter((c) => c.kindergartenId === kindergartenId)
    : await (async () => {
        const q = query(
          collection(db, "children"),
          where("kindergartenId", "==", kindergartenId),
        );
        const snap = await getDocs(q);
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Child));
      })();

  const now = new Date();
  const weeks: { label: string; start: Date; end: Date; startStr: string }[] = [];
  for (let i = 0; i < weeksCount; i++) {
    const end = new Date(now);
    end.setDate(end.getDate() - i * 7);
    end.setHours(23, 59, 59);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0);

    const label =
      i === 0
        ? "이번주"
        : `${start.getMonth() + 1}/${start.getDate()}`;
    weeks.push({ label, start, end, startStr: start.toISOString().split("T")[0] });
  }

  const result: WeeklyData[] = [];

  for (const child of children) {
    const records = DEMO_MODE
      ? demoRecords[child.id] || []
      : await (async () => {
          const q = query(
            collection(db, "readingRecords"),
            where("childId", "==", child.id),
            limit(200)
          );
          const snap = await getDocs(q);
          return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ReadingRecord));
        })();

    const weekCounts = weeks.map((w) => {
      const count = records.filter((r) => {
        const d = r.readDate?.toDate?.();
        if (!d) return false;
        return d >= w.start && d <= w.end;
      }).length;
      return { weekLabel: w.label, startDate: w.startStr, count };
    });

    result.push({
      childId: child.id,
      childName: child.name,
      classId: child.classId,
      totalBooks: child.totalBooksRead,
      weeks: weekCounts,
    });
  }

  return result;
}

// ==================== 주간 독서 목표 ====================

const demoWeeklyGoals: Record<string, number> = {
  "child-1": 5,
  "child-2": 7,
};

export async function getWeeklyGoal(childId: string): Promise<number> {
  if (DEMO_MODE) return demoWeeklyGoals[childId] || 5;
  const snap = await getDoc(doc(db, "weeklyGoals", childId));
  return snap.exists() ? snap.data().goal : 5;
}

export async function setWeeklyGoal(childId: string, goal: number): Promise<void> {
  if (DEMO_MODE) {
    demoWeeklyGoals[childId] = goal;
    return;
  }
  await updateDoc(doc(db, "weeklyGoals", childId), { goal });
}

export function getThisWeekCount(records: ReadingRecord[]): number {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(now);
  monday.setDate(monday.getDate() - mondayOffset);
  monday.setHours(0, 0, 0, 0);

  return records.filter((r) => {
    const d = r.readDate?.toDate?.();
    return d && d >= monday;
  }).length;
}

// ==================== 추천 도서 ====================

export interface RecommendedBook {
  id: string;
  title: string;
  author: string;
  reason: string;
  classId: string;
  addedBy: string;
  addedByName: string;
}

const demoRecommendedBooks: RecommendedBook[] = [
  { id: "rec-1", title: "구름빵", author: "백희나", reason: "상상력이 풍부해지는 그림책", classId: "class-rose", addedBy: "master-001", addedByName: "김선생" },
  { id: "rec-2", title: "괜찮아", author: "최숙희", reason: "자존감을 높여주는 따뜻한 이야기", classId: "class-rose", addedBy: "master-001", addedByName: "김선생" },
  { id: "rec-3", title: "배고픈 애벌레", author: "에릭 칼", reason: "숫자와 요일을 배울 수 있어요", classId: "class-dream", addedBy: "master-001", addedByName: "김선생" },
  { id: "rec-4", title: "어린왕자", author: "생텍쥐페리", reason: "우정과 사랑에 대해 생각해보기", classId: "class-wise", addedBy: "master-001", addedByName: "김선생" },
  { id: "rec-5", title: "강아지똥", author: "권정생", reason: "생명의 소중함을 배워요", classId: "class-sunflower", addedBy: "master-001", addedByName: "김선생" },
];

export async function getRecommendedBooks(classId: string): Promise<RecommendedBook[]> {
  if (DEMO_MODE) {
    return demoRecommendedBooks.filter((b) => b.classId === classId);
  }
  const q = query(
    collection(db, "recommendedBooks"),
    where("classId", "==", classId),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as RecommendedBook));
}

export async function addRecommendedBook(data: Omit<RecommendedBook, "id">): Promise<string> {
  if (DEMO_MODE) {
    const id = `rec-${Date.now()}`;
    demoRecommendedBooks.push({ id, ...data });
    return id;
  }
  const docRef = await addDoc(collection(db, "recommendedBooks"), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

// ==================== 독서 리포트 ====================

export interface MonthlyReport {
  childName: string;
  totalBooks: number;
  monthBooks: number;
  topBooks: { title: string; count: number }[];
  feelingStats: { feeling: string; count: number }[];
  readingDays: number;
  streak: number;
  badgesEarned: string[];
}

export async function generateMonthlyReport(
  childId: string,
  year: number,
  month: number
): Promise<MonthlyReport | null> {
  const child = DEMO_MODE
    ? demoChildren.find((c) => c.id === childId)
    : await getChild(childId);

  if (!child) return null;

  const records = DEMO_MODE
    ? (demoRecords[childId] || []).filter((r) => {
        const d = r.readDate?.toDate?.();
        return d && d.getFullYear() === year && d.getMonth() + 1 === month;
      })
    : await getReadingRecordsByMonth(childId, year, month);

  // 감상 통계
  const feelingMap = new Map<string, number>();
  for (const r of records) {
    if (r.feeling) {
      feelingMap.set(r.feeling, (feelingMap.get(r.feeling) || 0) + 1);
    }
  }

  // 읽은 날 수
  const readDates = new Set<string>();
  for (const r of records) {
    const d = r.readDate?.toDate?.();
    if (d) readDates.add(d.toISOString().split("T")[0]);
  }

  // 자주 읽은 책
  const bookCounts = new Map<string, number>();
  for (const r of records) {
    bookCounts.set(r.bookTitle, (bookCounts.get(r.bookTitle) || 0) + 1);
  }

  const allRecords = DEMO_MODE
    ? demoRecords[childId] || []
    : await getReadingRecords(childId, 200);

  return {
    childName: child.name,
    totalBooks: child.totalBooksRead,
    monthBooks: records.length,
    topBooks: Array.from(bookCounts.entries())
      .map(([title, count]) => ({ title, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
    feelingStats: Array.from(feelingMap.entries())
      .map(([feeling, count]) => ({ feeling, count }))
      .sort((a, b) => b.count - a.count),
    readingDays: readDates.size,
    streak: calculateReadingStreak(allRecords),
    badgesEarned: (demoBadges[childId] || []).map((b) => b.type),
  };
}

// ==================== Helpers ====================

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
