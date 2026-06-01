import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import type { GraduateCohortImage } from "../lib/apiTypes";
import { graduateImageOriginalUrl, graduateImageWebpUrl } from "../lib/graduateImages";
import "./LightboxGallery.css";

type Props = {
  open: boolean;
  onClose: () => void;
  images: GraduateCohortImage[];
  startIndex: number;
};

function clampStartIndex(start: number, len: number): number {
  if (len <= 0) return 0;
  return Math.min(Math.max(start, 0), len - 1);
}

export function LightboxGallery({ open, onClose, images, startIndex }: Props) {
  const [index, setIndex] = useState(() => clampStartIndex(startIndex, images.length));
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const goNext = useCallback(() => {
    setIndex((i) => (images.length ? (i + 1) % images.length : 0));
  }, [images.length]);

  const goPrev = useCallback(() => {
    setIndex((i) => (images.length ? (i - 1 + images.length) % images.length : 0));
  }, [images.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, goNext, goPrev]);

  if (!open) return null;

  const current = images[index];
  if (!current?.url) return null;

  const original = graduateImageOriginalUrl(current.url);
  const webp = graduateImageWebpUrl(current.url);
  const alt =
    (current.caption != null && String(current.caption).trim()) ||
    `Фото випуску – ${current.specialty ?? ""}`;

  const onTouchStart = (e: React.TouchEvent) => {
    if (!e.changedTouches.length) return;
    touchStartX.current = e.changedTouches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartX.current;
    touchStartX.current = null;
    if (start == null || !e.changedTouches.length) return;
    const endX = e.changedTouches[0].clientX;
    const dx = endX - start;
    const threshold = 50;
    if (dx > threshold) goPrev();
    else if (dx < -threshold) goNext();
  };

  return createPortal(
    <div
      className="lightbox-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Галерея фото"
      onClick={(ev) => {
        if (ev.target === ev.currentTarget) onClose();
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="lightbox-content">
        <button type="button" className="lightbox-close" onClick={onClose} aria-label="Закрити">
          ×
        </button>

        <button type="button" className="lightbox-nav lightbox-nav--prev" onClick={goPrev} aria-label="Попереднє фото">
          ‹
        </button>

        <div className="lightbox-image-wrapper">
          <picture>
            <source srcSet={webp} type="image/webp" />
            <img src={original} alt={alt} className="lightbox-image" />
          </picture>

          {current.caption != null && String(current.caption).trim() ? (
            <div className="lightbox-caption">{current.caption}</div>
          ) : null}
        </div>

        <button type="button" className="lightbox-nav lightbox-nav--next" onClick={goNext} aria-label="Наступне фото">
          ›
        </button>
      </div>
    </div>,
    document.body,
  );
}
