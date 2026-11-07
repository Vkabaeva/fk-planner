import type { ModalName } from './types'

export const MODAL_TITLES: Record<ModalName, string> = {
  season: 'Новый сезон',
  'edit-season': 'Редактировать сезон',
  nomination: 'Новый левел',
  'edit-nomination': 'Редактировать левел',
  templates: 'Шаблоны левелов',
  project: 'Новая работа',
  'edit-project': 'Редактировать работу',
  'project-details': 'Карточка работы',
  'move-project': 'Перенести работу',
  log: 'Записать прогресс',
  profile: 'Мой профиль',
  'edit-profile': 'Редактировать профиль',
}

export function modalTitle(modal: ModalName) {
  return MODAL_TITLES[modal]
}
