export type Category = 'Текст' | 'Арт' | 'Крафт'
export type View = 'board' | 'gantt'
export type Nomination = { id: string; name: string; deadline: string }
export type Season = { id: string; name: string; start: string; end: string; nominations: Nomination[] }
export type WorkLog = { date: string; amount: number }
export type ProjectImageAttachment = { id: string; name: string; type: string; size: number }
export type ConfirmationRequest = { title: string; message: string; confirmLabel: string; onConfirm: () => void }

export type Project = {
  id: string
  title: string
  category: Category
  fandom: string
  nominationId: string
  rating: string
  description?: string
  notes?: string
  attachments?: ProjectImageAttachment[]
  stageIndex: number
  targetWords: number
  softStart: string
  softEnd: string
  logs: WorkLog[]
}

export type Store = { seasons: Season[]; projects: Project[] }

export type ModalName = 'season' | 'edit-season' | 'nomination' | 'edit-nomination' | 'templates' | 'project' | 'edit-project' | 'project-details' | 'move-project' | 'log' | 'profile' | 'edit-profile'
