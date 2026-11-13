import type { Category, Nomination, Project, ProjectImageAttachment, Season, Store, WorkLog } from './types'
import { blankStore, categories } from './constants.ts'

export const STORE_SCHEMA_VERSION = 1

type UnknownRecord = Record<string, unknown>

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== 'string') throw new Error(`Некорректное поле хранилища: ${field}`)
  return value
}

function optionalString(value: unknown, field: string): string | undefined {
  if (value === undefined) return undefined
  return requiredString(value, field)
}

function decodeNomination(value: unknown): Nomination {
  if (!isRecord(value)) throw new Error('Некорректные данные левела')
  return { id: requiredString(value.id, 'nomination.id'), name: requiredString(value.name, 'nomination.name'), deadline: requiredString(value.deadline, 'nomination.deadline') }
}

function decodeSeason(value: unknown): Season {
  if (!isRecord(value) || !Array.isArray(value.nominations)) throw new Error('Некорректные данные сезона')
  return {
    id: requiredString(value.id, 'season.id'),
    name: requiredString(value.name, 'season.name'),
    start: requiredString(value.start, 'season.start'),
    end: requiredString(value.end, 'season.end'),
    nominations: value.nominations.map(decodeNomination),
  }
}

function decodeLog(value: unknown): WorkLog {
  if (!isRecord(value) || typeof value.amount !== 'number' || !Number.isFinite(value.amount)) throw new Error('Некорректная запись прогресса')
  return { date: requiredString(value.date, 'log.date'), amount: value.amount }
}

function decodeAttachment(value: unknown): ProjectImageAttachment {
  if (!isRecord(value) || typeof value.size !== 'number' || !Number.isFinite(value.size)) throw new Error('Некорректное вложение карточки')
  return {
    id: requiredString(value.id, 'attachment.id'),
    name: requiredString(value.name, 'attachment.name'),
    type: requiredString(value.type, 'attachment.type'),
    size: value.size,
  }
}

function decodeProject(value: unknown): Project {
  if (!isRecord(value) || !categories.includes(value.category as Category)) throw new Error('Некорректные данные работы')
  const stageIndex = typeof value.stageIndex === 'number' && Number.isFinite(value.stageIndex) ? value.stageIndex : 0
  const targetWords = typeof value.targetWords === 'number' && Number.isFinite(value.targetWords) ? value.targetWords : 0
  if (value.logs !== undefined && !Array.isArray(value.logs)) throw new Error('Некорректный список прогресса')
  if (value.attachments !== undefined && !Array.isArray(value.attachments)) throw new Error('Некорректный список вложений')
  return {
    id: requiredString(value.id, 'project.id'),
    title: requiredString(value.title, 'project.title'),
    category: value.category as Category,
    fandom: typeof value.fandom === 'string' ? value.fandom : '',
    nominationId: requiredString(value.nominationId, 'project.nominationId'),
    rating: requiredString(value.rating, 'project.rating'),
    description: optionalString(value.description, 'project.description'),
    notes: optionalString(value.notes, 'project.notes'),
    attachments: (value.attachments as unknown[] | undefined)?.map(decodeAttachment),
    stageIndex,
    targetWords,
    softStart: typeof value.softStart === 'string' ? value.softStart : '',
    softEnd: typeof value.softEnd === 'string' ? value.softEnd : '',
    logs: (value.logs as unknown[] | undefined)?.map(decodeLog) ?? [],
  }
}

export function decodeStore(value: unknown): Store {
  if (!isRecord(value)) throw new Error('Хранилище должно быть объектом')
  let payload: UnknownRecord = value
  if ('schemaVersion' in value || 'data' in value) {
    if (value.schemaVersion !== STORE_SCHEMA_VERSION) throw new Error(`Версия хранилища ${String(value.schemaVersion)} не поддерживается`)
    if (!isRecord(value.data)) throw new Error('Не найдено содержимое хранилища')
    payload = value.data
  }
  if (!Array.isArray(payload.seasons) || !Array.isArray(payload.projects)) throw new Error('В хранилище отсутствует список сезонов или работ')
  return { seasons: payload.seasons.map(decodeSeason), projects: payload.projects.map(decodeProject) }
}

export function encodeStore(store: Store) {
  return { schemaVersion: STORE_SCHEMA_VERSION, data: store }
}

export function emptyStore(): Store {
  return { seasons: [...blankStore.seasons], projects: [...blankStore.projects] }
}
