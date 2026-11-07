import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import type { User } from '@supabase/supabase-js'
import { APP_CONFIG } from '../config/appConfig'
import { loadProjectImage, saveProjectImage } from '../data/projectImages'
import { supabase } from '../data/supabaseClient'

function participantName(user: User | null, fallback: string) {
  for (const field of ['display_name', 'full_name', 'name']) {
    const value: unknown = user?.user_metadata?.[field]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return user?.email?.split('@')[0] || fallback
}

export function useProfile(user: User | null, setUser: Dispatch<SetStateAction<User | null>>, notify: (message: string) => void) {
  const [localName, setLocalName] = useState(() => localStorage.getItem(APP_CONFIG.storage.profileNameKey)?.trim() || 'Участник')
  const [avatarData, setAvatarData] = useState<{ userId?: string; image: Blob | null } | null>(null)
  const [avatarUrlData, setAvatarUrlData] = useState<{ image: Blob; url: string } | null>(null)
  const avatar = avatarData && avatarData.userId === user?.id ? avatarData.image : null
  const avatarUrl = avatar && avatarUrlData?.image === avatar ? avatarUrlData.url : ''
  const name = participantName(user, localName)
  const initials = name.split(/\s+/).slice(0, 2).map((part) => Array.from(part)[0] ?? '').join('').toLocaleUpperCase('ru-RU') || 'У'

  useEffect(() => {
    let active = true
    void loadProjectImage(APP_CONFIG.storage.profileAvatarId, user?.id)
      .then((image) => { if (active) setAvatarData({ userId: user?.id, image: image ?? null }) })
      .catch(() => { if (active) setAvatarData({ userId: user?.id, image: null }) })
    return () => { active = false }
  }, [user?.id])

  useEffect(() => {
    if (!avatar) return
    const url = URL.createObjectURL(avatar)
    const frame = window.requestAnimationFrame(() => setAvatarUrlData({ image: avatar, url }))
    return () => { window.cancelAnimationFrame(frame); URL.revokeObjectURL(url) }
  }, [avatar])

  const saveName = async (nextName: string) => {
    if (supabase && user) {
      const { data, error } = await supabase.auth.updateUser({ data: { display_name: nextName } })
      if (error) throw error
      if (data.user) setUser(data.user)
    } else {
      localStorage.setItem(APP_CONFIG.storage.profileNameKey, nextName)
      setLocalName(nextName)
    }
    notify('Профиль обновлён')
  }

  const uploadAvatar = async (file: File) => {
    if (!APP_CONFIG.profile.allowedAvatarTypes.some((type) => type === file.type)) {
      throw new Error('Выбери изображение в формате JPEG, PNG, GIF, WebP или AVIF.')
    }
    if (file.size > APP_CONFIG.profile.avatarMaxSizeBytes) {
      const sizeLimitMb = APP_CONFIG.profile.avatarMaxSizeBytes / 1024 / 1024
      throw new Error(`Размер изображения не должен превышать ${sizeLimitMb} МБ.`)
    }
    await saveProjectImage(APP_CONFIG.storage.profileAvatarId, file, user?.id)
    setAvatarData({ userId: user?.id, image: file })
    notify('Аватарка обновлена')
  }

  const changePassword = async (password: string) => {
    if (!supabase || !user) throw new Error('Смена пароля доступна после входа в аккаунт.')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw error
    notify('Пароль обновлён')
  }

  return { name, initials, avatarUrl, saveName, uploadAvatar, changePassword, canChangePassword: Boolean(supabase && user) }
}
