import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import ScrollHandler from './components/ScrollHandler'
import CustomCursor from './components/CustomCursor'
import Debug3DOverlay from './components/Debug3DOverlay'
import SiteNav from './components/SiteNav'
import PageTransition from './components/PageTransition'
import { useDeviceCapabilities } from './hooks/useDeviceCapabilities'

const Home = lazy(() => import('./pages/Home'))
const Projects = lazy(() => import('./pages/Projects'))
// Dev-only snapshot route: excluded from production bundle
const DevSnapshot = import.meta.env.DEV ? lazy(() => import('./pages/DevSnapshot')) : null

export default function App() {
  const { canRun3D } = useDeviceCapabilities()

  return (
    <>
      {/* Accessible Skip Link - First focusable element on every page */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#F2C14E] focus:text-[#140C0D] focus:font-mono focus:text-sm focus:rounded focus:outline-none focus:ring-2 focus:ring-[#140C0D] focus:shadow-lg"
      >
        Skip to content
      </a>

      {/* Global Top Navbar (<header> landmark) */}
      <SiteNav />

      {/* Custom Cursor & Gold Glow Light: Mounted ONLY on capable desktop devices */}
      {canRun3D && <CustomCursor />}

      {/* Debug 3D Badge & Console Logger (?debug3d=1 only) */}
      <Debug3DOverlay />

      <ScrollHandler />

      {/* Lazy Routes with minimal dark fallback of the exact background color */}
      <Suspense fallback={<div className="min-h-screen bg-[#140C0D]" />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/projects" element={<Projects />} />
          {/* Dev-only route for hero object snapshots - never mounted or reachable in production */}
          {import.meta.env.DEV && DevSnapshot && (
            <Route path="/dev/snapshot" element={<DevSnapshot />} />
          )}
          <Route path="*" element={<Home />} />
        </Routes>
      </Suspense>

      {/* Five-Column Curtain Page Transition */}
      <PageTransition />
    </>
  )
}
