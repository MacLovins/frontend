import { useEffect, useState } from "react"

/** Becomes true once the element has scrolled into view and stays true. */
export function useInView(element: Element | null) {
  const [inView, setInView] = useState(false)

  useEffect(() => {
    if (!element || inView) return
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) setInView(true)
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [element, inView])

  return inView
}
