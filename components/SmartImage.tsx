"use client";

import Image, { ImageProps } from "next/image";

/**
 * Renders next/image for remote (http/https) sources so they stay optimized,
 * and falls back to a plain <img> for locally-uploaded photos (data: URLs),
 * which next/image's optimizer doesn't accept as a remote source.
 */
export default function SmartImage({ src, alt, className, fill, sizes }: Pick<
  ImageProps,
  "src" | "alt" | "className" | "fill" | "sizes"
>) {
  const isLocal = typeof src === "string" && src.startsWith("data:");

  if (isLocal) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src as string}
        alt={alt}
        className={`${className ?? ""} ${fill ? "absolute inset-0 w-full h-full" : ""}`}
      />
    );
  }

  return <Image src={src} alt={alt} className={className} fill={fill} sizes={sizes} />;
}
