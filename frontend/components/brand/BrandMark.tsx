export default function BrandMark({
  className = "h-9 w-9",
}: {
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`inline-grid shrink-0 place-items-center rounded-[22%] bg-gradient-to-br from-[#3B82F6] to-[#4F46E5] ${className}`}
    >
      <svg
        viewBox="0 0 64 64"
        className="h-[60%] w-[60%]"
        fill="none"
        aria-hidden="true"
      >
        <rect x="14" y="24" width="36" height="26" rx="5" fill="#ffffff" />
        <path
          d="M24 24v-4a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v4"
          stroke="#ffffff"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M24 38l6 6 11-13"
          stroke="#4F46E5"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
