import type { TimeOfDay } from '../types'

export function timeOfDay(date = new Date()): TimeOfDay {
  const h = date.getHours()
  if (h >= 5 && h < 11) return 'morning'
  if (h >= 11 && h < 17) return 'day'
  if (h >= 17 && h < 22) return 'evening'
  return 'night'
}

export function greeting(t: TimeOfDay): string {
  switch (t) {
    case 'morning':
      return 'Доброе утро'
    case 'day':
      return 'Добрый день'
    case 'evening':
      return 'Добрый вечер'
    case 'night':
      return 'Тихой ночи'
  }
}

export const TIME_LABEL: Record<TimeOfDay, string> = {
  morning: 'Утро',
  day: 'День',
  evening: 'Вечер',
  night: 'Ночь',
}

/** A short, calm line under the greeting. */
export function subline(t: TimeOfDay): string {
  switch (t) {
    case 'morning':
      return 'Начни день с ясности, а не с ленты.'
    case 'day':
      return 'Минута тишины посреди дел сбивает расфокус.'
    case 'evening':
      return 'Пора замедлиться и отпустить день.'
    case 'night':
      return 'Дай телу и уму перейти в покой.'
  }
}

/**
 * Background palette per time of day — the horizon shifts with real time:
 * warm dawn, luminous midday water, dusky evening, deep night.
 * Stored as CSS colour stops used by the animated mesh background.
 */
export interface Palette {
  base: string
  glowA: string
  glowB: string
  horizon: string
}

export const PALETTES: Record<TimeOfDay, Palette> = {
  morning: {
    base: '#0a2e35',
    glowA: 'rgba(244, 184, 143, 0.30)',
    glowB: 'rgba(95, 214, 208, 0.28)',
    horizon: 'rgba(244, 200, 160, 0.16)',
  },
  day: {
    base: '#073744',
    glowA: 'rgba(143, 199, 224, 0.30)',
    glowB: 'rgba(95, 214, 208, 0.32)',
    horizon: 'rgba(143, 199, 224, 0.14)',
  },
  evening: {
    base: '#08222e',
    glowA: 'rgba(120, 110, 200, 0.26)',
    glowB: 'rgba(95, 214, 208, 0.20)',
    horizon: 'rgba(150, 130, 200, 0.14)',
  },
  night: {
    base: '#051820',
    glowA: 'rgba(70, 90, 150, 0.24)',
    glowB: 'rgba(60, 150, 150, 0.18)',
    horizon: 'rgba(90, 110, 160, 0.10)',
  },
}
