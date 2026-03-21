"use client";

import { useAuth } from "@/contexts/AuthContext";

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
}

export default function Header({ title, showBack = false, onBack }: HeaderProps) {
  const { userData } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-lg mx-auto flex items-center h-14 px-4">
        {showBack && (
          <button
            onClick={onBack || (() => window.history.back())}
            className="mr-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <h1 className="text-lg font-bold text-gray-900 flex-1">
          {title || "매화유치원 책대장"}
        </h1>
        {userData && (
          <span className="text-sm text-gray-500">
            {userData.displayName}
          </span>
        )}
      </div>
    </header>
  );
}
