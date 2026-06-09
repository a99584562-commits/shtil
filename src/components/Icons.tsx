// Ultra-light line icons (1.4 stroke), drawn inline — no icon library.
import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement>

function Svg({ children, ...p }: P & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      width={22}
      height={22}
      {...p}
    >
      {children}
    </svg>
  )
}

export const WaveIcon = (p: P) => (
  <Svg {...p}>
    <path d="M2 9c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2" />
    <path d="M2 15c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2" />
  </Svg>
)

export const SunIcon = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" />
  </Svg>
)

export const MoonIcon = (p: P) => (
  <Svg {...p}>
    <path d="M20 14.5A8 8 0 0 1 9.5 4 7 7 0 1 0 20 14.5Z" />
  </Svg>
)

export const SproutIcon = (p: P) => (
  <Svg {...p}>
    <path d="M12 20v-7" />
    <path d="M12 13c0-3-2.5-4.5-5-4.5C7 12 9.5 13 12 13Z" />
    <path d="M12 11c0-2.5 2-4 4.5-4C16.5 10.5 14.5 11 12 11Z" />
  </Svg>
)

export const CircleIcon = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8" />
  </Svg>
)

export const BellIcon = (p: P) => (
  <Svg {...p}>
    <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" />
    <path d="M10.5 19a1.5 1.5 0 0 0 3 0" />
  </Svg>
)

export const HandIcon = (p: P) => (
  <Svg {...p}>
    <path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V11M12 11V4.5a1.5 1.5 0 0 1 3 0V11M15 11V6.5a1.5 1.5 0 0 1 3 0V13c0 3.9-2.7 7-6.5 7S6 17.5 6 14.5V12a1.5 1.5 0 0 1 3-1Z" />
  </Svg>
)

export const PlayIcon = (p: P) => (
  <Svg {...p}>
    <path d="M8 5.5v13l11-6.5L8 5.5Z" />
  </Svg>
)

export const PauseIcon = (p: P) => (
  <Svg {...p}>
    <path d="M9 5v14M15 5v14" />
  </Svg>
)

export const StopIcon = (p: P) => (
  <Svg {...p}>
    <rect x="6.5" y="6.5" width="11" height="11" rx="2.5" />
  </Svg>
)

export const BackIcon = (p: P) => (
  <Svg {...p}>
    <path d="M15 5l-7 7 7 7" />
  </Svg>
)

export const CheckIcon = (p: P) => (
  <Svg {...p}>
    <path d="M5 12.5 10 17.5 19.5 7" />
  </Svg>
)

export const FlameIcon = (p: P) => (
  <Svg {...p}>
    <path d="M12 3c1 3-1.5 4-1.5 6.5A1.5 1.5 0 0 0 13 9c2 2 3 3.6 3 6a4 4 0 1 1-8 0c0-2 1-3.5 2-4.5.4 2 2 2 2 2 .5-3-2-4 0-9.5Z" />
  </Svg>
)

export const JournalIcon = (p: P) => (
  <Svg {...p}>
    <path d="M6 4h11a1 1 0 0 1 1 1v15l-2-1.4L14 20l-2-1.4L10 20l-2-1.4L6 20V4Z" />
    <path d="M9 8h6M9 11.5h6" />
  </Svg>
)

export const InfoIcon = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </Svg>
)

export const SettingsIcon = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v3M12 19v3M4.2 6l2.1 1.2M17.7 16.8l2.1 1.2M2 12h3M19 12h3M4.2 18l2.1-1.2M17.7 7.2l2.1-1.2" />
  </Svg>
)
