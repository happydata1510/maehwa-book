"use client";

import { useEffect } from "react";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import Button from "@/components/ui/Button";

interface BarcodeScannerProps {
  onDetected: (isbn: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onDetected, onClose }: BarcodeScannerProps) {
  const { scanning, result, error, startScanning, stopScanning } = useBarcodeScanner();

  useEffect(() => {
    startScanning("barcode-reader");
    return () => {
      stopScanning();
    };
  }, [startScanning, stopScanning]);

  useEffect(() => {
    if (result) {
      onDetected(result);
    }
  }, [result, onDetected]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 bg-black/80 text-white">
        <h2 className="font-bold">바코드 스캔</h2>
        <button
          onClick={() => {
            stopScanning();
            onClose();
          }}
          className="p-2 rounded-lg hover:bg-white/10"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 카메라 뷰 */}
      <div className="flex-1 relative">
        <div id="barcode-reader" className="w-full h-full" />

        {/* 안내 오버레이 */}
        <div className="absolute bottom-8 left-0 right-0 text-center">
          <p className="text-white text-sm bg-black/60 px-4 py-2 rounded-full inline-block">
            {scanning
              ? "책 뒷면의 바코드를 비춰주세요"
              : "카메라 준비 중..."}
          </p>
        </div>
      </div>

      {/* 에러 */}
      {error && (
        <div className="p-4 bg-black/80">
          <p className="text-red-400 text-center text-sm mb-3">{error}</p>
          <Button
            variant="outline"
            fullWidth
            onClick={onClose}
            className="text-white border-white"
          >
            닫기
          </Button>
        </div>
      )}
    </div>
  );
}
