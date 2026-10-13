import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";

const slides = [
  { src: "/jerseys/sunset-front.png", alt: "Orange and blue Mallorca cycling jersey, front view", label: "Sunset — Front" },
  { src: "/jerseys/sunset-back.png", alt: "Orange and blue Mallorca cycling jersey, back view", label: "Sunset — Back" },
  { src: "/jerseys/pink-front.png", alt: "Pink Mallorca cycling jersey, front view", label: "Pink — Front" },
  { src: "/jerseys/pink-back.png", alt: "Pink Mallorca cycling jersey, back view", label: "Pink — Back" },
  { src: "/jerseys/white-front.png", alt: "White Mallorca cycling jersey, front view", label: "White — Front" },
  { src: "/jerseys/white-back.png", alt: "White Mallorca cycling jersey, back view", label: "White — Back" },
];

export default function JerseySlideshow() {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [hovered, setHovered] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPlaying(!preference.matches);
    const onChange = () => { if (preference.matches) setPlaying(false); };
    preference.addEventListener("change", onChange);
    return () => preference.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!playing || hovered) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setIndex(current => (current + 1) % slides.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [playing, hovered]);

  function select(next: number) {
    setPlaying(false);
    setIndex((next + slides.length) % slides.length);
  }

  const control = "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2";

  return (
    <section
      aria-label="Jersey gallery"
      aria-roledescription="carousel"
      className="min-w-0 rounded-2xl border border-neutral-200 bg-neutral-50 p-3 sm:p-4 shadow-sm"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPlaying(false); }}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") { event.preventDefault(); select(index - 1); }
        if (event.key === "ArrowRight") { event.preventDefault(); select(index + 1); }
      }}
    >
      <div
        className="overflow-hidden rounded-xl bg-white"
        style={{ touchAction: "pan-y" }}
        onTouchStart={(event) => {
          const touch = event.touches[0];
          touchStart.current = { x: touch.clientX, y: touch.clientY };
        }}
        onTouchCancel={() => { touchStart.current = null; }}
        onTouchEnd={(event) => {
          const start = touchStart.current;
          touchStart.current = null;
          if (!start) return;
          const touch = event.changedTouches[0];
          const dx = touch.clientX - start.x;
          const dy = touch.clientY - start.y;
          if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) select(index + (dx < 0 ? 1 : -1));
        }}
      >
        <div role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${slides.length}: ${slides[index].label}`}>
          <img
            src={slides[index].src}
            alt={slides[index].alt}
            width={1024}
            height={1280}
            className="aspect-[4/5] w-full object-contain"
            decoding="async"
          />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <button type="button" className={control} aria-label="Previous jersey image" onClick={() => select(index - 1)}><ChevronLeft aria-hidden="true" className="h-5 w-5" /></button>
        <p className="text-center text-sm text-neutral-700" aria-live={playing ? "off" : "polite"} aria-atomic="true">
          <span className="block font-medium">{slides[index].label}</span>
          <span className="text-xs text-neutral-500">{index + 1} / {slides.length}</span>
        </p>
        <button type="button" className={control} aria-label="Next jersey image" onClick={() => select(index + 1)}><ChevronRight aria-hidden="true" className="h-5 w-5" /></button>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-center">
        {slides.map((slide, position) => (
          <button key={slide.src} type="button" onClick={() => select(position)}
            aria-label={`Show ${slide.label}`} aria-pressed={position === index}
            className="flex h-11 w-9 items-center justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600">
            <span aria-hidden="true" className={`h-2.5 rounded-full ${position === index ? "w-6 bg-red-600" : "w-2.5 bg-neutral-400"}`} />
          </button>
        ))}
        <button type="button" className={control} aria-label={playing ? "Pause slideshow" : "Play slideshow"} onClick={() => setPlaying(value => !value)}>
          {playing ? <Pause aria-hidden="true" className="h-4 w-4" /> : <Play aria-hidden="true" className="h-4 w-4" />}
        </button>
      </div>
    </section>
  );
}
