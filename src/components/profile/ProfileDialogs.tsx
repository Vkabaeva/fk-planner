import { useState, type FormEvent } from 'react'
import { APP_CONFIG } from '../../config/appConfig'

const AVATAR_SIZE_LIMIT_MB = APP_CONFIG.profile.avatarMaxSizeBytes / 1024 / 1024
const AVATAR_ACCEPT = APP_CONFIG.profile.allowedAvatarTypes.join(',')

export function ProfileDetails({ name, email, avatarUrl }: { name: string; email?: string; avatarUrl: string }) {
  return <div className="profile-details">
    <div className="profile-details-avatar">{avatarUrl ? <img src={avatarUrl} alt="Аватар участника" /> : name.trim().slice(0, 1).toLocaleUpperCase('ru-RU') || 'У'}</div>
    <dl><div><dt>Имя участника</dt><dd>{name}</dd></div>{email && <div><dt>Электронная почта</dt><dd>{email}</dd></div>}</dl>
  </div>
}

type ProfileEditProps = {
  initialName: string
  email?: string
  avatarUrl: string
  canChangePassword: boolean
  onSave: (name: string) => Promise<void>
  onAvatarChange: (file: File) => Promise<void>
  onChangePassword: (password: string) => Promise<void>
}

export function ProfileEditForm({ initialName, email, avatarUrl, canChangePassword, onSave, onAvatarChange, onChangePassword }: ProfileEditProps) {
  const [name, setName] = useState(initialName)
  const [attempted, setAttempted] = useState(false)
  const [nameBusy, setNameBusy] = useState(false)
  const [nameError, setNameError] = useState('')
  const [avatarBusy, setAvatarBusy] = useState(false)
  const [avatarError, setAvatarError] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [passwordAttempted, setPasswordAttempted] = useState(false)
  const [passwordBusy, setPasswordBusy] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  const submitName = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAttempted(true)
    if (!name.trim()) return
    setNameBusy(true)
    setNameError('')
    try { await onSave(name.trim()) } catch (cause) { setNameError(cause instanceof Error ? cause.message : 'Не удалось сохранить профиль.') } finally { setNameBusy(false) }
  }

  const submitPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPasswordAttempted(true)
    setPasswordError('')
    if (password.length < APP_CONFIG.profile.minimumPasswordLength) { setPasswordError(`Пароль должен содержать не меньше ${APP_CONFIG.profile.minimumPasswordLength} символов.`); return }
    if (password !== passwordConfirmation) { setPasswordError('Пароли не совпадают.'); return }
    setPasswordBusy(true)
    try { await onChangePassword(password); setPassword(''); setPasswordConfirmation(''); setPasswordAttempted(false) } catch (cause) { setPasswordError(cause instanceof Error ? cause.message : 'Не удалось обновить пароль.') } finally { setPasswordBusy(false) }
  }

  const uploadAvatar = async (file?: File) => {
    if (!file) return
    setAvatarError('')
    setAvatarBusy(true)
    try { await onAvatarChange(file) } catch (cause) { setAvatarError(cause instanceof Error ? cause.message : 'Не удалось загрузить изображение.') } finally { setAvatarBusy(false) }
  }

  return <div className="profile-editor">
    <section className="profile-editor-section profile-avatar-section">
      <div className="profile-details-avatar">{avatarUrl ? <img src={avatarUrl} alt="Аватар участника" /> : name.trim().slice(0, 1).toLocaleUpperCase('ru-RU') || 'У'}</div>
      <div><strong>Аватар</strong><p>Изображение JPEG, PNG, GIF, WebP или AVIF, до {AVATAR_SIZE_LIMIT_MB} МБ.</p><label className="button outline profile-upload-button">{avatarBusy ? 'Загружаем…' : 'Загрузить изображение'}<input type="file" accept={AVATAR_ACCEPT} disabled={avatarBusy} onChange={(event) => { void uploadAvatar(event.target.files?.[0]); event.currentTarget.value = '' }} /></label>{avatarError && <p className="auth-error" role="alert">{avatarError}</p>}</div>
    </section>
    <form noValidate className={`${attempted ? 'validation-attempted ' : ''}${name !== initialName ? 'form-dirty' : ''}`} onSubmit={(event) => { void submitName(event) }}>
      <label>Имя участника<input autoFocus required maxLength={80} value={name} onChange={(event) => setName(event.target.value)} placeholder="Как тебя называть?" /></label>
      {email && <p className="profile-email-note">Аккаунт: {email}</p>}
      {nameError && <p className="auth-error" role="alert">{nameError}</p>}
      <div className="form-actions"><button type="submit" className="button primary" disabled={nameBusy}>{nameBusy ? 'Сохраняем…' : 'Сохранить имя'}</button></div>
    </form>
    {canChangePassword && <form noValidate className={`profile-password-form ${passwordAttempted ? 'validation-attempted ' : ''}${passwordAttempted || password || passwordConfirmation ? 'form-dirty' : ''}`} onSubmit={(event) => { void submitPassword(event) }}>
      <h3>Сменить пароль</h3>
      <label>Новый пароль<input required minLength={APP_CONFIG.profile.minimumPasswordLength} autoComplete="new-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder={`Не меньше ${APP_CONFIG.profile.minimumPasswordLength} символов`} /></label>
      <label>Повтори новый пароль<input required minLength={APP_CONFIG.profile.minimumPasswordLength} autoComplete="new-password" type="password" value={passwordConfirmation} aria-invalid={passwordAttempted && passwordConfirmation !== password} onChange={(event) => setPasswordConfirmation(event.target.value)} /></label>
      {passwordError && <p className="auth-error" role="alert">{passwordError}</p>}
      <div className="form-actions"><button type="submit" className="button outline" disabled={passwordBusy}>{passwordBusy ? 'Обновляем…' : 'Обновить пароль'}</button></div>
    </form>}
  </div>
}
