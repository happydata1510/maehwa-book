import { BadgeDefinition } from "@/types/badge";

export type { BadgeDefinition };

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  { type: "100", threshold: 100, label: "100권 달성!", imagePath: "/badges/badge-100.svg", isKing: false, color: "#CD7F32" },
  { type: "200", threshold: 200, label: "200권 달성!", imagePath: "/badges/badge-200.svg", isKing: false, color: "#C0C0C0" },
  { type: "300", threshold: 300, label: "300권 달성!", imagePath: "/badges/badge-300.svg", isKing: false, color: "#FFD700" },
  { type: "400", threshold: 400, label: "400권 달성!", imagePath: "/badges/badge-400.svg", isKing: false, color: "#50C878" },
  { type: "500", threshold: 500, label: "500권 달성!", imagePath: "/badges/badge-500.svg", isKing: false, color: "#4169E1" },
  { type: "600", threshold: 600, label: "600권 달성!", imagePath: "/badges/badge-600.svg", isKing: false, color: "#9B59B6" },
  { type: "700", threshold: 700, label: "700권 달성!", imagePath: "/badges/badge-700.svg", isKing: false, color: "#E74C3C" },
  { type: "800", threshold: 800, label: "800권 달성!", imagePath: "/badges/badge-800.svg", isKing: false, color: "#1ABC9C" },
  { type: "900", threshold: 900, label: "900권 달성!", imagePath: "/badges/badge-900.svg", isKing: false, color: "#F39C12" },
  { type: "king", threshold: 1000, label: "1000권 왕배지 달성!!", imagePath: "/badges/badge-king.svg", isKing: true, color: "#FF6B6B" },
];

export function checkNewBadges(previousCount: number, newCount: number): BadgeDefinition[] {
  return BADGE_DEFINITIONS.filter(
    (badge) => previousCount < badge.threshold && newCount >= badge.threshold
  );
}

export function getBadgeForCount(count: number): BadgeDefinition | null {
  const badge = BADGE_DEFINITIONS.find((b) => b.threshold === count);
  return badge ?? null;
}

export function getNextBadge(currentCount: number): BadgeDefinition | null {
  const next = BADGE_DEFINITIONS.find((b) => b.threshold > currentCount);
  return next ?? null;
}

export function getBooksUntilNextBadge(currentCount: number): number {
  const next = getNextBadge(currentCount);
  if (!next) return 0;
  return next.threshold - currentCount;
}
