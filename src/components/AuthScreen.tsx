import { useState, type FormEvent } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { APP_CONFIG } from '../config/appConfig'

type Props = { supabase: SupabaseClient }

export default function AuthScreen({ supabase }: Props) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    setError('')
    try {
      if (mode === 'signin') {
        const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (authError) throw authError
      } else {
        const { data, error: authError } = await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: window.location.origin } })
        if (authError) throw authError
        if (!data.session) setMessage('Проверь почту: отправили письмо для подтверждения регистрации.')
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось выполнить вход. Попробуй ещё раз.')
    } finally { setBusy(false) }
  }

  const resetPassword = async () => {
    if (!email.trim()) { setError('Сначала введи адрес электронной почты.'); return }
    setBusy(true)
    setMessage('')
    setError('')
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin })
    if (resetError) setError(resetError.message)
    else setMessage('Если для этого адреса есть аккаунт, письмо для сброса пароля уже отправлено.')
    setBusy(false)
  }

  return <main className="auth-page">
    <section className="auth-card">
      <div className="auth-brand"><div className="brand-mark">fk</div><div><strong>fk planner</strong><span>Твоя мастерская ФБ</span></div></div>
      <div className="eyebrow">ЛИЧНОЕ ПРОСТРАНСТВО</div>
      <h1>{mode === 'signin' ? 'С возвращением' : 'Создать аккаунт'}</h1>
      <p className="auth-description">Сезоны, работы и заметки будут доступны после входа с любого устройства.</p>
      <div className="auth-mode-switch"><button type="button" className={mode === 'signin' ? 'active' : ''} onClick={() => { setMode('signin'); setError(''); setMessage('') }}>Войти</button><button type="button" className={mode === 'signup' ? 'active' : ''} onClick={() => { setMode('signup'); setError(''); setMessage('') }}>Регистрация</button></div>
      <form onSubmit={submit}>
        <label>Email<input autoComplete="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" /></label>
        <label>Пароль<input autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} type="password" required minLength={APP_CONFIG.profile.minimumPasswordLength} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={`Не меньше ${APP_CONFIG.profile.minimumPasswordLength} символов`} /></label>
        {mode === 'signin' && <button type="button" className="auth-reset" onClick={() => { void resetPassword() }} disabled={busy}>Забыли пароль?</button>}
        {error && <p className="auth-error" role="alert">{error}</p>}
        {message && <p className="auth-message" role="status">{message}</p>}
        <button type="submit" className="button primary auth-submit" disabled={busy}>{busy ? 'Подожди…' : mode === 'signin' ? 'Войти в мастерскую' : 'Создать аккаунт'}</button>
      </form>
      <p className="auth-footnote">Пароль хранится у сервиса авторизации, приложение его не сохраняет.</p>
    </section>
  </main>
}

export function PasswordRecoveryScreen({ supabase, onComplete }: Props & { onComplete: () => void }) {
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) setError(updateError.message)
    else setMessage('Пароль обновлён.')
    setBusy(false)
  }
  return <main className="auth-page"><section className="auth-card">
    <div className="auth-brand"><div className="brand-mark">fk</div><div><strong>fk planner</strong><span>Твоя мастерская ФБ</span></div></div>
    <div className="eyebrow">ВОССТАНОВЛЕНИЕ ДОСТУПА</div><h1>Новый пароль</h1><p className="auth-description">Задай пароль, чтобы снова войти в мастерскую.</p>
    {message ? <><p className="auth-message" role="status">{message}</p><button className="button primary auth-submit" onClick={onComplete}>Продолжить</button></> : <form onSubmit={(event) => { void submit(event) }}><label>Новый пароль<input autoComplete="new-password" type="password" required minLength={APP_CONFIG.profile.minimumPasswordLength} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={`Не меньше ${APP_CONFIG.profile.minimumPasswordLength} символов`} /></label>{error && <p className="auth-error" role="alert">{error}</p>}<button type="submit" className="button primary auth-submit" disabled={busy}>{busy ? 'Сохраняем…' : 'Сохранить новый пароль'}</button></form>}
  </section></main>
}
