"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import BrandMark from "@/components/brand/BrandMark";

export default function LandingHeader() {
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    lastScrollY.current = window.scrollY;
    let frame = 0;

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const currentY = window.scrollY;
        const delta = currentY - lastScrollY.current;

        if (currentY <= 24) {
          setHidden(false);
        } else if (delta > 6) {
          setHidden(true);
        } else if (delta < -6) {
          setHidden(false);
        }

        lastScrollY.current = currentY;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur-[12px] transition-transform duration-300 ease-out will-change-transform motion-reduce:transition-none ${
        hidden ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <BrandMark className="h-[36px] w-[36px]" />
          <span>
            <span className="block text-[26px] font-bold leading-[36px] tracking-[-0.5px]">
              Crack <span className="text-brand-600">Karo</span>
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-medium text-[#65748a] md:flex">
          <Link href="/#features" className="hover:text-brand-600">
            Features
          </Link>
          <Link href="/#how-it-works" className="hover:text-brand-600">
            How it works
          </Link>
          <Link href="/#preview" className="hover:text-brand-600">
            Product
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/login" className="btn-ghost btn-sm">
            Log in
          </Link>
          <Link href="/register" className="btn-primary btn-sm">
            Get started
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
