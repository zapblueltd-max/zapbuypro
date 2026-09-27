import { useEffect, useState } from 'react'

/** Charts draw to a canvas, which does not exist during server rendering.
 *  Components use this to hold a skeleton until the first client paint. */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted
}
