import * as React from "react"

export function useSize(ref) {
  const [size, setSize] = React.useState(null)

  React.useLayoutEffect(() => {
    if (!ref.current) return

    const observer = new ResizeObserver(([entry]) => {
      if (entry) {
        const { width, height } = entry.contentRect
        setSize({ width, height })
      }
    })

    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [ref])

  return size
}
