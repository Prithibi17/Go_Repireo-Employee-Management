'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface QRCodeImageProps {
  url: string;
  size?: number;
  className?: string;
}

export function QRCodeImage({ url, size = 160, className = '' }: QRCodeImageProps) {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    QRCode.toDataURL(url, {
      width: size,
      margin: 1,
      color: {
        dark: '#0f172a', // slate-900
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    }).then(setDataUrl).catch(console.error);
  }, [url, size]);

  if (!dataUrl) {
    return (
      <div 
        style={{ width: size, height: size }} 
        className={`bg-slate-100 animate-pulse rounded border border-slate-200 flex items-center justify-center text-[10px] text-slate-400 ${className}`}
      >
        QR Code
      </div>
    );
  }

  return (
    <img
      src={dataUrl}
      alt="Verification QR Code"
      width={size}
      height={size}
      className={`rounded ${className}`}
    />
  );
}
