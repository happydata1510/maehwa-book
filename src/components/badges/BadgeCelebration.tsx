"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";
import { BadgeDefinition } from "@/lib/badge-rules";
import Button from "@/components/ui/Button";

interface BadgeCelebrationProps {
  badges: BadgeDefinition[];
  onClose: () => void;
}

export default function BadgeCelebration({ badges, onClose }: BadgeCelebrationProps) {
  const isKing = badges.some((b) => b.isKing);
  const mainBadge = badges[badges.length - 1];

  useEffect(() => {
    if (isKing) {
      // 왕배지: 화려한 축하
      const duration = 5000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ["#FFD700", "#FF6B6B", "#4169E1", "#50C878"],
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ["#FFD700", "#FF6B6B", "#4169E1", "#50C878"],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();

      // 추가 별 효과
      setTimeout(() => {
        confetti({
          particleCount: 150,
          spread: 100,
          origin: { y: 0.6 },
          colors: ["#FFD700", "#FFA500"],
          shapes: ["star"],
          scalar: 1.5,
        });
      }, 500);
    } else {
      // 일반 뱃지: 심플한 축하
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: [mainBadge.color, "#FFD700", "#4169E1"],
      });
    }
  }, [isKing, mainBadge]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center">
        {/* 뱃지 아이콘 */}
        <div
          className={`w-28 h-28 mx-auto rounded-full flex items-center justify-center mb-4 ${
            isKing
              ? "bg-gradient-to-b from-yellow-300 to-yellow-500 shadow-lg shadow-yellow-300/50 animate-pulse"
              : "bg-gradient-to-b from-yellow-100 to-yellow-200"
          }`}
        >
          <span className={isKing ? "text-6xl" : "text-5xl"}>
            {isKing ? "👑" : "🏅"}
          </span>
        </div>

        {/* 축하 메시지 */}
        <h2
          className={`font-bold mb-2 ${
            isKing ? "text-2xl text-yellow-600" : "text-xl text-gray-900"
          }`}
        >
          {isKing ? "축하합니다!!" : "축하해요!"}
        </h2>

        <div className="space-y-1 mb-6">
          {badges.map((badge) => (
            <p
              key={badge.type}
              className="text-lg font-semibold"
              style={{ color: badge.color }}
            >
              {badge.label}
            </p>
          ))}
        </div>

        {isKing && (
          <p className="text-sm text-gray-600 mb-6">
            1000권 독서를 달성하여 왕배지를 획득했어요!
            <br />
            정말 대단해요! 🎉
          </p>
        )}

        <Button onClick={onClose} fullWidth size="lg" variant={isKing ? "secondary" : "primary"}>
          {isKing ? "🎉 감사합니다!" : "확인"}
        </Button>
      </div>
    </div>
  );
}
