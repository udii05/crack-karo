import Link from "next/link";
import { ArrowRight } from "lucide-react";
import LandingFooter from "@/components/landing/LandingFooter";
import LandingHeader from "@/components/landing/LandingHeader";

type InfoPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
};

export default function InfoPage({
  eyebrow,
  title,
  description,
  children,
}: InfoPageProps) {
  return (
    <div className="min-h-screen bg-[#f6f8fc] text-ink-900">
      <LandingHeader />
      <main className="mx-auto max-w-3xl px-5 py-16 sm:px-6 sm:py-24">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">
          {eyebrow}
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-[-1.4px] text-[#172b49] sm:text-5xl">
          {title}
        </h1>
        <p className="mt-5 text-base leading-relaxed text-[#667a98]">{description}</p>
        <div className="mt-10 space-y-5 text-sm leading-relaxed text-[#5f7391]">
          {children}
        </div>
        <Link href="/register" className="btn-primary mt-10 inline-flex px-5 py-3">
          Start practising free
          <ArrowRight className="h-4 w-4" />
        </Link>
      </main>
      <LandingFooter />
    </div>
  );
}
