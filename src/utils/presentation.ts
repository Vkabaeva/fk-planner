import type { Category, Nomination } from '../domain/types'
import { todayISO, formatDate } from './dates.ts'

export const newId = () => crypto.randomUUID()
export const typeClass = (category: Category) => category === 'Текст' ? 'text-type' : category === 'Арт' ? 'art-type' : 'craft-type'

export function projectWord(count: number) {
  const lastTwoDigits = count % 100
  const lastDigit = count % 10
  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return 'проектов'
  if (lastDigit === 1) return 'проект'
  if (lastDigit >= 2 && lastDigit <= 4) return 'проекта'
  return 'проектов'
}

export function levelWord(count: number) {
  const lastTwoDigits = count % 100
  const lastDigit = count % 10
  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return 'левелов'
  if (lastDigit === 1) return 'левел'
  if (lastDigit >= 2 && lastDigit <= 4) return 'левела'
  return 'левелов'
}

export function nearestDeadline(nominations: Nomination[]) {
  const upcoming = nominations.map((item) => item.deadline).filter((date) => date && date >= todayISO()).sort()
  return upcoming.length ? formatDate(upcoming[0]) : 'Пока нет'
}
