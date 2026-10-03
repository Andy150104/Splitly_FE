export default function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="splitly-brand" aria-hidden="true">
      <svg viewBox="0 0 32 32" fill="none">
        <path
          d="M26 5H14a9 9 0 0 0 0 18h4"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M6 27h12a9 9 0 0 0 0-18h-4"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          opacity=".5"
        />
      </svg>
      {!compact && (
        <span className="splitly-brand-name">
          Splitly<span className="splitly-brand-period">.</span>
        </span>
      )}
    </span>
  )
}
