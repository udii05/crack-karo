export default function BrandMark({
  className = "h-9 w-9",
}: {
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`inline-grid shrink-0 place-items-center rounded-[22%] bg-gradient-to-br from-[#3978e8] to-[#245fc9] ${className}`}
    >
      <svg
        viewBox="0 0 64 64"
        className="h-[74%] w-[74%]"
        fill="none"
        aria-hidden="true"
      >
        <rect x="12" y="22" width="40" height="30" rx="5" fill="#ffffff" />
        <path
          d="M24 22v-4a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v4"
          stroke="#ffffff"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M24 37l6 6 11-13"
          stroke="#3978e8"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
