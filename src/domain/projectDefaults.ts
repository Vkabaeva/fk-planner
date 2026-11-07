import { APP_CONFIG } from '../config/appConfig.ts'
import type { Category } from './types'
import { addDays } from '../utils/dates.ts'

const LEVEL_CATEGORY_RULES: { keywords: string[]; category: Category }[] = [
  { keywords: ['неформат'], category: 'Крафт' },
  { keywords: ['визуал', 'иллюстрац'], category: 'Арт' },
]

const LEVEL_WORD_TARGETS = [
  { keywords: ['миди'], words: 5000 },
  { keywords: ['макси'], words: 16000 },
  { keywords: ['текст', 'миббл'], words: 1000 },
] as const

function normalizeLevelName(name: string) {
  return name.toLocaleLowerCase('ru-RU').replace(/[‐‑‒–—−]/g, '-')
}

export function getLevelDefaults(name: string) {
  const normalized = normalizeLevelName(name)
  const ratingCode = normalized.replace(/[мm]/g, 'm').replace(/[еe]/g, 'e')
  const category = LEVEL_CATEGORY_RULES.find((rule) => rule.keywords.some((word) => normalized.includes(word)))?.category ?? 'Текст'
  const rating = ratingCode.includes('g-t') ? 'G' : ratingCode.includes('m-e') ? 'R' : ''
  const targetWords = LEVEL_WORD_TARGETS.find((rule) => rule.keywords.some((word) => normalized.includes(word)))?.words ?? 5000
  return { category, rating, targetWords }
}

export function defaultSoftDeadline(hardDeadline: string) {
  return hardDeadline ? addDays(hardDeadline, -APP_CONFIG.planning.softDeadlineBufferDays) : ''
}
