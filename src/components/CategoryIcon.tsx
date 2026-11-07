import type { Category } from '../domain/types'

export default function CategoryIcon({ category }: { category: Category }) {
  if (category === 'Арт') return <svg className="category-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m14.7 3.5 5.8 5.8L9.8 20H4v-5.8L14.7 3.5Z" /><path d="m12.8 5.4 5.8 5.8M4 14.2l5.8 5.8M4 20l-2 2" /></svg>
  return <>{category === 'Текст' ? '✎' : '✿'}</>
}
