import { Timestamp } from "firebase/firestore";
import { User, Class, Child, ReadingRecord, Badge, ReadingFeeling, Message } from "@/types";

// ==================== 데모 모드 플래그 ====================
export const DEMO_MODE = true;

// ==================== 원장선생님 (마스터/admin) ====================
export const DEMO_ADMIN: User = {
  uid: "admin-001",
  email: "admin@maehwa.kr",
  displayName: "이원장",
  role: "admin",
  kindergartenId: "maehwa",
  linkedChildIds: [],
  createdAt: Timestamp.fromDate(new Date("2025-03-01")),
};

// ==================== 반별 선생님 계정 (teacher) ====================
export const DEMO_TEACHER_ROSE: User = {
  uid: "teacher-rose",
  email: "rose@maehwa.kr",
  displayName: "박빛나",
  role: "teacher",
  kindergartenId: "maehwa",
  linkedChildIds: [],
  managedClassId: "class-rose",
  createdAt: Timestamp.fromDate(new Date("2025-03-01")),
};

export const DEMO_TEACHER_SUN: User = {
  uid: "teacher-sun",
  email: "sun@maehwa.kr",
  displayName: "최해맑",
  role: "teacher",
  kindergartenId: "maehwa",
  linkedChildIds: [],
  managedClassId: "class-sunflower",
  createdAt: Timestamp.fromDate(new Date("2025-03-01")),
};

export const DEMO_TEACHER_DREAM: User = {
  uid: "teacher-dream",
  email: "dream@maehwa.kr",
  displayName: "정꿈이",
  role: "teacher",
  kindergartenId: "maehwa",
  linkedChildIds: [],
  managedClassId: "class-dream",
  createdAt: Timestamp.fromDate(new Date("2025-03-01")),
};

export const DEMO_TEACHER_WISE: User = {
  uid: "teacher-wise",
  email: "wise@maehwa.kr",
  displayName: "김슬기",
  role: "teacher",
  kindergartenId: "maehwa",
  linkedChildIds: [],
  managedClassId: "class-wise",
  createdAt: Timestamp.fromDate(new Date("2025-03-01")),
};

// 기존 호환용
export const DEMO_USER = DEMO_TEACHER_ROSE;
export const DEMO_PASSWORD = "test1234";

// ==================== 부모 계정 ====================
export const DEMO_PARENT: User = {
  uid: "parent-001",
  email: "parent@maehwa.kr",
  displayName: "김하은맘",
  role: "parent",
  kindergartenId: "maehwa",
  linkedChildIds: ["child-1"],
  createdAt: Timestamp.fromDate(new Date("2025-03-01")),
};

export const DEMO_PARENT_PASSWORD = "test1234";

// 모든 데모 계정 목록
export const DEMO_ACCOUNTS = [
  { email: DEMO_ADMIN.email, password: DEMO_PASSWORD, user: DEMO_ADMIN, label: "원장선생님 (이원장)" },
  { email: DEMO_TEACHER_ROSE.email, password: DEMO_PASSWORD, user: DEMO_TEACHER_ROSE, label: "빛나는반 (박빛나)" },
  { email: DEMO_TEACHER_SUN.email, password: DEMO_PASSWORD, user: DEMO_TEACHER_SUN, label: "해맑은반 (최해맑)" },
  { email: DEMO_TEACHER_DREAM.email, password: DEMO_PASSWORD, user: DEMO_TEACHER_DREAM, label: "꿈꾸는반 (정꿈이)" },
  { email: DEMO_TEACHER_WISE.email, password: DEMO_PASSWORD, user: DEMO_TEACHER_WISE, label: "슬기로운반 (김슬기)" },
  { email: DEMO_PARENT.email, password: DEMO_PARENT_PASSWORD, user: DEMO_PARENT, label: "학부모 (김하은맘)" },
];

// ==================== 반 목록 ====================
export const DEMO_CLASSES: Class[] = [
  {
    id: "class-rose",
    name: "빛나는반",
    kindergartenId: "maehwa",
    teacherId: "master-001",
    ageGroup: 5,
    createdAt: Timestamp.fromDate(new Date("2025-03-01")),
  },
  {
    id: "class-sunflower",
    name: "해맑은반",
    kindergartenId: "maehwa",
    teacherId: "master-001",
    ageGroup: 5,
    createdAt: Timestamp.fromDate(new Date("2025-03-01")),
  },
  {
    id: "class-dream",
    name: "꿈꾸는반",
    kindergartenId: "maehwa",
    teacherId: "master-001",
    ageGroup: 6,
    createdAt: Timestamp.fromDate(new Date("2025-03-01")),
  },
  {
    id: "class-wise",
    name: "슬기로운반",
    kindergartenId: "maehwa",
    teacherId: "master-001",
    ageGroup: 7,
    createdAt: Timestamp.fromDate(new Date("2025-03-01")),
  },
];

