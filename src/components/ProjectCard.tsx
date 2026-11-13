import { useEffect, useState } from 'react'
import type { Project } from '../domain/types'
import { workflows } from '../domain/constants'
import { daysBetween, todayISO } from '../utils/dates'
import { typeClass } from '../utils/presentation'

type Props = {
  project: Project
  onAdvance: (project: Project, direction: number) => void
  onLog: (id: string) => void
  onMove: (id: string) => void
  onEdit: (id: string) => void
  onOpen: (id: string) => void
  onDelete: (id: string) => void
  onDragStart: (id: string) => void
  onDragEnd: () => void
}

function ratingClass(rating: string) {
  if (rating === 'G') return 'rating-g'
  if (rating === 'PG-13') return 'rating-pg13'
  if (rating === 'R') return 'rating-r'
  if (rating === 'NC-17') return 'rating-nc17'
  return rating ? 'rating-other' : 'rating-none'
}

function textSize(targetWords: number) {
  if (targetWords <= 1000) return 'драббл'
  if (targetWords <= 4000) return 'мини'
  if (targetWords <= 15000) return 'миди'
  return 'макси'
}

function textSizeClass(targetWords: number) {
  if (targetWords <= 1000) return 'size-drabble'
  if (targetWords <= 4000) return 'size-mini'
  if (targetWords <= 15000) return 'size-midi'
  return 'size-maxi'
}

export default function ProjectCard({ project, onAdvance, onLog, onMove, onEdit, onOpen, onDelete, onDragStart, onDragEnd }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  useEffect(() => {
    if (!menuOpen) return
    const closeMenu = (event: PointerEvent) => {
      if (!(event.target instanceof Element) || !event.target.closest('.project-menu-wrap')) setMenuOpen(false)
    }
    document.addEventListener('pointerdown', closeMenu)
    return () => document.removeEventListener('pointerdown', closeMenu)
  }, [menuOpen])

  const phases = workflows[project.category]
  const done = project.logs.reduce((sum, log) => sum + log.amount, 0)
  const remainingFrom = project.softStart > todayISO() ? project.softStart : todayISO()
  const daysLeft = project.softEnd ? Math.max(1, daysBetween(remainingFrom, project.softEnd) + 1) : 0
  const wordsPerDay = daysLeft ? Math.ceil(Math.max(0, project.targetWords - done) / daysLeft) : 0
  const progress = project.targetWords ? Math.min(100, Math.round(done / project.targetWords * 100)) : Math.round(project.stageIndex / (phases.length - 1) * 100)

  return <article className="project-card" role="group" tabIndex={0} aria-label={`Карточка «${project.title}». Нажмите Enter, чтобы открыть просмотр.`} draggable onClick={(event) => { if (event.target instanceof Element && event.target.closest('button')) return; onOpen(project.id) }} onKeyDown={(event) => { if (event.target !== event.currentTarget) return; if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onOpen(project.id) } }} onDragStart={(event) => { event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', project.id); onDragStart(project.id) }} onDragEnd={onDragEnd}>
    <div className="card-top"><div className="card-badges">{project.fandom && <span className="fandom-tag" title={project.fandom}>{project.fandom}</span>}<span className={`type-tag ${typeClass(project.category)}`}>{project.category.toLocaleLowerCase('ru-RU')}</span>{project.category === 'Текст' && project.targetWords > 0 && <span className={`size-tag ${textSizeClass(project.targetWords)}`}>{textSize(project.targetWords)}</span>}<span className={`rating-tag ${ratingClass(project.rating)}`}>{project.rating || 'Без рейтинга'}</span>{(project.notes?.trim() || project.attachments?.length) && <span className="notes-indicator" aria-hidden="true">▤</span>}</div><div className="project-menu-wrap"><button className="card-menu" aria-label={`Действия с работой «${project.title}»`} aria-haspopup="menu" aria-expanded={menuOpen} onClick={(event) => { event.stopPropagation(); setMenuOpen((open) => !open) }}>···</button>{menuOpen && <div className="project-menu" role="menu"><button role="menuitem" onClick={(event) => { event.stopPropagation(); setMenuOpen(false); onEdit(project.id) }}>Редактировать работу</button><button role="menuitem" onClick={(event) => { event.stopPropagation(); setMenuOpen(false); onMove(project.id) }}>Перенести в другой сезон</button><button className="danger" role="menuitem" onClick={(event) => { event.stopPropagation(); setMenuOpen(false); onDelete(project.id) }}>Удалить работу</button></div>}</div></div>
    <h3>{project.title}</h3>{project.description && <p className="project-description">{project.description}</p>}
    <div className="stage-line"><div className="stage-label"><span>ЭТАП {project.stageIndex + 1} ИЗ {phases.length}</span><b>{phases[project.stageIndex]}</b></div><div className="phase-dots">{phases.map((phase, index) => <span key={phase} className={index <= project.stageIndex ? 'done' : ''} />)}</div></div>
    {project.category === 'Текст' && project.targetWords > 0 && <div className="word-progress"><div className="word-caption"><span>{done.toLocaleString('ru-RU')} <i>/ {project.targetWords.toLocaleString('ru-RU')} слов</i></span><b>{progress}%</b></div><div className="progress-track"><span style={{ width: `${progress}%` }} /></div><div className="daily-target">{project.softEnd ? <>Сегодня ориентир <b>{wordsPerDay.toLocaleString('ru-RU')} слов</b></> : <span>Укажи софт-дедлайн для дневного плана</span>}</div></div>}
    {project.category !== 'Текст' && <div className="nontext-progress"><span className="progress-track"><span style={{ width: `${progress}%` }} /></span><b>{progress}%</b></div>}
    <div className="card-actions">{project.category === 'Текст' && project.stageIndex === 3 && <button className="log-button" onClick={() => onLog(project.id)}>＋ Записать слова</button>}<div className="stage-actions">{project.stageIndex > 0 && <button className="previous-stage" aria-label="Переместить на предыдущий этап" onClick={() => onAdvance(project, -1)}>← Предыдущий этап</button>}{project.stageIndex < phases.length - 1 && <button className="next-stage" aria-label="Переместить на следующий этап" onClick={() => onAdvance(project, 1)}>Следующий этап →</button>}</div></div>
  </article>
}
