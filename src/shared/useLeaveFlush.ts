import { useEffect, useRef } from 'react'

/** Run once when the game page unmounts (X / leave). */
export function useLeaveFlush(fn: () => void) {
  const ref = useRef(fn)
  ref.current = fn
  useEffect(() => () => { ref.current() }, [])
}
