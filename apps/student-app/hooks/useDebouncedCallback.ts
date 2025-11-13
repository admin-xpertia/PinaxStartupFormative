import { useCallback, useEffect, useRef } from "react"

/**
 * Debounced callback hook that tracks timers per key.
 * The first argument passed to the returned function is used as the unique key.
 */
export function useDebouncedCallback<T extends any[]>(
  callback: (...args: T) => void | Promise<void>,
  delay = 300,
): [
  (...args: T) => void,
  (key?: string) => void,
] {
  const timersRef = useRef<Record<string, NodeJS.Timeout>>({})

  const debounced = useCallback(
    (...args: T) => {
      const key = String(args[0])

      if (timersRef.current[key]) {
        clearTimeout(timersRef.current[key])
      }

      timersRef.current[key] = setTimeout(() => {
        void callback(...args)
        delete timersRef.current[key]
      }, delay)
    },
    [callback, delay],
  )

  const cancel = useCallback((key?: string) => {
    if (key) {
      const timer = timersRef.current[key]
      if (timer) {
        clearTimeout(timer)
        delete timersRef.current[key]
      }
      return
    }

    Object.values(timersRef.current).forEach(clearTimeout)
    timersRef.current = {}
  }, [])

  useEffect(() => () => cancel(), [cancel])

  return [debounced, cancel]
}