// ==================== 아이 목록 ====================
export const DEMO_CHILDREN: Child[] = [
  {
    id: "child-1",
    name: "김하은",
    classId: "class-rose",           // 빛나는반 5세
    kindergartenId: "maehwa",
    profileImageUrl: null,
    birthDate: Timestamp.fromDate(new Date("2020-05-12")),
    parentUserIds: ["parent-001"],
    totalBooksRead: 95,
    monthlyBooksRead: 12,
    monthlyResetDate: "2026-03",
    createdAt: Timestamp.fromDate(new Date("2025-03-01")),
  },
  {
    id: "child-2",
    name: "이서준",
    classId: "class-sunflower",      // 해맑은반 5세
    kindergartenId: "maehwa",
    profileImageUrl: null,
    birthDate: Timestamp.fromDate(new Date("2020-08-03")),
    parentUserIds: ["parent-001"],
    totalBooksRead: 210,
    monthlyBooksRead: 18,
    monthlyResetDate: "2026-03",
    createdAt: Timestamp.fromDate(new Date("2025-03-01")),
  },
  {
    id: "child-3",
    name: "박지유",
    classId: "class-dream",          // 꿈꾸는반 6세
    kindergartenId: "maehwa",
    profileImageUrl: null,
    birthDate: Timestamp.fromDate(new Date("2019-11-20")),
    parentUserIds: [],
    totalBooksRead: 347,
    monthlyBooksRead: 25,
    monthlyResetDate: "2026-03",
    createdAt: Timestamp.fromDate(new Date("2025-03-01")),
  },
  {
    id: "child-4",
    name: "최도윤",
    classId: "class-dream",          // 꿈꾸는반 6세
    kindergartenId: "maehwa",
    profileImageUrl: null,
    birthDate: Timestamp.fromDate(new Date("2019-06-15")),
    parentUserIds: [],
    totalBooksRead: 150,
    monthlyBooksRead: 8,
    monthlyResetDate: "2026-03",
    createdAt: Timestamp.fromDate(new Date("2025-03-01")),
  },
  {
    id: "child-5",
    name: "정예린",
    classId: "class-wise",           // 슬기로운반 7세
    kindergartenId: "maehwa",
    profileImageUrl: null,
    birthDate: Timestamp.fromDate(new Date("2018-09-28")),
    parentUserIds: [],
    totalBooksRead: 523,
    monthlyBooksRead: 30,
    monthlyResetDate: "2026-03",
    createdAt: Timestamp.fromDate(new Date("2025-03-01")),
  },
  {
    id: "child-6",
    name: "강민준",
    classId: "class-wise",           // 슬기로운반 7세
    kindergartenId: "maehwa",
    profileImageUrl: null,
    birthDate: Timestamp.fromDate(new Date("2018-12-05")),
    parentUserIds: [],
    totalBooksRead: 980,
    monthlyBooksRead: 35,
    monthlyResetDate: "2026-03",
    createdAt: Timestamp.fromDate(new Date("2025-03-01")),
  },
];

// ==================== 샘플 책 데이터 ====================
const SAMPLE_BOOKS = [
  { title: "구름빵", author: "백희나", isbn: "9788949120508", coverUrl: "" },
  { title: "팥빙수의 전설", author: "이지은", isbn: "9788943310646", coverUrl: "" },
  { title: "이상한 나라의 앨리스", author: "루이스 캐럴", isbn: "9788937461033", coverUrl: "" },
  { title: "어린왕자", author: "생텍쥐페리", isbn: "9788932917245", coverUrl: "" },
  { title: "강아지똥", author: "권정생", isbn: "9788943304737", coverUrl: "" },
  { title: "괜찮아", author: "최숙희", isbn: "9788901048864", coverUrl: "" },
  { title: "곰 사냥을 떠나자", author: "마이클 로젠", isbn: "9788956550039", coverUrl: "" },
  { title: "무지개 물고기", author: "마르쿠스 피스터", isbn: "9788943306373", coverUrl: "" },
  { title: "나는 커서 어른이 되면", author: "하인즈 야니쉬", isbn: "9788943311025", coverUrl: "" },
  { title: "심심한 늑대", author: "박경효", isbn: "9788943312947", coverUrl: "" },
  { title: "배고픈 애벌레", author: "에릭 칼", isbn: "9788956553962", coverUrl: "" },
  { title: "으뜸 헤엄이", author: "레오 리오니", isbn: "9788943306816", coverUrl: "" },
];

