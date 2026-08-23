"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import SmartImage from "./SmartImage";

export default function ImageGallery({ images, alt }: { images: string[]; alt: string }) {
  const [index, setIndex] = useState(0);

  function prev() {
    setIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  }
  function next() {
    setIndex((i) => (i === images.length - 1 ? 0 : i + 1));
  }

  return (
    <div>
      <div className="relative aspect-[4/3] bg-gray-100 sm:rounded-2xl overflow-hidden">
        <SmartImage
          src={images[index]}
          alt={alt}
          fill
          sizes="(max-width: 640px) 100vw, 640px"
          className="object-cover"
        />

        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="وێنەی پێشوو"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 grid place-items-center rounded-full bg-white/90 shadow-card"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={next}
              aria-label="وێنەی داهاتوو"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 grid place-items-center rounded-full bg-white/90 shadow-card"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <span className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs font-semibold rounded-full px-2.5 py-1">
              {index + 1} / {images.length}
            </span>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 px-4 sm:px-0 mt-2 overflow-x-auto no-scrollbar">
          {images.map((img, i) => (
            <button
              key={img}
              onClick={() => setIndex(i)}
              className={`relative shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                i === index ? "border-brand-500" : "border-transparent"
              }`}
            >
              <SmartImage src={img} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
