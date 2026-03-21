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
  orderBy,
  limit,
  serverTimestamp,
  runTransaction,
  increment,
  Timestamp,
} from "firebase/firestore";
import { db } from "./config";
import { Class, Child, ReadingRecord, NewReadingRecord, Badge } from "@/types";
import { checkNewBadges, BadgeDefinition } from "@/lib/badge-rules";
import {
  DEMO_MODE,
  DEMO_CLASSES,
  DEMO_CHILDREN,
  DEMO_RECORDS,
  DEMO_BADGES,
  DEMO_POPULAR_BOOKS,
} from "@/lib/demo-data";

// ==================== 데모 인메모리 스토어 ====================
// 데모 모드에서 추가/삭제가 반영되도록 mutable 복사본 사용
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
  const q = query(
    collection(db, "classes"),
    where("kindergartenId", "==", kindergartenId),
    orderBy("name")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Class));
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
  if (DEMO_MODE) {
    return demoChildren.filter((c) => c.classId === classId);
  }
  const q = query(
    collection(db, "children"),
    where("classId", "==", classId),
    orderBy("name")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Child));
}

export async function getChildrenByKindergarten(kindergartenId: string): Promise<Child[]> {
  if (DEMO_MODE) {
    return demoChildren.filter((c) => c.kindergartenId === kindergartenId);
  }
  const q = query(
    collection(db, "children"),
    where("kindergartenId", "==", kindergartenId),
    orderBy("name")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Child));
}

export async function getChildrenByParent(parentUserId: string): Promise<Child[]> {
  if (DEMO_MODE) {
    return demoChildren.filter((c) => c.parentUserIds.includes(parentUserId));
  }
  const q = query(
    collection(db, "children"),
    where("parentUserIds", "array-contains", parentUserId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Child));
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
  if (DEMO_MODE) {
    const id = `child-${Date.now()}`;
    demoChildren.push({
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
    });
    return id;
  }
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
  if (DEMO_MODE) {
    const child = demoChildren.find((c) => c.id === childId);
    if (child) Object.assign(child, data);
    return;
  }
  await updateDoc(doc(db, "children", childId), data);
}

export async function deleteChild(childId: string): Promise<void> {
  if (DEMO_MODE) {
    const idx = demoChildren.findIndex((c) => c.id === childId);
    if (idx !== -1) demoChildren.splice(idx, 1);
    return;
  }
  await deleteDoc(doc(db, "children", childId));
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
    orderBy("readDate", "desc"),
    limit(limitCount)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as ReadingRecord));
}

export async function addReadingRecord(
  record: NewReadingRecord
): Promise<{ recordId: string; newBadges: BadgeDefinition[] }> {
  if (DEMO_MODE) {
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

    return { recordId, newBadges };
  }

  return runTransaction(db, async (transaction) => {
    const childRef = doc(db, "children", record.childId);
    const childSnap = await transaction.get(childRef);

    if (!childSnap.exists()) {
      throw new Error("아이 정보를 찾을 수 없습니다.");
    }

    const childData = childSnap.data();
    const previousCount: number = childData.totalBooksRead || 0;
    const currentMonth = getCurrentMonth();
    const monthlyReset = childData.monthlyResetDate !== currentMonth;
    const newCount = previousCount + 1;

    const recordRef = doc(collection(db, "readingRecords"));
    transaction.set(recordRef, {
      ...record,
      readDate: Timestamp.fromDate(record.readDate),
      createdAt: serverTimestamp(),
    });

    if (monthlyReset) {
      transaction.update(childRef, {
        totalBooksRead: increment(1),
        monthlyBooksRead: 1,
        monthlyResetDate: currentMonth,
      });
    } else {
      transaction.update(childRef, {
        totalBooksRead: increment(1),
        monthlyBooksRead: increment(1),
      });
    }

    const newBadges = checkNewBadges(previousCount, newCount);
    for (const badge of newBadges) {
      const badgeRef = doc(collection(db, "badges"));
      transaction.set(badgeRef, {
        childId: record.childId,
        kindergartenId: record.kindergartenId,
        type: badge.type,
        bookCount: badge.threshold,
        earnedAt: serverTimestamp(),
        celebrated: false,
      });
    }

    if (record.bookIsbn) {
      const bookRef = doc(db, "books", record.bookIsbn);
      transaction.set(
        bookRef,
        {
          title: record.bookTitle,
          author: record.bookAuthor,
          publisher: record.bookPublisher || "",
          coverUrl: record.bookCoverUrl || "",
          cachedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }

    return { recordId: recordRef.id, newBadges };
  });
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
    orderBy("earnedAt", "desc")
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
    orderBy("createdAt", "desc"),
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
    orderBy("createdAt", "desc"),
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
    orderBy("readDate", "desc")
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

  const sorted = Array.from(dates).sort().reverse();
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

// ==================== Helpers ====================

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
