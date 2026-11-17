import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

export default function ScrollHandler() {
  const { pathname } = useLocation()
  const prevPathRef = useRef(pathname)

  useEffect(() => {
    if (prevPathRef.current !== pathname) {
      prevPathRef.current = pathname
      if (pathname === '/projects') {
        window.scrollTo(0, 0)
      }
    }
  }, [pathname])

  return null
}
