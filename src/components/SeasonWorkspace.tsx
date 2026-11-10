import { useRef, type CSSProperties, type DragEvent } from 'react'
import type { ModalName, Project, Season, View } from '../domain/types'
import { formatDate } from '../utils/dates'
import { nearestDeadline, projectWord } from '../utils/presentation'
import ProjectCard from './ProjectCard'
import LaneCards from './LaneCards'
import { GanttView } from './GanttView'
import { useNominationColumnWidth } from '../hooks/useNominationColumnWidth'

type Props = {
  season: Season
  projects: Project[]
  activeProjectCount: number
  wordsDone: number
  view: View
  dragOverNominationId: string
  cloudError: string
  cloudEnabled: boolean
  saveState: 'idle' | 'saving' | 'saved' | 'error'
  onViewChange: (view: View) => void
  onOpenNewProject: (nominationId?: string) => void
  onSetModal: (modal: ModalName) => void
  onEditNomination: (id: string) => void
  onAdvance: (project: Project, direction: number) => void
  onLog: (projectId: string) => void
  onMove: (projectId: string) => void
  onEdit: (projectId: string) => void
  onOpen: (projectId: string) => void
  onDelete: (projectId: string) => void
  onDragStart: (projectId: string) => void
  onDragEnd: () => void
  onDragOver: (event: DragEvent<HTMLDivElement>, nominationId: string) => void
  onDragLeave: (event: DragEvent<HTMLDivElement>) => void
  onDrop: (event: DragEvent<HTMLDivElement>, nominationId: string) => void
  onWindowChange: (projectId: string, start: string, end: string) => void
  onRetrySync: () => void
}

export default function SeasonWorkspace(props: Props) {
  const { season, projects, activeProjectCount, wordsDone, view, dragOverNominationId, cloudError, cloudEnabled, saveState } = props
  const boardRef = useRef<HTMLElementTagNameMap['section']>(null)
  const nominationColumnWidth = useNominationColumnWidth(boardRef, season.nominations, projects)

  return <div className="page-content">
    <section className="welcome-row">
      <div><h1>{season.name}</h1><div className="season-heading-date"><span aria-hidden="true">◷</span>{formatDate(season.start)} — {formatDate(season.end)}</div></div>
      <button className="button primary" onClick={() => season.nominations.length ? props.onOpenNewProject() : props.onSetModal('nomination')}>＋ <span>{season.nominations.length ? 'Новая работа' : 'Добавить левел'}</span></button>
    </section>
    <section className="stats-row">
      <div className="stat-card"><span className="stat-icon lilac">✦</span><div><small>В работе</small><strong>{activeProjectCount}<em> {projectWord(activeProjectCount)}</em></strong></div></div>
      <div className="stat-card"><span className="stat-icon peach">◷</span><div><small>Ближайший дедлайн</small><strong>{nearestDeadline(season.nominations)}</strong></div></div>
      <div className="stat-card"><span className="stat-icon mint">↗</span><div><small>Слов написано</small><strong>{wordsDone.toLocaleString('ru-RU')}</strong></div></div>
      <div className="stat-card"><span className="stat-icon yellow">◎</span><div><small>Идей на доске</small><strong>{projects.length}</strong></div></div>
    </section>
    <div className="section-heading"><div><h2>{view === 'board' ? 'Доска работ' : 'План сезона'}</h2><p>{view === 'board' ? 'Карточки распределены по левелам' : 'Плановые окна, дедлайны и загрузка'}</p></div><div className="heading-actions"><div className="view-switch"><button className={view === 'board' ? 'active' : ''} onClick={() => props.onViewChange('board')}>Доска</button><button className={view === 'gantt' ? 'active' : ''} onClick={() => props.onViewChange('gantt')}>Гант</button></div><button className="button outline" onClick={() => props.onSetModal('templates')}>Импорт шаблона</button><button className="button outline" onClick={() => props.onSetModal('nomination')}>＋ Левел</button></div></div>
    {!season.nominations.length ? <div className="empty-panel"><div className="empty-art">✿</div><h3>Начни с левелов</h3><p>Добавь левелы вручную или импортируй готовый шаблон Зимы или Лета.</p><div className="empty-actions"><button className="button primary" onClick={() => props.onSetModal('templates')}>Импортировать шаблон</button><button className="button outline" onClick={() => props.onSetModal('nomination')}>Добавить вручную</button></div></div> : view === 'board' ? (
      <section ref={boardRef} className="board-grid" style={{ '--nomination-column-width': `${nominationColumnWidth}px` } as CSSProperties}>
        {season.nominations.map((nomination) => {
          const laneProjects = projects.filter((project) => project.nominationId === nomination.id)
          return <div className={`lane ${dragOverNominationId === nomination.id ? 'drag-over' : ''}`} key={nomination.id} onDragOver={(event) => props.onDragOver(event, nomination.id)} onDragLeave={props.onDragLeave} onDrop={(event) => props.onDrop(event, nomination.id)}>
            <div className="lane-info"><div className="lane-heading"><div className="lane-name"><span className="lane-dot" /> <strong>{nomination.name}</strong><span className="count-pill">{laneProjects.length}</span></div><div className="lane-actions"><button className="icon-button" aria-label={`Редактировать левел «${nomination.name}»`} onClick={() => props.onEditNomination(nomination.id)}>✎</button></div></div>
              <div className="lane-deadline">Хард-дедлайн <b>{formatDate(nomination.deadline)}</b></div></div>
            <LaneCards projectCount={laneProjects.length} onAdd={() => props.onOpenNewProject(nomination.id)}>{laneProjects.map((project) => <ProjectCard key={project.id} project={project} onAdvance={props.onAdvance} onLog={props.onLog} onMove={props.onMove} onEdit={props.onEdit} onOpen={props.onOpen} onDelete={props.onDelete} onDragStart={props.onDragStart} onDragEnd={props.onDragEnd} />)}</LaneCards>
          </div>
        })}
        <button className="add-lane" onClick={() => props.onSetModal('nomination')}>＋ Новый левел</button>
      </section>
    ) : <GanttView projects={projects} nominations={season.nominations} onWindowChange={props.onWindowChange} onOpen={props.onOpen} />}
    <footer className="page-footer"><span>{cloudError ? 'Не удалось синхронизировать последние изменения.' : !cloudEnabled ? 'Локальный режим: сохранено в этом браузере' : saveState === 'saving' ? 'Сохраняем изменения…' : saveState === 'saved' ? 'Все изменения сохранены' : 'Сезоны и работы синхронизируются с облаком'}</span>{cloudError && cloudEnabled && <button type="button" className="notes-edit-button" onClick={props.onRetrySync}>Повторить синхронизацию</button>}</footer>
  </div>
}
