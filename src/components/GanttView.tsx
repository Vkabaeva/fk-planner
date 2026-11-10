import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import type { Nomination, Project } from '../domain/types'
import { workflows } from '../domain/constants'
import { APP_CONFIG } from '../config/appConfig'
import { addDays, daysBetween, formatDate, localISO, todayISO } from '../utils/dates'
import { typeClass } from '../utils/presentation'
import { getScheduleConflicts, sortProjectsForGantt } from '../utils/scheduling'

type PlanDrag = { id: string; mode: 'move' | 'start' | 'end'; originX: number; start: string; end: string; nextStart: string; nextEnd: string; pointerId: number }

export function GanttView({ projects, nominations, onWindowChange, onOpen }: { projects: Project[]; nominations: Nomination[]; onWindowChange: (id: string, start: string, end: string) => void; onOpen: (id: string) => void }) {
  const [drag, setDrag] = useState<PlanDrag | null>(null)
  const dragRef = useRef<PlanDrag | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const today = todayISO()
  const earliestStartedTask = projects.map((project) => project.softStart).filter((softStart) => softStart && softStart <= today).sort()[0]
  const startValue = earliestStartedTask ? addDays(earliestStartedTask, -APP_CONFIG.planning.ganttStartPaddingDays) : today
  const latest = [today, ...projects.map((project) => project.softEnd).filter(Boolean), ...nominations.map((item) => item.deadline).filter(Boolean)].sort().at(-1) ?? today
  const minimumEnd = new Date(`${today}T12:00:00`); minimumEnd.setDate(minimumEnd.getDate() + APP_CONFIG.planning.ganttMinimumDaysAhead)
  const endValue = latest > localISO(minimumEnd) ? latest : localISO(minimumEnd)
  const daysCount = Math.max(APP_CONFIG.planning.ganttMinimumVisibleDays, daysBetween(startValue, endValue) + 1)
  const dayWidth = APP_CONFIG.planning.ganttDayWidthPx
  const days = Array.from({ length: daysCount }, (_, index) => { const date = new Date(`${startValue}T12:00:00`); date.setDate(date.getDate() + index); return date })
  const todayIndex = daysBetween(startValue, today)
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollLeft = todayIndex * dayWidth
  }, [dayWidth, todayIndex])
  const conflicts = getScheduleConflicts(projects)
  const conflictIds = new Set(conflicts.flat().map((project) => project.id))
  const beginDrag = (event: ReactPointerEvent<HTMLElement>, project: Project, mode: PlanDrag['mode']) => {
    event.preventDefault(); event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    const start = project.softStart || today
    const next = { id: project.id, mode, originX: event.clientX, start, end: project.softEnd, nextStart: start, nextEnd: project.softEnd, pointerId: event.pointerId }
    dragRef.current = next; setDrag(next)
  }
  const moveDrag = (event: ReactPointerEvent<HTMLElement>) => {
    const current = dragRef.current
    if (!current) return
    const project = projects.find((item) => item.id === current.id)
    const hardDeadline = nominations.find((item) => item.id === project?.nominationId)?.deadline
    let offset = Math.round((event.clientX - current.originX) / dayWidth)
    if (current.mode === 'move' && hardDeadline && addDays(current.end, offset) > hardDeadline) offset = daysBetween(current.end, hardDeadline)
    let nextStart = current.start
    let nextEnd = current.end
    if (current.mode === 'move') { nextStart = addDays(current.start, offset); nextEnd = addDays(current.end, offset) }
    if (current.mode === 'start') { nextStart = addDays(current.start, offset); if (nextStart > current.end) nextStart = current.end }
    if (current.mode === 'end') { nextEnd = addDays(current.end, offset); if (hardDeadline && nextEnd > hardDeadline) nextEnd = hardDeadline; if (nextEnd < current.start) nextEnd = current.start }
    const next = { ...current, nextStart, nextEnd }
    dragRef.current = next; setDrag(next)
  }
  const finishDrag = (event: ReactPointerEvent<HTMLElement>) => {
    const current = dragRef.current
    if (!current) return
    onWindowChange(current.id, current.nextStart, current.nextEnd)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    dragRef.current = null; setDrag(null)
  }
  const sortedProjects = sortProjectsForGantt(projects, nominations)
  const rows = sortedProjects.map((project) => {
    const category = project.category
    const visibleStart = drag?.id === project.id ? drag.nextStart : project.softStart || today
    const visibleEnd = drag?.id === project.id ? drag.nextEnd : project.softEnd
    const left = Math.max(0, daysBetween(startValue, visibleStart))
    const right = visibleEnd ? Math.min(days.length, daysBetween(startValue, visibleEnd) + 1) : left
    const width = Math.max(0, right - left)
    const hardDeadline = nominations.find((item) => item.id === project.nominationId)?.deadline ?? ''
    const hard = hardDeadline ? daysBetween(startValue, hardDeadline) : -1
    return { project, category, visibleStart, visibleEnd, left, width, hardDeadline, hard, tooLate: conflictIds.has(project.id) }
  })

  return <div className="gantt-wrap">
    <div className="gantt-legend"><span><i className="legend-plan" /> Плановое окно</span><span><i className="legend-hard" /> Хард-дедлайн</span><span className="gantt-note">Полосу можно будет двигать, чтобы сдвинуть план</span></div>
    <div className="gantt-board">
      <div className="gantt-label-column">
        <div className="gantt-label-head">РАБОТА</div>
        {rows.map(({ project, category, visibleEnd, tooLate }) => <div className={`gantt-project gantt-row ${tooLate ? 'has-conflict' : ''}`} key={project.id}>
          <button type="button" className="gantt-project-title" aria-label={`Открыть работу «${project.title}»`} onClick={() => onOpen(project.id)}>{project.title}</button>
          <small>{category} · {workflows[category][project.stageIndex]}{!visibleEnd ? ' · без планового окна' : ''}{tooLate ? ' · конфликт плана' : ''}</small>
        </div>)}
      </div>
      <div className="gantt-scroll" ref={scrollRef}>
        <div className="gantt-chart" style={{ width: `${days.length * dayWidth}px` }}>
          <div className="gantt-days" style={{ gridTemplateColumns: `repeat(${days.length}, ${dayWidth}px)` }}>{days.map((date, index) => <div key={index} className={`${date.getDate() === 1 ? 'month-start' : ''} ${index === todayIndex ? 'today-col' : ''}`}><span>{date.getDate() === 1 ? new Intl.DateTimeFormat('ru-RU', { month: 'short' }).format(date) : ''}</span><b>{date.getDate()}</b></div>)}</div>
          {rows.map(({ project, category, visibleStart, visibleEnd, left, width, hardDeadline, hard, tooLate }) => <div className={`gantt-track gantt-row ${tooLate ? 'has-conflict' : ''}`} key={project.id} style={{ gridTemplateColumns: `repeat(${days.length}, ${dayWidth}px)` }}>
            {days.map((_, index) => <span key={index} className={`gantt-cell ${index === todayIndex ? 'today-col' : ''}`} />)}
            {visibleEnd && <div className={`plan-bar ${typeClass(category)} ${drag?.id === project.id ? 'dragging' : ''}`} style={{ left: `${left * dayWidth}px`, width: `${width * dayWidth}px` }} onPointerDown={(event) => beginDrag(event, project, 'move')} onPointerMove={moveDrag} onPointerUp={finishDrag}>
              <button className="resize-handle start" aria-label="Сдвинуть начало планового окна" onPointerDown={(event) => beginDrag(event, project, 'start')} onPointerMove={moveDrag} onPointerUp={finishDrag} /><span>{formatDate(visibleStart)} – {formatDate(visibleEnd)}</span><button className="resize-handle end" aria-label="Сдвинуть конец планового окна" onPointerDown={(event) => beginDrag(event, project, 'end')} onPointerMove={moveDrag} onPointerUp={finishDrag} />
            </div>}
            {hard >= 0 && hard < days.length && <div className="hard-marker app-tooltip" style={{ left: `${(hard + .5) * dayWidth}px` }} aria-label={`Хард-дедлайн: ${formatDate(hardDeadline)}`} data-tooltip={`Хард-дедлайн: ${formatDate(hardDeadline)}`} tabIndex={0} />}
          </div>)}
        </div>
      </div>
    </div>
    {!projects.length && <div className="gantt-empty">Добавь работы на доску, чтобы увидеть план сезона.</div>}
    {conflictIds.size > 0 && <div className="conflict-note">⚠ Пересечение нарушает правило загрузки: одновременно — не более одного проекта одной категории и не более двух проектов.</div>}
    <div className="gantt-bottom-note">Перетащи полосу, чтобы сдвинуть всё окно, или потяни за край, чтобы изменить его начало или конец. Дневная норма по словам пересчитается автоматически.</div>
  </div>
}

