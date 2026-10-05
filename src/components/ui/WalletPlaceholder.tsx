import { useId } from 'react'

/** Lightweight product artwork shared by the loading and WebGL fallback states. */
export default function WalletPlaceholder({ ready = false }: { ready?: boolean }) {
  const id = useId().replace(/:/g, '')
  return (
    <div className="wallet-placeholder" data-state={ready ? 'ready' : 'loading'} aria-hidden="true">
      <svg className="wallet-placeholder-art" viewBox="0 0 500 500" fill="none">
        <defs>
          <linearGradient
            id={`${id}-leather`}
            x1="120"
            y1="180"
            x2="400"
            y2="420"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#8265af" />
            <stop offset="0.5" stopColor="#5f4782" />
            <stop offset="1" stopColor="#39294f" />
          </linearGradient>
          <linearGradient id={`${id}-silver`} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#eee5fa" />
            <stop offset="0.48" stopColor="#a99abf" />
            <stop offset="1" stopColor="#514360" />
          </linearGradient>
        </defs>
        <g transform="rotate(-10 250 250)">
          <rect x="105" y="108" width="252" height="226" rx="16" fill="#282033" stroke="#74618f" />
          <rect x="95" y="97" width="252" height="226" rx="16" fill="#ded3ee" stroke="#eae2f3" />
          <text
            x="120"
            y="154"
            fill="#483751"
            fontFamily="Be Vietnam Pro, sans-serif"
            fontSize="30"
            fontWeight="600"
          >
            Splitly
          </text>
          <rect x="301" y="120" width="26" height="20" rx="4" fill={`url(#${id}-silver)`} />
          <path d="M120 181H315M120 193H225" stroke="#b2a2c7" strokeWidth="2" />
          <g transform="rotate(27 347 244)">
            <path
              d="M323 106H405V289L400 294L395 289L390 294L385 289L380 294L375 289L370 294L365 289L360 294L355 289L350 294L345 289L340 294L335 289L330 294L323 289V106Z"
              fill="#eee9f0"
            />
            <path
              d="M337 126H390M337 149H382M337 172H390M337 195H369"
              stroke="#b5a9bf"
              strokeWidth="3"
            />
          </g>
          <rect
            x="101"
            y="208"
            width="283"
            height="197"
            rx="23"
            fill="#23192f"
            stroke="#77618f"
            strokeWidth="2"
          />
          <rect
            x="94"
            y="198"
            width="283"
            height="197"
            rx="23"
            fill={`url(#${id}-leather)`}
            stroke="#b297d1"
            strokeWidth="2"
          />
          <rect
            x="107"
            y="211"
            width="256"
            height="170"
            rx="16"
            stroke="#ba9ed3"
            strokeOpacity="0.6"
            strokeDasharray="3 4"
          />
          <text
            x="122"
            y="277"
            fill="#efe5fa"
            fontFamily="Be Vietnam Pro, sans-serif"
            fontSize="36"
            fontWeight="600"
          >
            Splitly
          </text>
          <path d="M122 352H190" stroke="#c9b1e4" strokeWidth="3" strokeLinecap="round" />
          <rect
            x="329"
            y="265"
            width="63"
            height="39"
            rx="9"
            fill="#322343"
            stroke="#957bb6"
            strokeWidth="2"
          />
          <circle cx="349" cy="284" r="7" fill={`url(#${id}-silver)`} />
        </g>
        <g transform="translate(397 372)">
          <circle r="36" fill="#423052" stroke={`url(#${id}-silver)`} strokeWidth="5" />
          <circle r="29" stroke="#a797b8" />
          <path
            d="M10 -17C-3 -27 -21 -15 -10 -3C-5 2 5 -2 9 4C20 19 1 28 -11 16"
            stroke="#dfd2ef"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </g>
        <circle
          cx="87"
          cy="167"
          r="20"
          fill="#382945"
          stroke={`url(#${id}-silver)`}
          strokeWidth="4"
        />
        <path
          d="M93 157C83 151 74 159 82 167C86 171 93 166 95 173C98 181 87 185 81 178"
          stroke="#ded1ee"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}
