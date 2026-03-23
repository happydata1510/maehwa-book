/**
 * Firebase 초기 데이터 설정 스크립트
 * 실행: npx ts-node --esm scripts/setup-firebase.ts
 * 또는: npx tsx scripts/setup-firebase.ts
 *
 * 유치원, 반 4개, 선생님 5명(원장+반선생님4) 계정을 생성합니다.
 */

import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD2ZsE6FUIP_s2UUFkjevNlNdQdAh0bIpM",
  authDomain: "maehwa-book.firebaseapp.com",
  projectId: "maehwa-book",
  storageBucket: "maehwa-book.firebasestorage.app",
  messagingSenderId: "154798723069",
  appId: "1:154798723069:web:98561b3c5f93e740021394",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ==================== 데이터 정의 ====================

const KINDERGARTEN = {
  id: "maehwa",
  name: "매화유치원",
  address: "",
};

const CLASSES = [
  { id: "class-rose", name: "빛나는반", ageGroup: 5 },
  { id: "class-sunflower", name: "해맑은반", ageGroup: 5 },
  { id: "class-dream", name: "꿈꾸는반", ageGroup: 6 },
  { id: "class-wise", name: "슬기로운반", ageGroup: 7 },
];

const TEACHERS = [
  { email: "admin@maehwa.kr", password: "test1234", displayName: "이숙영", role: "admin", managedClassId: "" },
  { email: "rose@maehwa.kr", password: "test1234", displayName: "이예람", role: "teacher", managedClassId: "class-rose" },
  { email: "sun@maehwa.kr", password: "test1234", displayName: "곽다은", role: "teacher", managedClassId: "class-sunflower" },
  { email: "dream@maehwa.kr", password: "test1234", displayName: "전재은", role: "teacher", managedClassId: "class-dream" },
  { email: "wise@maehwa.kr", password: "test1234", displayName: "최한빈", role: "teacher", managedClassId: "class-wise" },
];

// ==================== 실행 ====================

async function setup() {
  console.log("🔧 매화유치원 Firebase 초기 설정 시작...\n");

  // 1. 유치원 문서 생성
  console.log("1️⃣ 유치원 생성...");
  await setDoc(doc(db, "kindergartens", KINDERGARTEN.id), {
    name: KINDERGARTEN.name,
    address: KINDERGARTEN.address,
    createdAt: serverTimestamp(),
  });
  console.log(`   ✅ ${KINDERGARTEN.name}\n`);

  // 2. 반 생성
  console.log("2️⃣ 반 생성...");
  for (const cls of CLASSES) {
    await setDoc(doc(db, "classes", cls.id), {
      name: cls.name,
      kindergartenId: KINDERGARTEN.id,
      teacherId: "",
      ageGroup: cls.ageGroup,
      createdAt: serverTimestamp(),
    });
    console.log(`   ✅ ${cls.name} (${cls.ageGroup}세)`);
  }
  console.log();

  // 3. 선생님 계정 생성
  console.log("3️⃣ 선생님 계정 생성...");
  for (const teacher of TEACHERS) {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        teacher.email,
        teacher.password
      );
      const uid = userCredential.user.uid;

      await updateProfile(userCredential.user, {
        displayName: teacher.displayName,
      });

      // Firestore users 문서 생성
      await setDoc(doc(db, "users", uid), {
        email: teacher.email,
        displayName: teacher.displayName,
        role: teacher.role,
        kindergartenId: KINDERGARTEN.id,
        linkedChildIds: [],
        managedClassId: teacher.managedClassId || null,
        createdAt: serverTimestamp(),
      });

      // 반 teacherId 업데이트
      if (teacher.managedClassId) {
        await setDoc(
          doc(db, "classes", teacher.managedClassId),
          { teacherId: uid },
          { merge: true }
        );
      }

      console.log(`   ✅ ${teacher.displayName} (${teacher.email}) - ${teacher.role}`);
    } catch (error: unknown) {
      const err = error as { code?: string };
      if (err.code === "auth/email-already-in-use") {
        console.log(`   ⚠️ ${teacher.email} - 이미 존재합니다 (건너뜀)`);
      } else {
        console.error(`   ❌ ${teacher.email} - 실패:`, error);
      }
    }
  }

  console.log("\n🎉 초기 설정 완료!");
  console.log("\n📋 선생님 계정 목록:");
  console.log("─".repeat(50));
  for (const t of TEACHERS) {
    console.log(`   ${t.role === "admin" ? "👑 원장" : "👩‍🏫 선생님"} | ${t.displayName} | ${t.email} | ${t.password}`);
  }
  console.log("─".repeat(50));

  process.exit(0);
}

setup().catch((error) => {
  console.error("❌ 설정 실패:", error);
  process.exit(1);
});
