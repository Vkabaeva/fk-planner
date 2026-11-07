import type { Dispatch, SetStateAction, DragEvent as ReactDragEvent } from 'react'
import type { ConfirmationRequest, ModalName, Project, ProjectImageAttachment, Season, Store, View } from '../domain/types'
import { workflows, nominationTemplates } from '../domain/constants'
import { defaultSoftDeadline } from '../domain/projectDefaults'
import { todayISO } from '../utils/dates'
import { levelWord, newId } from '../utils/presentation'
import { describeScheduleConflict, findScheduleConflict } from '../utils/scheduling'
import { deleteProjectImage, deleteProjectImages, saveProjectImage } from '../data/projectImages'

type Args = {
  store: Store
  setStore: Dispatch<SetStateAction<Store>>
  season?: Season
  seasonProjects: Project[]
  activeSeasonId: string
  setActiveSeasonId: Dispatch<SetStateAction<string>>
  setShowAllSeasons: Dispatch<SetStateAction<boolean>>
  setView: Dispatch<SetStateAction<View>>
  setModal: Dispatch<SetStateAction<ModalName | null>>
  setSelectedProjectId: Dispatch<SetStateAction<string>>
  setSelectedNominationId: Dispatch<SetStateAction<string>>
  selectedNominationId: string
  setEditingSeasonId: Dispatch<SetStateAction<string>>
  draggedProjectId: string
  setDraggedProjectId: Dispatch<SetStateAction<string>>
  setDragOverNominationId: Dispatch<SetStateAction<string>>
  authUserId?: string
  notify: (message: string) => void
  setDeleteConfirmation: Dispatch<SetStateAction<ConfirmationRequest | null>>
}

