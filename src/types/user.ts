import { Timestamp } from "firebase/firestore";

export type UserRole = "admin" | "teacher" | "parent";

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  kindergartenId: string;
  linkedChildIds: string[];
  createdAt: Timestamp;
}

export interface Kindergarten {
  id: string;
  name: string;
  address: string;
  adminUserIds: string[];
  createdAt: Timestamp;
}

export interface Class {
  id: string;
  name: string;
  kindergartenId: string;
  teacherId: string;
  ageGroup: number;
  createdAt: Timestamp;
}
