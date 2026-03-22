"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface Tab {
  label: string;
  href: string;
  icon: (active: boolean) => React.ReactNode;
  isCenter?: boolean;
}

const HomeIcon = (active: boolean) => (
  <svg className={`w-6 h-6 ${active ? "text-green-600" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const ChildrenIcon = (active: boolean) => (
  <svg className={`w-6 h-6 ${active ? "text-green-600" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
  </svg>
);

const SearchIcon = (active: boolean) => (
  <svg className={`w-6 h-6 ${active ? "text-green-600" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const SettingsIcon = (active: boolean) => (
  <svg className={`w-6 h-6 ${active ? "text-green-600" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const ManageIcon = (active: boolean) => (
  <svg className={`w-6 h-6 ${active ? "text-green-600" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
);

// 선생님용 탭
const teacherTabs: Tab[] = [
  { label: "홈", href: "/home", icon: HomeIcon },
  { label: "아이들", href: "/children", icon: ChildrenIcon },
  { label: "기록관리", href: "/manage", icon: ManageIcon, isCenter: true },
  { label: "도서관", href: "/library", icon: SearchIcon },
  { label: "설정", href: "/settings", icon: SettingsIcon },
];

// 부모용 탭
const parentTabs: Tab[] = [
  { label: "홈", href: "/home", icon: HomeIcon },
  { label: "도서관", href: "/library", icon: SearchIcon },
  { label: "기록하기", href: "/record", icon: () => PlusIcon(), isCenter: true },
  { label: "내 아이", href: `/children`, icon: ChildrenIcon },
  { label: "설정", href: "/settings", icon: SettingsIcon },
];

export default function BottomTabBar() {
  const pathname = usePathname();
  const { userData } = useAuth();

  const isTeacher = userData?.role === "teacher" || userData?.role === "admin";
  const tabs = isTeacher ? teacherTabs : parentTabs;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 pb-safe z-40">
      <div className="max-w-lg mx-auto flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);

          if (tab.isCenter) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex flex-col items-center -mt-5"
              >
                <div className={`w-14 h-14 ${isTeacher ? "bg-blue-500 shadow-blue-500/30" : "bg-green-500 shadow-green-500/30"} rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform`}>
                  {tab.icon(isActive)}
                </div>
                <span className={`text-xs mt-0.5 ${isTeacher ? "text-blue-600" : "text-green-600"} font-medium`}>
                  {tab.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center gap-0.5 py-1"
            >
              {tab.icon(isActive)}
              <span
                className={`text-xs ${
                  isActive ? "text-green-600 font-semibold" : "text-gray-400"
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
