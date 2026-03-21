import { Timestamp } from "firebase/firestore";

export interface Message {
  id: string;
  fromUserId: string;
  fromName: string;
  toChildId: string;        // 어떤 아이에 대한 메시지인지
  kindergartenId: string;
  content: string;
  read: boolean;
  createdAt: Timestamp;
}
