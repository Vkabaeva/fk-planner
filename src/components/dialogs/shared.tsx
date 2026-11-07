import { createContext, useContext, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import type { ConfirmationRequest } from '../../domain/types'
import TrashIcon from '../TrashIcon'

const FormDirtyContext = createContext<(dirty: boolean) => void>(() => undefined)

export function ValidatedForm({ onSubmit, children }: { onSubmit: (event: FormEvent<HTMLFormElement>) => void; children: ReactNode }) {
  const [attempted, setAttempted] = useState(false)
  const [dirty, setDirty] = useState(false)
  const reportDirty = useContext(FormDirtyContext)
  const className = [attempted && 'validation-attempted', dirty && 'form-dirty'].filter(Boolean).join(' ')
  return <form noValidate className={className} onInput={() => { setDirty(true); reportDirty(true) }} onChange={() => { setDirty(true); reportDirty(true) }} onSubmit={(event) => {
    event.preventDefault()
    setAttempted(true)
    const requiredFields = event.currentTarget.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(':required')
    if (Array.from(requiredFields).every((field) => field.validity.valid)) onSubmit(event)
  }}>{children}</form>
}

export function Dialog({ title, onClose, children, confirmDiscard = false }: { title: string; onClose: () => void; children: ReactNode; confirmDiscard?: boolean }) {
  const [discardPromptOpen, setDiscardPromptOpen] = useState(false)
  const [hasUnsavedInput, setHasUnsavedInput] = useState(false)
  useEffect(() => {
    if (!discardPromptOpen) return
    const closePromptOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setDiscardPromptOpen(false) }
    window.addEventListener('keydown', closePromptOnEscape)
    return () => window.removeEventListener('keydown', closePromptOnEscape)
  }, [discardPromptOpen])

  const requestClose = () => {
    if (confirmDiscard && hasUnsavedInput) setDiscardPromptOpen(true)
    else onClose()
  }

  return <>
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) requestClose() }}><section className="modal"><div className="modal-heading"><div><span className="eyebrow">FK PLANNER</span><h2>{title}</h2></div><button className="close-button" aria-label="Закрыть окно" onClick={requestClose}>×</button></div><FormDirtyContext.Provider value={setHasUnsavedInput}>{children}</FormDirtyContext.Provider></section></div>
    {discardPromptOpen && <div className="modal-backdrop confirm-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setDiscardPromptOpen(false) }}>
      <section className="modal confirmation-modal discard-modal" role="alertdialog" aria-modal="true" aria-labelledby="discard-title" aria-describedby="discard-message">
        <div className="modal-heading"><div><span className="eyebrow">НЕСОХРАНЁННЫЕ ДАННЫЕ</span><h2 id="discard-title">Закрыть без сохранения?</h2></div><button className="close-button" aria-label="Продолжить заполнение" onClick={() => setDiscardPromptOpen(false)}>×</button></div>
        <p className="discard-message" id="discard-message">Введённые данные пропадут, если закрыть окно.</p>
        <div className="form-actions confirmation-actions"><button type="button" className="button outline" autoFocus onClick={() => setDiscardPromptOpen(false)}>Продолжить заполнение</button><button type="button" className="button danger" onClick={onClose}>Закрыть без сохранения</button></div>
      </section>
    </div>}
  </>
}

export function DeleteConfirmationDialog({ request, onCancel, onConfirm }: { request: ConfirmationRequest; onCancel: () => void; onConfirm: () => void }) {
  return <div className="modal-backdrop confirm-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel() }}>
    <section className="modal confirmation-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-confirmation-title" aria-describedby="delete-confirmation-message">
      <div className="modal-heading"><div><span className="eyebrow">ПОДТВЕРЖДЕНИЕ УДАЛЕНИЯ</span><h2 id="delete-confirmation-title">{request.title}</h2></div><button className="close-button" aria-label="Отмена" onClick={onCancel}>×</button></div>
      <div className="confirmation-body"><span className="confirmation-icon"><TrashIcon /></span><p id="delete-confirmation-message">{request.message}</p></div>
      <div className="form-actions confirmation-actions"><button type="button" className="button outline" autoFocus onClick={onCancel}>Отмена</button><button type="button" className="button danger" onClick={onConfirm}>{request.confirmLabel}</button></div>
    </section>
  </div>
}

