import { useEffect, useState, type ReactNode } from 'react'
import type { Category, Project, ProjectImageAttachment, Season } from '../../domain/types'
import { categories, workflows } from '../../domain/constants'
import { formatDate, todayISO } from '../../utils/dates'
import { typeClass } from '../../utils/presentation'
import { defaultSoftDeadline, getLevelDefaults } from '../../domain/projectDefaults'
import { loadProjectImage } from '../../data/projectImages'
import CategoryIcon from '../CategoryIcon'
import { ValidatedForm } from './shared'

export function ProjectForm({ season, onSave, initial, initialNominationId }: { season: Season; onSave: (project: Omit<Project, 'id' | 'stageIndex' | 'logs'>) => void; initial?: Project; initialNominationId?: string }) {
  const preferredNominationId = initial?.nominationId ?? initialNominationId
  const initialLevel = season.nominations.find((item) => item.id === preferredNominationId) ?? season.nominations[0]
  const initialDefaults = getLevelDefaults(initialLevel?.name ?? '')
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [category, setCategory] = useState<Category>(initial?.category ?? initialDefaults.category)
  const [nominationId, setNominationId] = useState(initialLevel?.id ?? '')
  const [rating, setRating] = useState(initial?.rating ?? initialDefaults.rating)
  const [targetWords, setTargetWords] = useState(String(initial?.targetWords ?? initialDefaults.targetWords))
  const [softStart, setSoftStart] = useState(initial?.softStart ?? todayISO())
  const [softEnd, setSoftEnd] = useState(initial?.softEnd ?? defaultSoftDeadline(initialLevel?.deadline ?? ''))
  const nomination = season.nominations.find((item) => item.id === nominationId)
  const hardDeadline = nomination?.deadline ?? ''
  const actualEnd = softEnd || hardDeadline
  const dateError = !!(actualEnd && ((hardDeadline && actualEnd > hardDeadline) || (softStart && actualEnd < softStart)))
  const changeLevel = (nextNominationId: string) => {
    const nextNomination = season.nominations.find((item) => item.id === nextNominationId)
    const defaults = getLevelDefaults(nextNomination?.name ?? '')
    setNominationId(nextNominationId)
    setCategory(defaults.category)
    setRating(defaults.rating)
    setTargetWords(String(defaults.targetWords))
    setSoftEnd(defaultSoftDeadline(nextNomination?.deadline ?? ''))
  }
  return <ValidatedForm onSubmit={() => { if (title.trim() && nominationId && !dateError) onSave({ title: title.trim(), category, nominationId, rating, description: description.trim(), notes: initial?.notes ?? '', targetWords: category === 'Текст' ? Number(targetWords) || 0 : 0, softStart, softEnd: actualEnd }) }}>
    <label>Название работы<input autoFocus required placeholder="Как ты пока называешь эту идею?" value={title} onChange={(event) => setTitle(event.target.value)} /></label>
    <div className="form-row"><label>Тип работы<select value={category} onChange={(event) => setCategory(event.target.value as Category)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label><label>Рейтинг<select value={rating} onChange={(event) => setRating(event.target.value)}><option value="">Пока не выбран</option><option>G</option><option>PG-13</option><option>R</option><option>NC-17</option><option>Другое</option></select></label></div>
    {category === 'Текст' ? <div className="form-row">
      <label>Левел<select value={nominationId} onChange={(event) => changeLevel(event.target.value)}>{season.nominations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label>Цель по объёму слов<input type="number" min="0" step="100" value={targetWords} onChange={(event) => setTargetWords(event.target.value)} /></label>
    </div> : <label>Левел<select value={nominationId} onChange={(event) => changeLevel(event.target.value)}>{season.nominations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}
    <div className="form-row"><label>План начать<input type="date" max={hardDeadline || undefined} value={softStart} onChange={(event) => setSoftStart(event.target.value)} /></label><label>Софт-дедлайн<input type="date" value={softEnd} min={softStart || undefined} max={hardDeadline || undefined} onChange={(event) => setSoftEnd(event.target.value)} placeholder={hardDeadline || 'Выбери дату'} /></label></div>
    <label>Краткое описание<textarea rows={3} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Пара слов об идее, сюжете или образе" /></label>
    {hardDeadline && <div className="deadline-hint">Хард-дедлайн левела: <b>{formatDate(hardDeadline)}</b></div>}{dateError && <div className="field-error">Плановое окно должно закончиться не раньше даты начала и не позже хард-дедлайна.</div>}
    <div className="workflow-preview"><small>ЭТАПЫ РАБОТЫ</small><div>{workflows[category].map((phase, index) => <span key={phase}>{index > 0 && <i>→</i>}{phase}</span>)}</div></div>
    <div className="form-actions"><button type="submit" className="button primary" disabled={dateError}>{initial ? 'Сохранить изменения' : 'Создать карточку'}</button></div>
  </ValidatedForm>
}

function projectRatingClass(rating: string) {
  if (rating === 'G') return 'rating-g'
  if (rating === 'PG-13') return 'rating-pg13'
  if (rating === 'R') return 'rating-r'
  if (rating === 'NC-17') return 'rating-nc17'
  return rating ? 'rating-other' : 'rating-none'
}

export function ProjectDetailsForm({ project, levelName, hardDeadline, onSave, attachments, onAttachImages, onRemoveImage, storageUserId }: { project: Project; levelName: string; hardDeadline: string; onSave: (notes: string) => void; attachments: ProjectImageAttachment[]; onAttachImages: (files: File[]) => void; onRemoveImage: (id: string) => void; storageUserId?: string }) {
  const [notes, setNotes] = useState(project.notes ?? '')
  const [editingNotes, setEditingNotes] = useState(!(project.notes?.trim()))
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({})
  const [previewImageId, setPreviewImageId] = useState('')
  const phases = workflows[project.category]
  const wordsDone = project.logs.reduce((sum, log) => sum + log.amount, 0)
  useEffect(() => {
    let cancelled = false
    const urls: string[] = []
    void Promise.all(attachments.map(async (attachment) => {
      try {
        const image = await loadProjectImage(attachment.id, storageUserId)
        if (!image) return null
        const url = URL.createObjectURL(image)
        urls.push(url)
        return [attachment.id, url] as const
      } catch { return null }
    })).then((entries) => {
      if (cancelled) { urls.forEach(URL.revokeObjectURL); return }
      const next: Record<string, string> = {}
      entries.forEach((entry) => { if (entry) next[entry[0]] = entry[1] })
      setImageUrls(next)
    })
    return () => { cancelled = true; urls.forEach(URL.revokeObjectURL) }
  }, [attachments, storageUserId])
  useEffect(() => {
    if (!previewImageId) return
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setPreviewImageId('') }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [previewImageId])
  const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const files = Array.from(event.clipboardData.items).filter((item) => item.kind === 'file' && item.type.startsWith('image/')).map((item) => item.getAsFile()).filter((file): file is File => !!file)
    if (files.length) { event.preventDefault(); onAttachImages(files) }
  }
  const renderNotes = () => {
    const parts: ReactNode[] = []
    const urlPattern = /(?:https?:\/\/|www\.)[^\s<>"']+/gi
    let lastIndex = 0
    for (const match of notes.matchAll(urlPattern)) {
      const raw = match[0]
      const link = raw.replace(/[.,!?;:)\]}]+$/, '')
      const start = match.index ?? lastIndex
      parts.push(notes.slice(lastIndex, start))
      if (link) parts.push(<a key={`link-${start}`} href={link.startsWith('www.') ? `https://${link}` : link} target="_blank" rel="noopener noreferrer">{link}</a>)
      parts.push(raw.slice(link.length))
      lastIndex = start + raw.length
    }
    parts.push(notes.slice(lastIndex))
    return parts
  }
  return <div className="project-details-view">
    <div className="project-details-tags">
      <span className={`type-tag ${typeClass(project.category)}`}><CategoryIcon category={project.category} /> {project.category}</span>
      <span className={`rating-tag ${projectRatingClass(project.rating)}`}>{project.rating || 'Без рейтинга'}</span>
      {levelName && <span className="detail-chip">Левел · {levelName}</span>}
      {hardDeadline && <span className="detail-chip">Хард-дедлайн · {formatDate(hardDeadline)}</span>}
      {project.softStart && <span className="detail-chip">План начать · {formatDate(project.softStart)}</span>}
      {project.softEnd && <span className="detail-chip">Софт-дедлайн · {formatDate(project.softEnd)}</span>}
    </div>
    {project.description && <section className="project-details-section"><h3>Краткое описание</h3><p>{project.description}</p></section>}
    <section className="project-details-stage"><span>Текущий этап · {project.stageIndex + 1} из {phases.length}</span><strong>{phases[project.stageIndex]}</strong></section>
    {project.category === 'Текст' && project.targetWords > 0 && <section className="project-details-section"><h3>Цель по объёму слов</h3><p>{wordsDone.toLocaleString('ru-RU')} из {project.targetWords.toLocaleString('ru-RU')} слов</p></section>}
    <section className="project-details-section project-notes-section">
      <div className="project-notes-heading"><h3>Детали и заметки</h3>{!editingNotes && <button type="button" className="notes-edit-button" onClick={() => setEditingNotes(true)}>Редактировать</button>}</div>
      {editingNotes ? <ValidatedForm onSubmit={() => { onSave(notes.trim()) }}>
        <textarea aria-label="Детали и заметки" rows={6} value={notes} onChange={(event) => setNotes(event.target.value)} onPaste={handlePaste} placeholder="Черновые мысли, детали, которые не хочется потерять…" />
        <div className="form-actions"><button type="submit" className="button primary">Сохранить заметки</button><button type="button" className="button outline" onClick={() => { setNotes(project.notes ?? ''); setEditingNotes(false) }}>Отмена</button></div>
      </ValidatedForm> : <p className="project-notes-text">{renderNotes()}</p>}
    </section>
    {attachments.length > 0 && <section className="project-attachments"><h3>Изображения</h3><div className="project-attachment-grid">{attachments.map((attachment) => <figure className="project-attachment" key={attachment.id}>{imageUrls[attachment.id] ? <button type="button" className="attachment-preview" aria-label={`Открыть изображение ${attachment.name}`} onClick={() => setPreviewImageId(attachment.id)}><img src={imageUrls[attachment.id]} alt={attachment.name} /></button> : <div className="attachment-loading">Загрузка…</div>}<button type="button" className="attachment-remove" aria-label={`Удалить изображение ${attachment.name}`} onClick={() => onRemoveImage(attachment.id)}>×</button><figcaption title={attachment.name}>{attachment.name}</figcaption></figure>)}</div></section>}
    <div className="attachment-tools"><label className="button outline attach-image-button">＋ Добавить изображения<input type="file" accept="image/*" multiple onChange={(event) => { const files = Array.from(event.target.files ?? []); if (files.length) onAttachImages(files); event.target.value = '' }} /></label><small>Изображение можно вставить из буфера прямо в поле заметок.</small></div>
    {previewImageId && imageUrls[previewImageId] && <div className="image-lightbox" role="dialog" aria-modal="true" aria-label="Просмотр изображения" onMouseDown={(event) => { if (event.target === event.currentTarget) setPreviewImageId('') }}><button type="button" className="image-lightbox-close" aria-label="Закрыть просмотр" onClick={() => setPreviewImageId('')}>×</button><img src={imageUrls[previewImageId]} alt={attachments.find((attachment) => attachment.id === previewImageId)?.name ?? 'Прикреплённое изображение'} /></div>}
  </div>
}

