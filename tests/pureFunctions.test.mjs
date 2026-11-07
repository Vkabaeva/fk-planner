import assert from 'node:assert/strict'
import test from 'node:test'
import { addDays, daysBetween } from '../src/utils/dates.ts'
import { levelWord, projectWord } from '../src/utils/presentation.ts'
import { sortProjectsForGantt, schedulesOverlap } from '../src/utils/scheduling.ts'
import { getLevelDefaults } from '../src/domain/projectDefaults.ts'
import { decodeStore, encodeStore } from '../src/domain/storeSchema.ts'

const project = (id, overrides = {}) => ({
  id,
  title: id,
  category: 'Текст',
  nominationId: 'level',
  rating: 'G',
  stageIndex: 0,
  targetWords: 1000,
  softStart: '2026-12-01',
  softEnd: '2026-12-10',
  logs: [],
  ...overrides,
})

test('date helpers operate on calendar days', () => {
  assert.equal(addDays('2026-12-01', 11), '2026-12-12')
  assert.equal(daysBetween('2026-12-01', '2026-12-12'), 11)
})

test('Russian project and level counters use the correct forms', () => {
  assert.equal(projectWord(1), 'проект')
  assert.equal(projectWord(3), 'проекта')
  assert.equal(projectWord(12), 'проектов')
  assert.equal(levelWord(1), 'левел')
  assert.equal(levelWord(4), 'левела')
  assert.equal(levelWord(15), 'левелов')
})

test('Gantt order follows hard deadline, soft deadline, start, title, then completion', () => {
  const projects = [
    project('done', { stageIndex: 4, softEnd: '2026-12-01' }),
    project('later-start', { title: 'A', softStart: '2026-12-03' }),
    project('z-title', { title: 'Я' }),
    project('earlier-hard', { nominationId: 'early' }),
  ]
  const sorted = sortProjectsForGantt(projects, [
    { id: 'level', name: 'Левел', deadline: '2026-12-20' },
    { id: 'early', name: 'Ранний', deadline: '2026-12-10' },
  ])
  assert.deepEqual(sorted.map(({ id }) => id), ['earlier-hard', 'z-title', 'later-start', 'done'])
})

test('schedule overlap includes touching calendar dates', () => {
  assert.equal(schedulesOverlap(project('a', { softEnd: '2026-12-10' }), project('b', { softStart: '2026-12-10' })), true)
  assert.equal(schedulesOverlap(project('a', { softEnd: '2026-12-09' }), project('b', { softStart: '2026-12-10' })), false)
})


test('level defaults follow nomination words', () => {
  assert.deepEqual(getLevelDefaults('Тексты G-T'), { category: 'Текст', rating: 'G', targetWords: 1000 })
  assert.deepEqual(getLevelDefaults('Визуал М-Е'), { category: 'Арт', rating: 'R', targetWords: 5000 })
  assert.deepEqual(getLevelDefaults('Неформат'), { category: 'Крафт', rating: '', targetWords: 5000 })
})

test('storage accepts legacy data and writes a versioned envelope', () => {
  const legacy = { seasons: [], projects: [] }
  assert.deepEqual(decodeStore(legacy), legacy)
  assert.deepEqual(decodeStore(encodeStore(legacy)), legacy)
  assert.throws(() => decodeStore({ schemaVersion: 999, data: legacy }), /не поддерживается/)
})
