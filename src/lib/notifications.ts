// PWA 푸시 알림 유틸리티
// Firebase 연동 전: 브라우저 Notification API 사용
// Firebase 연동 후: FCM(Firebase Cloud Messaging)으로 교체 가능

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }

  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;

  const result = await Notification.requestPermission();
  return result === "granted";
}

export function sendBadgeNotification(
  childName: string,
  badgeType: string,
  threshold: number
) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const isKing = badgeType === "king";
  const title = isKing
    ? `🎉 ${childName} 왕배지 달성!`
    : `🏅 ${childName} ${threshold}권 뱃지 달성!`;
  const body = isKing
    ? `${childName} 어린이가 1000권을 달성했습니다! 정말 대단해요!`
    : `${childName} 어린이가 ${threshold}권을 읽었습니다! 축하해주세요!`;

  try {
    new Notification(title, {
      body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-96.png",
      tag: `badge-${childName}-${threshold}`,
      vibrate: [200, 100, 200],
    });
  } catch {
    // 서비스 워커 환경에서는 self.registration.showNotification 사용
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, {
          body,
          icon: "/icons/icon-192.png",
          badge: "/icons/icon-96.png",
          tag: `badge-${childName}-${threshold}`,
        });
      });
    }
  }
}
