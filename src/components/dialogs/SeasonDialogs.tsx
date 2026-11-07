import { useState } from 'react'
import type { Nomination, Season } from '../../domain/types'
import { nominationTemplates } from '../../domain/constants'
import { addDays, todayISO } from '../../utils/dates'
import { levelWord } from '../../utils/presentation'
import { ValidatedForm } from './shared'

export function SeasonForm({ onSave, initial }: { onSave: (name: string, start: string, end: string) => void; initial?: Season }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [start, setStart] = useState(initial?.start ?? '')
  const [end, setEnd] = useState(initial?.end ?? '')
  const today = todayISO()
  const startError = !initial && !!start && start < today
  const endError = !!(start && end && end <= start)
  const endMin = start ? addDays(start, 1) : addDays(today, 1)
  return <ValidatedForm onSubmit={() => { if (name.trim() && start && end && !startError && !endError) onSave(name.trim(), start, end) }}>
    <label>Название сезона<input autoFocus required placeholder="Например, ФБ · зима 2026" value={name} onChange={(event) => setName(event.target.value)} /></label>
    <div className="form-row">
      <label>Начало сезона<input required type="date" min={initial ? undefined : today} value={start} aria-invalid={startError} onChange={(event) => setStart(event.target.value)} />{startError && <small className="field-error">Начало сезона не может быть раньше сегодняшнего дня.</small>}</label>
      <label>Конец сезона<input required type="date" min={endMin} value={end} aria-invalid={endError} onChange={(event) => setEnd(event.target.value)} />{endError && <small className="field-error">Конец сезона должен быть позже даты начала.</small>}</label>
    </div>
    <div className="form-actions"><button type="submit" className="button primary">{initial ? 'Сохранить изменения' : 'Создать сезон'}</button></div>
  </ValidatedForm>
}

export function NominationForm({ onSave }: { onSave: (name: string, deadline: string) => void }) {
  const [name, setName] = useState('')
  const [deadline, setDeadline] = useState('')
  return <ValidatedForm onSubmit={() => { if (name.trim() && deadline) onSave(name.trim(), deadline) }}><label>Название левела<input autoFocus required placeholder="Например, Основной конкурс" value={name} onChange={(event) => setName(event.target.value)} /></label><label>Хард-дедлайн<input required type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} /><small>Карточки работ в этом левеле унаследуют этот дедлайн.</small></label><div className="form-actions"><button type="submit" className="button primary">Добавить левел</button></div></ValidatedForm>
}

export function EditNominationForm({ nomination, onSave, onDelete }: { nomination: Nomination; onSave: (name: string, deadline: string) => void; onDelete: () => void }) {
  const [name, setName] = useState(nomination.name)
  const [deadline, setDeadline] = useState(nomination.deadline)
  return <ValidatedForm onSubmit={() => { if (name.trim()) onSave(name.trim(), deadline) }}><label>Название левела<input autoFocus required value={name} onChange={(event) => setName(event.target.value)} /></label><label>Хард-дедлайн<input type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} /><small>Можно оставить пустым и заполнить позже.</small></label><div className="form-actions with-delete"><button type="button" className="button danger" onClick={onDelete}>Удалить левел</button><button type="submit" className="button primary">Сохранить</button></div></ValidatedForm>
}

export function TemplatePicker({ onChoose, existingNames }: { onChoose: (template: keyof typeof nominationTemplates) => void; existingNames: string[] }) {
  const existing = new Set(existingNames.map((name) => name.trim().toLocaleLowerCase('ru-RU')))
  return <div className="template-picker"><p className="template-intro">Выбери список левелов для сезона. Дедлайны останутся пустыми; повторяющиеся названия будут пропущены.</p>{(Object.entries(nominationTemplates) as [keyof typeof nominationTemplates, (typeof nominationTemplates)[keyof typeof nominationTemplates]][]).map(([key, template]) => {
    const missingCount = template.names.filter((name) => !existing.has(name.toLocaleLowerCase('ru-RU'))).length
    return <article className="template-card" key={key}><div className="template-card-head"><div><span className="template-season-icon">{key === 'winter' ? '❄' : '☀'}</span><h3>{template.title}</h3></div><span className="template-count">{template.names.length} левелов</span></div><div className="template-names">{template.names.map((name) => <span key={name}>{name}</span>)}</div><button className="button primary" disabled={!missingCount} onClick={() => onChoose(key)}>{missingCount ? `Добавить ${missingCount} ${levelWord(missingCount)}` : 'Все левелы уже добавлены'}</button></article>
  })}</div>
}

