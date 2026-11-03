import Link from "next/link";
import BrandMark from "@/components/brand/BrandMark";

const footerColumns = [
  {
    title: "Product",
    links: [
      { label: "How it works", href: "/#how-it-works" },
      { label: "Integrations", href: "/integrations" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Log in", href: "/login" },
      { label: "Sign up", href: "/register" },
    ],
  },
];

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="currentColor">
      <path d="M12 .5C5.73.5.75 5.48.75 11.75c0 5.02 3.26 9.27 7.78 10.77.57.1.78-.25.78-.55 0-.27-.01-1.16-.02-2.1-3.16.69-3.83-1.34-3.83-1.34-.52-1.31-1.26-1.66-1.26-1.66-1.03-.7.08-.69.08-.69 1.14.08 1.74 1.17 1.74 1.17 1.01 1.73 2.65 1.23 3.3.94.1-.73.4-1.23.72-1.51-2.52-.29-5.17-1.26-5.17-5.61 0-1.24.44-2.25 1.17-3.04-.12-.29-.51-1.44.11-3.01 0 0 .96-.31 3.14 1.16a10.9 10.9 0 0 1 5.72 0c2.18-1.47 3.14-1.16 3.14-1.16.62 1.57.23 2.72.11 3.01.73.79 1.17 1.8 1.17 3.04 0 4.36-2.65 5.32-5.18 5.6.41.35.77 1.04.77 2.1 0 1.52-.01 2.74-.01 3.11 0 .3.2.66.79.55a11.25 11.25 0 0 0 7.77-10.77C23.25 5.48 18.27.5 12 .5Z" />
    </svg>
  );
}

function LinkedinIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="currentColor">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45Z" />
    </svg>
  );
}

export default function LandingFooter() {
  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_2.9fr]">
          <div className="max-w-sm">
            <Link href="/" className="flex items-center gap-2.5">
              <BrandMark className="h-[38px] w-[38px]" />
              <span className="text-[26px] font-bold leading-[38px] tracking-[-0.5px] text-ink-900">
                Crack <span className="text-brand-600">Karo</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[#667a98]">
              Make your next interview your best one yet with smarter AI-powered practice.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4">
            {footerColumns.map((column) => (
              <div key={column.title}>
                <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8b98aa]">
                  {column.title}
                </h2>
                <ul className="mt-4 space-y-3">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-[#5f7391] transition-colors hover:text-brand-600"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[#8b98aa]">© 2026 Crack Karo</p>
          <div className="flex items-center gap-2">
            <a
              href="#"
              aria-label="GitHub"
              title="GitHub"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-[#65748a] transition-colors hover:border-brand-200 hover:text-brand-600"
            >
              <GithubIcon />
            </a>
            <a
              href="#"
              aria-label="LinkedIn"
              title="LinkedIn"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-[#65748a] transition-colors hover:border-brand-200 hover:text-brand-600"
            >
              <LinkedinIcon />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
