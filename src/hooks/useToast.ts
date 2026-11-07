import { useCallback, useEffect, useRef, useState } from 'react'
import { APP_CONFIG } from '../config/appConfig'

export function useToast() {
  const [message, setMessage] = useState('')
  const timeout = useRef<number | undefined>(undefined)

  const notify = useCallback((nextMessage: string) => {
    setMessage(nextMessage)
    if (timeout.current !== undefined) window.clearTimeout(timeout.current)
    timeout.current = window.setTimeout(() => setMessage(''), APP_CONFIG.persistence.toastDurationMs)
  }, [])

  useEffect(() => () => {
    if (timeout.current !== undefined) window.clearTimeout(timeout.current)
  }, [])

  return { toast: message, notify }
}