export function MoveProjectForm({ project, seasons, sourceSeason, onSave }: { project: Project; seasons: Season[]; sourceSeason?: Season; onSave: (seasonId: string, nominationId: string, softStart: string, softEnd: string) => void }) {
  const targetSeasons = seasons.filter((item) => item.id !== sourceSeason?.id)
  const sourceNomination = sourceSeason?.nominations.find((item) => item.id === project.nominationId)
  const initialSeason = targetSeasons[0]
  const initialNomination = initialSeason?.nominations.find((item) => item.name.trim().toLocaleLowerCase('ru-RU') === sourceNomination?.name.trim().toLocaleLowerCase('ru-RU')) ?? initialSeason?.nominations[0]
  const [targetSeasonId, setTargetSeasonId] = useState(initialSeason?.id ?? '')
  const [nominationId, setNominationId] = useState(initialNomination?.id ?? '')
  const [softStart, setSoftStart] = useState(project.softStart)
  const [softEnd, setSoftEnd] = useState(project.softEnd)
  const targetSeason = targetSeasons.find((item) => item.id === targetSeasonId)
  const targetNomination = targetSeason?.nominations.find((item) => item.id === nominationId)
  const hardDeadline = targetNomination?.deadline ?? ''
  const dateError = !!(softStart && softEnd && (softEnd < softStart || (!!hardDeadline && softEnd > hardDeadline)))

  const changeTargetSeason = (seasonId: string) => {
    const nextSeason = targetSeasons.find((item) => item.id === seasonId)
    const matchingNomination = nextSeason?.nominations.find((item) => item.name.trim().toLocaleLowerCase('ru-RU') === sourceNomination?.name.trim().toLocaleLowerCase('ru-RU'))
    setTargetSeasonId(seasonId)
    setNominationId(matchingNomination?.id ?? nextSeason?.nominations[0]?.id ?? '')
  }

  return <ValidatedForm onSubmit={() => { if (targetSeasonId && nominationId && !dateError) onSave(targetSeasonId, nominationId, softStart, softEnd) }}>
    <div className="move-project-summary"><strong>{project.title}</strong><span>{sourceSeason?.name ?? 'Текущий сезон'} → {targetSeason?.name ?? 'Выбери сезон'}</span></div>
    {!targetSeasons.length ? <div className="move-project-empty">Для переноса сначала создай ещё один сезон.</div> : <>
      <label>Новый сезон<select required value={targetSeasonId} onChange={(event) => changeTargetSeason(event.target.value)}>{targetSeasons.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label>Новый левел<select required disabled={!targetSeason?.nominations.length} value={nominationId} onChange={(event) => setNominationId(event.target.value)}>{targetSeason?.nominations.length ? targetSeason.nominations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>) : <option value="">Сначала добавь левел</option>}</select>{targetSeason && !targetSeason.nominations.length && <small>В выбранном сезоне пока нет левелов.</small>}</label>
    <div className="form-row"><label>План начать<input required type="date" max={hardDeadline || undefined} value={softStart} onChange={(event) => setSoftStart(event.target.value)} /></label><label>Софт-дедлайн<input type="date" value={softEnd} min={softStart} max={hardDeadline || undefined} onChange={(event) => setSoftEnd(event.target.value)} /></label></div>
      {hardDeadline && <div className="deadline-hint">Хард-дедлайн нового левела: <b>{formatDate(hardDeadline)}</b></div>}
      {dateError && <div className="field-error">Софт-дедлайн должен быть не раньше начала и не позже дедлайна нового левела.</div>}
    </>}
    <p className="move-project-preserve">Этап, рейтинг, цель по объёму и записи прогресса сохранятся.</p>
    <div className="form-actions"><button type="submit" className="button primary" disabled={!targetSeasons.length || !targetSeason?.nominations.length || !nominationId || dateError}>Перенести работу</button></div>
  </ValidatedForm>
}

export function LogForm({ project, onSave }: { project: Project; onSave: (amount: number) => void }) {
  const [amount, setAmount] = useState('')
  const done = project.logs.reduce((sum, log) => sum + log.amount, 0)
  return <ValidatedForm onSubmit={() => { if (Number(amount) > 0) onSave(Number(amount)) }}><p className="log-project-name">{project.title}</p><label>Сколько слов написано сегодня?<input autoFocus required type="number" min="1" step="1" placeholder="Например, 350" value={amount} onChange={(event) => setAmount(event.target.value)} /></label><div className="log-summary">Уже есть <b>{done.toLocaleString('ru-RU')}</b> из <b>{project.targetWords.toLocaleString('ru-RU')}</b> слов</div><div className="form-actions"><button type="submit" className="button primary">Записать прогресс</button></div></ValidatedForm>
}

