import React from "react";

export type ImageCarouselProps = {
  images?: string[];
};

export function ImageCarousel({ images }: ImageCarouselProps) {
  if (!images || images.length === 0) {
    return (
      <div className="w-full aspect-[16/9] bg-gray-200 grid place-items-center">
        <span>No images</span>
      </div>
    );
  }
  return (
    <div className="flex overflow-x-auto gap-2">
      {images.map((src, idx) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={idx} src={src} alt={`carousel-${idx}`} className="h-48 w-auto rounded" />
      ))}
    </div>
  );
}