function makeRecords(childId: string, classId: string, count: number): ReadingRecord[] {
  const records: ReadingRecord[] = [];
  for (let i = 0; i < Math.min(count, 30); i++) {
    const book = SAMPLE_BOOKS[i % SAMPLE_BOOKS.length];
    const daysAgo = i * 2;
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    records.push({
      id: `record-${childId}-${i}`,
      childId,
      classId,
      kindergartenId: "maehwa",
      bookTitle: book.title,
      bookAuthor: book.author,
      bookIsbn: book.isbn,
      bookCoverUrl: book.coverUrl || null,
      bookPublisher: null,
      readDate: Timestamp.fromDate(date),
      recordedBy: "master-001",
      memo: null,
      feeling: (["love", "fun", "learn", "fun", "love"] as ReadingFeeling[])[i % 5],
      createdAt: Timestamp.fromDate(date),
    });
  }
  return records;
}

// ==================== 독서 기록 ====================
export const DEMO_RECORDS: Record<string, ReadingRecord[]> = {
  "child-1": makeRecords("child-1", "class-rose", 95),
  "child-2": makeRecords("child-2", "class-sunflower", 30),
  "child-3": makeRecords("child-3", "class-dream", 30),
  "child-4": makeRecords("child-4", "class-dream", 30),
  "child-5": makeRecords("child-5", "class-wise", 30),
  "child-6": makeRecords("child-6", "class-wise", 30),
};

// ==================== 뱃지 ====================
function makeBadges(childId: string, totalBooks: number): Badge[] {
  const badges: Badge[] = [];
  const thresholds = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
  for (const t of thresholds) {
    if (totalBooks >= t) {
      badges.push({
        id: `badge-${childId}-${t}`,
        childId,
        kindergartenId: "maehwa",
        type: t === 1000 ? "king" : String(t),
        bookCount: t,
        earnedAt: Timestamp.fromDate(new Date("2026-01-15")),
        celebrated: true,
      });
    }
  }
  return badges;
}

export const DEMO_BADGES: Record<string, Badge[]> = {
  "child-1": makeBadges("child-1", 95),
  "child-2": makeBadges("child-2", 210),
  "child-3": makeBadges("child-3", 347),
  "child-4": makeBadges("child-4", 150),
  "child-5": makeBadges("child-5", 523),
  "child-6": makeBadges("child-6", 980),
};

// ==================== 인기 도서 ====================
export const DEMO_POPULAR_BOOKS = [
  { title: "구름빵", author: "백희나", coverUrl: "", count: 18 },
  { title: "배고픈 애벌레", author: "에릭 칼", coverUrl: "", count: 15 },
  { title: "강아지똥", author: "권정생", coverUrl: "", count: 14 },
  { title: "어린왕자", author: "생텍쥐페리", coverUrl: "", count: 12 },
  { title: "무지개 물고기", author: "마르쿠스 피스터", coverUrl: "", count: 11 },
  { title: "괜찮아", author: "최숙희", coverUrl: "", count: 10 },
  { title: "팥빙수의 전설", author: "이지은", coverUrl: "", count: 9 },
  { title: "곰 사냥을 떠나자", author: "마이클 로젠", coverUrl: "", count: 8 },
  { title: "심심한 늑대", author: "박경효", coverUrl: "", count: 7 },
  { title: "으뜸 헤엄이", author: "레오 리오니", coverUrl: "", count: 6 },
];

// ==================== 메시지 ====================
export const DEMO_MESSAGES: Message[] = [
  {
    id: "msg-1",
    fromUserId: "master-001",
    fromName: "김선생",
    toChildId: "child-1",
    kindergartenId: "maehwa",
    content: "김하은 어린이가 이번 주 독서를 잘 하고 있어요! 100권 달성이 곧이에요. 응원 부탁드려요! 📚",
    read: false,
    createdAt: Timestamp.fromDate(new Date("2026-03-20")),
  },
  {
    id: "msg-2",
    fromUserId: "master-001",
    fromName: "김선생",
    toChildId: "child-2",
    kindergartenId: "maehwa",
    content: "이번 달 독서 활동 우수 어린이로 이서준이 선정되었습니다! 축하해요! 🎉",
    read: false,
    createdAt: Timestamp.fromDate(new Date("2026-03-19")),
  },
];
