type SweepLogoProps = {
  className?: string;
  showWordmark?: boolean;
};

export function SweepLogo({ className = 'h-8 w-8', showWordmark = false }: SweepLogoProps) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-hidden
      >
        <circle cx="16" cy="16" r="15" className="fill-[var(--v-fg)]" />
        <path
          d="M16 6.5v5.25M16 20.25V25.5M6.5 16h5.25M20.25 16H25.5"
          className="stroke-[var(--v-bg)]"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          d="M10.2 10.2l3.7 3.7M18.1 18.1l3.7 3.7M21.8 10.2l-3.7 3.7M14.9 18.1l-3.7 3.7"
          className="stroke-[var(--v-bg)]"
          strokeWidth="1.85"
          strokeLinecap="round"
          opacity="0.72"
        />
        <circle cx="16" cy="16" r="2.35" className="fill-[var(--v-bg)]" />
      </svg>
      {showWordmark && <span className="font-pixel truncate text-base tracking-normal text-[var(--v-fg)]">Sweep</span>}
    </span>
  );
}