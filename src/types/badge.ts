import { Timestamp } from "firebase/firestore";

export interface BadgeDefinition {
  type: string;
  threshold: number;
  label: string;
  imagePath: string;
  isKing: boolean;
  color: string;
}

export interface Badge {
  id: string;
  childId: string;
  kindergartenId: string;
  type: string;
  bookCount: number;
  earnedAt: Timestamp;
  celebrated: boolean;
}
