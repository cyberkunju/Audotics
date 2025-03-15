'use client';

import React, { useState } from 'react';
import Image, { ImageProps } from 'next/image';

// Base64 encoded simple gray placeholder image (1x1 px)
const PLACEHOLDER_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

// Type guard for string sources
const isStringSource = (src: any): src is string => {
  return typeof src === 'string';
};

// Check if URL is external (from different domain)
const isExternalUrl = (url: string): boolean => {
  if (!url) return false;
  return url.startsWith('http') || url.startsWith('https');
};

type ImageWithFallbackProps = ImageProps & {
  fallbackSrc?: string;
};

export default function ImageWithFallback({
  src,
  alt,
  fallbackSrc = PLACEHOLDER_IMAGE,
  ...props
}: ImageWithFallbackProps) {
  // Initialize with fallback if src is null or undefined
  const [imgSrc, setImgSrc] = useState(src || fallbackSrc);
  const [error, setError] = useState(false);
  
  // Handle null or undefined src values at runtime
  if (!src || error) {
    return (
      <Image
        {...props}
        src={fallbackSrc}
        alt={alt || "Image placeholder"}
        unoptimized={true} // Always unoptimize fallback images
      />
    );
  }

  // Determine if we should use unoptimized mode
  const shouldUnoptimize = 
    (isStringSource(imgSrc) && imgSrc.startsWith('data:')) || // Data URLs
    (isStringSource(imgSrc) && isExternalUrl(imgSrc));        // External URLs

  return (
    <Image
      {...props}
      src={imgSrc}
      alt={alt || "Image"}
      unoptimized={shouldUnoptimize}
      onError={() => {
        console.warn(`Failed to load image: ${String(imgSrc)}`);
        setImgSrc(fallbackSrc);
        setError(true);
      }}
    />
  );
} 