export function usePlannerController(args: Args) {
  const { store, setStore, season, seasonProjects, activeSeasonId, setActiveSeasonId, setShowAllSeasons, setView, setModal, setSelectedProjectId, setSelectedNominationId, selectedNominationId, setEditingSeasonId, draggedProjectId, setDraggedProjectId, setDragOverNominationId, authUserId, notify, setDeleteConfirmation } = args
  const addSeason = (name: string, start: string, end: string) => {
    const item = { id: newId(), name, start, end, nominations: [] }
    setStore((current) => ({ ...current, seasons: [...current.seasons, item] }))
    setActiveSeasonId(item.id)
    setShowAllSeasons(false)
    setModal(null)
    notify('Сезон создан')
  }

  const deleteSeason = (seasonId: string) => {
    const target = store.seasons.find((item) => item.id === seasonId)
    if (!target) return
    const nominationIds = new Set(target.nominations.map((item) => item.id))
    const remainingSeasons = store.seasons.filter((item) => item.id !== seasonId)
    setDeleteConfirmation({
      title: `Удалить сезон «${target.name}»?`,
      message: 'Вместе с ним будут удалены левелы, карточки работ и записи прогресса.',
      confirmLabel: 'Удалить сезон',
      onConfirm: () => {
        const removedProjects = store.projects.filter((project) => nominationIds.has(project.nominationId))
        void deleteProjectImages(removedProjects.flatMap((project) => project.attachments ?? []), authUserId).catch(() => notify('Не удалось очистить все изображения удалённого сезона'))
        setStore((current) => ({
          seasons: current.seasons.filter((item) => item.id !== seasonId),
          projects: current.projects.filter((project) => !nominationIds.has(project.nominationId)),
        }))
        if (activeSeasonId === seasonId) {
          setActiveSeasonId(remainingSeasons[0]?.id ?? '')
          if (!remainingSeasons.length) setShowAllSeasons(true)
        }
        notify('Сезон удалён')
      },
    })
  }

  const updateSeason = (seasonId: string, name: string, start: string, end: string) => {
    setStore((current) => ({ ...current, seasons: current.seasons.map((item) => item.id === seasonId ? { ...item, name, start, end } : item) }))
    setModal(null)
    setEditingSeasonId('')
    notify('Изменения сохранены')
  }

  const addNomination = (name: string, deadline: string) => {
    if (!season) return
    const nomination = { id: newId(), name, deadline }
    setStore((current) => ({ ...current, seasons: current.seasons.map((item) => item.id === season.id ? { ...item, nominations: [...item.nominations, nomination] } : item) }))
    setModal(null)
    notify('Левел добавлен')
  }

  const updateNomination = (name: string, deadline: string) => {
    if (!season) return
    setStore((current) => ({ ...current, seasons: current.seasons.map((item) => item.id === season.id ? { ...item, nominations: item.nominations.map((nomination) => nomination.id === selectedNominationId ? { ...nomination, name: name.trim(), deadline } : nomination) } : item) }))
    setModal(null)
    setSelectedNominationId('')
    notify('Левел обновлён')
  }

  const deleteNomination = (nominationId: string) => {
    if (!season) return
    const nomination = season.nominations.find((item) => item.id === nominationId)
    if (!nomination) return
    const projectCount = store.projects.filter((project) => project.nominationId === nominationId).length
    setDeleteConfirmation({
      title: `Удалить левел «${nomination.name}»?`,
      message: projectCount ? `Вместе с ним будут удалены связанные работы (${projectCount}) и записи их прогресса.` : 'В этом левеле нет связанных карточек работ.',
      confirmLabel: 'Удалить левел',
      onConfirm: () => {
        const removedProjects = store.projects.filter((project) => project.nominationId === nominationId)
        void deleteProjectImages(removedProjects.flatMap((project) => project.attachments ?? []), authUserId).catch(() => notify('Не удалось очистить все изображения удалённого левела'))
        setStore((current) => ({
          seasons: current.seasons.map((item) => item.id === season.id ? { ...item, nominations: item.nominations.filter((entry) => entry.id !== nominationId) } : item),
          projects: current.projects.filter((project) => project.nominationId !== nominationId),
        }))
        setSelectedNominationId('')
        setModal(null)
        notify('Левел удалён')
      },
    })
  }

  const importTemplate = (template: keyof typeof nominationTemplates) => {
    if (!season) return
    const names = nominationTemplates[template].names
    const existing = new Set(season.nominations.map((item) => item.name.trim().toLocaleLowerCase('ru-RU')))
    const missing = names.filter((name) => !existing.has(name.toLocaleLowerCase('ru-RU')))
    const added = missing.map((name) => ({ id: newId(), name, deadline: '' }))
    if (added.length) setStore((current) => ({ ...current, seasons: current.seasons.map((item) => item.id === season.id ? { ...item, nominations: [...item.nominations, ...added] } : item) }))
    setModal(null)
    notify(added.length ? `Добавлено ${added.length} ${levelWord(added.length)}` : 'Все левелы этого шаблона уже есть')
  }

  const addProject = (project: Omit<Project, 'id' | 'stageIndex' | 'logs'>) => {
    const newProject: Project = { ...project, id: newId(), stageIndex: 0, logs: [] }
    const conflict = findScheduleConflict(newProject, seasonProjects)
    if (conflict) { notify(describeScheduleConflict(conflict)); return }
    setStore((current) => ({ ...current, projects: [...current.projects, newProject] }))
    setSelectedNominationId('')
    setModal(null)
    notify('Работа добавлена')
  }

  const openNewProject = (nominationId = '') => {
    setSelectedNominationId(nominationId)
    setModal('project')
  }

  const updateProject = (projectId: string, changes: Omit<Project, 'id' | 'stageIndex' | 'logs'>) => {
    const existing = store.projects.find((item) => item.id === projectId)
    if (!existing) return
    const candidate = { ...existing, ...changes }
    const targetSeason = store.seasons.find((item) => item.nominations.some((nomination) => nomination.id === candidate.nominationId))
    const targetProjects = store.projects.filter((item) => item.id !== projectId && targetSeason?.nominations.some((nomination) => nomination.id === item.nominationId))
    const conflict = findScheduleConflict(candidate, targetProjects)
    if (conflict) { notify(describeScheduleConflict(conflict)); return }
    setStore((current) => ({ ...current, projects: current.projects.map((item) => item.id === projectId ? { ...item, ...changes } : item) }))
    setSelectedProjectId('')
    setModal(null)
    notify('Изменения в работе сохранены')
  }

  const openProjectEdit = (projectId: string) => {
    setSelectedProjectId(projectId)
    setModal('edit-project')
  }

  const openProjectDetails = (projectId: string) => {
    setSelectedProjectId(projectId)
    setModal('project-details')
  }

  const saveProjectNotes = (projectId: string, notes: string) => {
    setStore((current) => ({ ...current, projects: current.projects.map((item) => item.id === projectId ? { ...item, notes } : item) }))
    setSelectedProjectId('')
    setModal(null)
    notify('Заметки сохранены')
  }

  const attachProjectImages = async (projectId: string, files: File[]) => {
    const added: ProjectImageAttachment[] = []
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue
      const id = newId()
      try {
        await saveProjectImage(id, file, authUserId)
        added.push({ id, name: file.name || 'Изображение', type: file.type, size: file.size })
      } catch {
        notify('Не удалось сохранить одно из изображений')
      }
    }
    if (added.length) {
      setStore((current) => ({ ...current, projects: current.projects.map((item) => item.id === projectId ? { ...item, attachments: [...(item.attachments ?? []), ...added] } : item) }))
      notify(added.length === 1 ? 'Изображение прикреплено' : `Прикреплено изображений: ${added.length}`)
    }
  }

  const removeProjectImage = async (projectId: string, attachmentId: string) => {
    try {
      await deleteProjectImage(attachmentId, authUserId)
      setStore((current) => ({ ...current, projects: current.projects.map((item) => item.id === projectId ? { ...item, attachments: (item.attachments ?? []).filter((attachment) => attachment.id !== attachmentId) } : item) }))
    } catch { notify('Не удалось удалить изображение') }
  }

  const dragProjectOverLane = (event: ReactDragEvent<HTMLDivElement>, nominationId: string) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    setDragOverNominationId(nominationId)
  }

  const dropProjectOnLane = (event: ReactDragEvent<HTMLDivElement>, nominationId: string) => {
    event.preventDefault()
    const projectId = event.dataTransfer.getData('text/plain') || draggedProjectId
    const project = store.projects.find((item) => item.id === projectId)
    const targetNomination = season?.nominations.find((item) => item.id === nominationId)
    setDragOverNominationId('')
    setDraggedProjectId('')
    if (!project || !targetNomination || project.nominationId === nominationId) return

    let softEnd = project.softEnd
    let softStart = project.softStart
    if (targetNomination.deadline && (!softEnd || softEnd > targetNomination.deadline)) {
      softEnd = defaultSoftDeadline(targetNomination.deadline)
      if (softStart && softStart > softEnd) softStart = softEnd
    }
    const candidate = { ...project, nominationId, softStart, softEnd }
    const conflict = findScheduleConflict(candidate, seasonProjects.filter((item) => item.id !== projectId))
    if (conflict) { notify(describeScheduleConflict(conflict)); return }
    setStore((current) => ({ ...current, projects: current.projects.map((item) => item.id === projectId ? { ...item, nominationId, softStart, softEnd } : item) }))
    notify(softEnd !== project.softEnd || softStart !== project.softStart ? 'Работа перемещена; софт-дедлайн подстроен под дедлайн левела' : 'Работа перемещена в другой левел')
  }

  const openProjectMove = (projectId: string) => {
    setSelectedProjectId(projectId)
    setModal('move-project')
  }

  const moveProject = (projectId: string, targetSeasonId: string, nominationId: string, softStart: string, softEnd: string) => {
    const project = store.projects.find((item) => item.id === projectId)
    const targetSeason = store.seasons.find((item) => item.id === targetSeasonId)
    if (!project || !targetSeason) return
    const candidate = { ...project, nominationId, softStart, softEnd }
    const targetProjects = store.projects.filter((item) => item.id !== projectId && targetSeason.nominations.some((nomination) => nomination.id === item.nominationId))
    const conflict = findScheduleConflict(candidate, targetProjects)
    if (conflict) { notify(describeScheduleConflict(conflict)); return }
    setStore((current) => ({ ...current, projects: current.projects.map((item) => item.id === projectId ? { ...item, nominationId, softStart, softEnd } : item) }))
    setSelectedProjectId('')
    setActiveSeasonId(targetSeasonId)
    setShowAllSeasons(false)
    setView('board')
    setModal(null)
    notify('Работа перенесена в другой сезон')
  }

  const advanceProject = (project: Project, direction: number) => {
    const finalStage = workflows[project.category].length - 1
    setStore((current) => ({ ...current, projects: current.projects.map((item) => item.id === project.id ? { ...item, stageIndex: Math.max(0, Math.min(finalStage, item.stageIndex + direction)) } : item) }))
  }

  const logWords = (projectId: string, amount: number) => {
    setStore((current) => ({ ...current, projects: current.projects.map((item) => item.id === projectId ? { ...item, logs: [...item.logs.filter((log) => log.date !== todayISO()), { date: todayISO(), amount: (item.logs.find((log) => log.date === todayISO())?.amount ?? 0) + amount }] } : item) }))
    setModal(null)
    notify(`Добавлено ${amount.toLocaleString('ru-RU')} слов`)
  }

  const removeProject = (projectId: string) => {
    const project = store.projects.find((item) => item.id === projectId)
    if (!project) return
    setDeleteConfirmation({
      title: `Удалить работу «${project.title}»?`,
      message: 'Вместе с карточкой будут удалены все записи её прогресса.',
      confirmLabel: 'Удалить работу',
      onConfirm: () => {
        void deleteProjectImages(project.attachments ?? [], authUserId).catch(() => notify('Не удалось очистить все изображения удалённой работы'))
        setStore((current) => ({ ...current, projects: current.projects.filter((item) => item.id !== projectId) }))
        setModal(null)
        notify('Работа удалена')
      },
    })
  }

  const changeProjectWindow = (projectId: string, softStart: string, softEnd: string) => {
    const project = store.projects.find((item) => item.id === projectId)
    const hardDeadline = season?.nominations.find((item) => item.id === project?.nominationId)?.deadline
    if (hardDeadline && softEnd > hardDeadline) return
    if (!project) return
    const candidate = { ...project, softStart, softEnd }
    const conflict = findScheduleConflict(candidate, seasonProjects.filter((item) => item.id !== projectId))
    if (conflict) { notify(describeScheduleConflict(conflict)); return }
    setStore((current) => ({ ...current, projects: current.projects.map((item) => item.id === projectId ? { ...item, softStart, softEnd } : item) }))
  }

  return {
    addSeason, deleteSeason, updateSeason, addNomination, updateNomination, deleteNomination,
    importTemplate, addProject, openNewProject, updateProject, openProjectEdit, openProjectDetails,
    saveProjectNotes, attachProjectImages, removeProjectImage, dragProjectOverLane, dropProjectOnLane,
    openProjectMove, moveProject, advanceProject, logWords, removeProject, changeProjectWindow,
  }
}
