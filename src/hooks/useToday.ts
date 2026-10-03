import { useEffect, useState } from 'react'
import { todayIso } from '../lib/dates'

/** Today's date (`YYYY-MM-DD`); updates when the day changes. */
export function useToday(): string {
  const [today, setToday] = useState(todayIso)
  useEffect(() => {
    const update = () => setToday(todayIso())
    const interval = setInterval(update, 60_000)
    document.addEventListener('visibilitychange', update)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', update)
    }
  }, [])
  return today
}
