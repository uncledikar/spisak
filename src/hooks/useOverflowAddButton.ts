import { useEffect, useRef, useState } from 'react'

/** Show second "add" control only when list items don't fully fit in the viewport. */
export function useOverflowAddButton(deps: unknown[] = []) {
  const itemsRef = useRef<HTMLDivElement>(null)
  const [showBottom, setShowBottom] = useState(false)

  useEffect(() => {
    const el = itemsRef.current

    function measure() {
      const node = itemsRef.current
      if (!node || node.childElementCount === 0) {
        setShowBottom(false)
        return
      }
      const rect = node.getBoundingClientRect()
      const spaceBelowTop = window.innerHeight - rect.top
      setShowBottom(node.scrollHeight > spaceBelowTop + 8)
    }

    measure()
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, { passive: true })
    const ro = new ResizeObserver(measure)
    if (el) ro.observe(el)
    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure)
      ro.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { itemsRef, showBottomAdd: showBottom }
}
