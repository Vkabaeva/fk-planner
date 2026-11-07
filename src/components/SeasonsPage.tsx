import type { Project, Season } from '../domain/types'
import { formatDate } from '../utils/dates'
import { levelWord } from '../utils/presentation'
import TrashIcon from './TrashIcon'

type Props = {
  seasons: Season[]
  projects: Project[]
  activeSeasonId: string
  onCreate: () => void
  onDelete: (id: string) => void
  onOpen: (id: string) => void
}

export default function SeasonsPage({ seasons, projects, activeSeasonId, onCreate, onDelete, onOpen }: Props) {
  return <div className="page-content seasons-page">
    <section className="welcome-row">
      <div><div className="eyebrow">ТВОЯ ИСТОРИЯ ФБ</div><h1>Все сезоны</h1><p className="muted">Собирай планы по сезонам и возвращайся к прошлым работам.</p></div>
      <button className="button primary" onClick={onCreate}>＋ <span>Новый сезон</span></button>
    </section>
    {seasons.length ? <section className="seasons-grid">{seasons.map((item) => {
      const nominationIds = new Set(item.nominations.map((nomination) => nomination.id))
      const workCount = projects.filter((project) => nominationIds.has(project.nominationId)).length
      return <article className="season-card" key={item.id}>
        <div className="season-card-top"><span className="season-card-mark">✦</span><div className="season-card-tools">{activeSeasonId === item.id && <span className="current-badge">Открыт сейчас</span>}<button className="season-delete-icon" aria-label={`Удалить сезон «${item.name}»`} onClick={() => onDelete(item.id)}><TrashIcon /></button></div></div>
        <h2>{item.name}</h2>
        <div className="season-dates">{formatDate(item.start)} — {formatDate(item.end)}</div>
        <div className="season-card-stats"><span><b>{item.nominations.length}</b> {levelWord(item.nominations.length)}</span><span><b>{workCount}</b> работ</span></div>
        <div className="season-card-footer"><span>{item.nominations.slice(0, 2).map((nomination) => nomination.name).join(' · ') || 'Левелы ещё не добавлены'}</span><button className="button outline" onClick={() => onOpen(item.id)}>Открыть сезон →</button></div>
      </article>
    })}</section> : <div className="empty-panel"><div className="empty-art">✿</div><h3>Сезонов пока нет</h3><p>Создай сезон ФБ — здесь появятся его даты, левелы и работы.</p><button className="button primary" onClick={onCreate}>Создать первый сезон</button></div>}
  </div>
}
