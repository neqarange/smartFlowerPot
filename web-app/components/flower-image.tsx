"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Sprout } from "lucide-react";

interface FlowerImageProps {
  alt: string;
  deviceId: string;
}

export function FlowerImage({ alt, deviceId }: FlowerImageProps) {
  const storageKey = `flower-image-${deviceId}`;
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setImageSrc(localStorage.getItem(storageKey));
  }, [storageKey]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setImageSrc(dataUrl);
      localStorage.setItem(storageKey, dataUrl);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div
      className="relative flex-shrink-0 group cursor-pointer"
      onClick={() => inputRef.current?.click()}
    >
      {imageSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={imageSrc}
          src={imageSrc}
          alt={alt}
          className="rounded-full object-cover w-16 h-16 sm:w-24 sm:h-24 ring-2 ring-[#F5A623] transition-transform duration-300 group-hover:scale-[1.03] animate-in fade-in zoom-in-95 duration-300"
        />
      ) : (
        <div className="rounded-full w-16 h-16 sm:w-24 sm:h-24 ring-2 ring-[#F5A623] bg-[#F5A623]/15 flex items-center justify-center text-[#F5A623] transition-transform duration-300 group-hover:scale-[1.03]">
          <Sprout className="size-8 sm:size-10" aria-hidden />
        </div>
      )}
      <div className="absolute inset-0 rounded-full bg-black/55 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <Camera className="w-5 h-5 text-white" />
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
