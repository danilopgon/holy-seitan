import * as React from 'react'

export type WakeLockStatus = 'unsupported' | 'off' | 'pending' | 'on' | 'error'

// Keeps the screen awake while `enabled` is true. The browser drops the lock whenever
// the page leaves the foreground, so it is requested again when the page comes back.
export function useWakeLock(enabled: boolean) {
  const [status, setStatus] = React.useState<WakeLockStatus>('off')

  React.useEffect(() => {
    if (!('wakeLock' in navigator)) {
      setStatus('unsupported')
      return
    }
    if (!enabled) {
      setStatus('off')
      return
    }

    let sentinel: WakeLockSentinel | null = null
    let active = true

    const request = async () => {
      if (document.visibilityState !== 'visible' || sentinel) return
      setStatus('pending')
      try {
        const lock = await navigator.wakeLock.request('screen')
        if (!active) {
          await lock.release()
          return
        }
        sentinel = lock
        setStatus('on')
        lock.addEventListener('release', () => {
          sentinel = null
          if (active) setStatus('pending')
        })
      } catch {
        if (active) setStatus('error')
      }
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') void request()
    }

    void request()
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      active = false
      document.removeEventListener('visibilitychange', onVisibilityChange)
      void sentinel?.release()
      sentinel = null
    }
  }, [enabled])

  return status
}
