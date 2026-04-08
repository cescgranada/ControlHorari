"use client";

import { useCallback, useEffect, useState } from "react";

type NotificationPermission = "default" | "granted" | "denied";

export function useNotifications() {
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported("Notification" in window);
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) return false;

    const result = await Notification.requestPermission();
    setPermission(result);
    return result === "granted";
  }, [isSupported]);

  const sendNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (!isSupported || permission !== "granted") return null;

      return new Notification(title, {
        icon: "/icons/icon-192x192.svg",
        badge: "/icons/icon-192x192.svg",
        ...options
      });
    },
    [isSupported, permission]
  );

  const scheduleReminder = useCallback(
    (hour: number, minute: number, message: string) => {
      if (!isSupported || permission !== "granted") return;

      const now = new Date();
      const targetTime = new Date();
      targetTime.setHours(hour, minute, 0, 0);

      if (targetTime <= now) {
        targetTime.setDate(targetTime.getDate() + 1);
      }

      const delay = targetTime.getTime() - now.getTime();

      setTimeout(() => {
        sendNotification("HorariCoop - Recordatori", {
          body: message,
          tag: "daily-reminder",
          requireInteraction: true
        });
      }, delay);
    },
    [isSupported, permission, sendNotification]
  );

  return {
    isSupported,
    permission,
    requestPermission,
    sendNotification,
    scheduleReminder
  };
}
