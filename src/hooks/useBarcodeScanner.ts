"use client";

import { useState, useCallback, useRef, useEffect } from "react";

export function useBarcodeScanner() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<unknown>(null);

  const startScanning = useCallback(async (elementId: string) => {
    setError(null);
    setResult(null);

    try {
      // Dynamic import to avoid SSR issues
      const { Html5Qrcode } = await import("html5-qrcode");

      const scanner = new Html5Qrcode(elementId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
          aspectRatio: 1.777,
        },
        (decodedText) => {
          // ISBN (EAN-13) is 13 digits
          const cleaned = decodedText.replace(/[^0-9]/g, "");
          if (cleaned.length === 13 || cleaned.length === 10) {
            setResult(cleaned);
            scanner.stop().catch(() => {});
            setScanning(false);
          }
        },
        () => {
          // QR code scan failure - silent
        }
      );

      setScanning(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "카메라 접근 실패";
      if (message.includes("NotAllowedError") || message.includes("Permission")) {
        setError("카메라 권한을 허용해주세요.");
      } else {
        setError("카메라를 시작할 수 없습니다.");
      }
      setScanning(false);
    }
  }, []);

  const stopScanning = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await (scannerRef.current as { stop: () => Promise<void> }).stop();
      } catch {
        // ignore
      }
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        (scannerRef.current as { stop: () => Promise<void> }).stop().catch(() => {});
      }
    };
  }, []);

  return { scanning, result, error, startScanning, stopScanning, reset };
}
