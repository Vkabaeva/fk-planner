import { useEffect, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { APP_CONFIG } from '../config/appConfig'

export function useSidebarWidth() {
  const [width, setWidth] = useState(() => {
    const saved = Number(localStorage.getItem(APP_CONFIG.storage.sidebarWidthKey))
    return Number.isFinite(saved) && saved >= APP_CONFIG.sidebar.minWidth && saved <= APP_CONFIG.sidebar.maxWidth
      ? saved
      : APP_CONFIG.sidebar.defaultWidth
  })

  useEffect(() => { localStorage.setItem(APP_CONFIG.storage.sidebarWidthKey, String(width)) }, [width])

  const beginResize = (event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const moveResize = (event: PointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
    setWidth(Math.max(APP_CONFIG.sidebar.minWidth, Math.min(APP_CONFIG.sidebar.maxWidth, Math.round(event.clientX))))
  }

  const resizeWithKeyboard = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    setWidth((current) => Math.max(APP_CONFIG.sidebar.minWidth, Math.min(APP_CONFIG.sidebar.maxWidth, current + (event.key === 'ArrowRight' ? APP_CONFIG.sidebar.resizeStep : -APP_CONFIG.sidebar.resizeStep))))
  }

  return { width, beginResize, moveResize, resizeWithKeyboard }
}
