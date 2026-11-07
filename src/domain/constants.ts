import type { Category, Store } from './types'

export const STORAGE_KEY = 'fk-planner-v1'

export const workflows: Record<Category, string[]> = {
  Текст: ['Идея', 'Сюжет', 'План', 'Слова', 'Шапка'],
  Арт: ['Идея', 'Эскиз', 'Набросок', 'Наполнение', 'Шапка'],
  Крафт: ['Идея', 'Эскиз', 'Крафт', 'Фото', 'Шапка'],
}

export const categories: Category[] = ['Текст', 'Арт', 'Крафт']

export const nominationTemplates = {
  winter: { title: 'Зима', names: ['Визитка', 'Тексты G-T', 'Визуал G-T', 'Неформат', 'Тексты М-Е', 'Визуал М-Е', 'Спецквест'] },
  summer: { title: 'Лето', names: ['Визитка', 'Мибблы G-T', 'Визуал G-T', 'Миди G-T', 'Неформат', 'ББ: макси', 'ББ: иллюстрации', 'Мибблы М-Е', 'Визуал М-Е', 'Миди М-Е', 'Спецквест'] },
} as const

export const blankStore: Store = { seasons: [], projects: [] }
