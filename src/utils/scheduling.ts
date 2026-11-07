import type { Nomination, Project } from '../domain/types'
import { workflows } from '../domain/constants.ts'

export type ScheduleConflict = Project[]

function compareDate(left: string, right: string) {
  if (!left && !right) return 0
  if (!left) return 1
  if (!right) return -1
  return left.localeCompare(right)
}

export function sortProjectsForGantt(projects: Project[], nominations: Nomination[]) {
  const hardDeadlines = new Map(nominations.map((nomination) => [nomination.id, nomination.deadline]))
  return [...projects].sort((left, right) => {
    const leftCompleted = left.stageIndex >= workflows[left.category].length - 1
    const rightCompleted = right.stageIndex >= workflows[right.category].length - 1
    if (leftCompleted !== rightCompleted) return leftCompleted ? 1 : -1

    return compareDate(hardDeadlines.get(left.nominationId) ?? '', hardDeadlines.get(right.nominationId) ?? '')
      || compareDate(left.softEnd, right.softEnd)
      || compareDate(left.softStart, right.softStart)
      || left.title.localeCompare(right.title, 'ru')
  })
}

export function schedulesOverlap(a: Project, b: Project) {
  return !!(a.softStart && a.softEnd && b.softStart && b.softEnd && a.softStart <= b.softEnd && b.softStart <= a.softEnd)
}

export function findScheduleConflict(candidate: Project, otherProjects: Project[]): ScheduleConflict | undefined {
  const projects = otherProjects.filter((project) => project.id !== candidate.id)
  const sameCategory = projects.find((project) => project.category === candidate.category && schedulesOverlap(candidate, project))
  if (sameCategory) return [candidate, sameCategory]

  const overlaps = projects.filter((project) => schedulesOverlap(candidate, project))
  for (let first = 0; first < overlaps.length; first += 1) {
    for (let second = first + 1; second < overlaps.length; second += 1) {
      const a = overlaps[first]
      const b = overlaps[second]
      if (schedulesOverlap(a, b) && new Set([candidate.category, a.category, b.category]).size === 3) return [candidate, a, b]
    }
  }
  return undefined
}

export function getScheduleConflicts(projects: Project[]): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = []
  for (let first = 0; first < projects.length; first += 1) {
    for (let second = first + 1; second < projects.length; second += 1) {
      const a = projects[first]
      const b = projects[second]
      if (a.category === b.category && schedulesOverlap(a, b)) conflicts.push([a, b])
    }
  }
  for (let first = 0; first < projects.length; first += 1) {
    for (let second = first + 1; second < projects.length; second += 1) {
      for (let third = second + 1; third < projects.length; third += 1) {
        const trio = [projects[first], projects[second], projects[third]]
        if (new Set(trio.map((project) => project.category)).size === 3 && schedulesOverlap(trio[0], trio[1]) && schedulesOverlap(trio[0], trio[2]) && schedulesOverlap(trio[1], trio[2])) conflicts.push(trio)
      }
    }
  }
  return conflicts
}

export function describeScheduleConflict(conflict: ScheduleConflict) {
  const names = conflict.map((project) => `«${project.title}»`).join(', ')
  return conflict.length === 2
    ? `${names} пересекаются по плановым датам. Одновременно можно вести только одну работу каждого типа.`
    : `${names} пересекаются по плановым датам. Одновременно можно вести не больше двух работ разных типов.`
}
