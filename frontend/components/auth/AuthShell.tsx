import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import BrandMark from "@/components/brand/BrandMark";

export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f6f8fc] lg:grid lg:grid-cols-2">
      <section className="relative hidden overflow-hidden border-r border-line bg-[linear-gradient(135deg,#edf4ff_0%,#f8faff_65%,#f0f6ff_100%)] p-12 lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-[360px] w-[360px] rounded-full border border-[#dbe8fb] shadow-[0_0_0_45px_rgba(255,255,255,0.3),0_0_0_100px_rgba(255,255,255,0.18)]"
        />
        <Link href="/" className="relative flex items-center gap-2.5">
          <BrandMark className="h-[38px] w-[38px]" />
          <span>
            <span className="block text-[15px] font-bold leading-none tracking-[-0.3px] text-ink-900">
              Crack <span className="text-brand-600">Karo</span>
            </span>
          </span>
        </Link>

        <div className="relative max-w-md">
          <div className="text-[11px] font-bold uppercase tracking-[1.8px] text-brand-600">
            AI interview preparation
          </div>
          <h1 className="mt-3 text-[38px] font-bold leading-[1.1] tracking-[-1.4px] text-[#172b49]">
            A calmer, more structured way to prepare.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-[#667a98]">
            Practice out loud, see exactly how your answers score, and follow a coaching
            plan built from your real interview data.
          </p>
          <ul className="mt-6 space-y-3">
            {[
              "Voice-first mock interviews",
              "Dimension-level answer scoring",
              "Personalised AI coaching and analytics",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-sm text-[#5d708c]">
                <CheckCircle2 className="h-4 w-4 text-[#16856b]" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-[#8b98aa]">
          Structured practice for calmer, stronger interviews.
        </p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-10">
        <div className="w-full max-w-[420px]">
          <Link href="/" className="mb-6 flex items-center justify-center gap-2.5 lg:hidden">
            <BrandMark className="h-[34px] w-[34px]" />
            <span className="text-sm font-bold text-ink-900">
              Crack <span className="text-brand-600">Karo</span>
            </span>
          </Link>

          <div className="card p-6 sm:p-7">
            <h2 className="text-2xl font-bold tracking-[-0.6px] text-ink-900">{title}</h2>
            <p className="mt-1.5 text-sm text-[#7e8da2]">{subtitle}</p>
            <div className="mt-6">{children}</div>
          </div>

          <div className="mt-4 text-center text-sm text-[#7e8da2]">{footer}</div>
        </div>
      </section>
    </div>
  );
}


