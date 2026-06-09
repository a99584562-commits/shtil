import type { ReactNode } from 'react'
import { BackIcon } from './Icons'

export function TopBar({
  onBack,
  title,
  right,
}: {
  onBack: () => void
  title?: string
  right?: ReactNode
}) {
  return (
    <div className="pt-safe flex items-center justify-between px-5 pb-2">
      <button
        onClick={onBack}
        aria-label="Назад"
        className="grid h-10 w-10 place-items-center rounded-full text-foam/80 transition-all duration-500 ease-fluid hover:text-foam active:scale-95 glass"
      >
        <BackIcon />
      </button>
      {title ? (
        <span className="eyebrow text-foam/55">{title}</span>
      ) : (
        <span />
      )}
      <div className="flex h-10 min-w-10 items-center justify-end">{right}</div>
    </div>
  )
}
