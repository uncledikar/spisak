import { useEffect, useRef, useState } from 'react'

/** Show second "add" control when the page content overflows the viewport. */
export function useOverflowAddButton(deps: unknown[] = []) {
  const itemsRef = useRef<HTMLDivElement>(null)
  const [showBottom, setShowBottom] = useState(false)

  useEffect(() => {
    const ro = new ResizeObserver(() => {
      window.requestAnimationFrame(measure)
    })

    function measure() {
      const node = itemsRef.current
      if (!node || node.childElementCount === 0) {
        setShowBottom(false)
        return
      }
      // Document scroll size stays stable while scrolling — unlike getBoundingClientRect().
      setShowBottom(document.documentElement.scrollHeight > window.innerHeight + 24)
    }

    function attach() {
      measure()
      if (itemsRef.current) ro.observe(itemsRef.current)
      ro.observe(document.documentElement)
    }

    const frame = window.requestAnimationFrame(attach)
    // Second frame: list may mount after this effect when data just arrived.
    const frame2 = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(attach)
    })
    window.addEventListener('resize', measure)

    return () => {
      window.cancelAnimationFrame(frame)
      window.cancelAnimationFrame(frame2)
      window.removeEventListener('resize', measure)
      ro.disconnect()
    }
    // Caller-provided deps (item count, layout flags, …)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { itemsRef, showBottomAdd: showBottom }
}
