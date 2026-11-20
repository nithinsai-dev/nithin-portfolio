import React, { useRef, useEffect, useState, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function StaticSvgWireframe() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none opacity-20"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1000 800"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <pattern id="grid-pattern" width="80" height="80" patternUnits="userSpaceOnUse">
          <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#E8DDD3" strokeWidth="0.7" opacity="0.3" />
          <path d="M 0 0 L 80 80" fill="none" stroke="#E8DDD3" strokeWidth="0.5" opacity="0.18" />
          <circle cx="0" cy="0" r="1.5" fill="#F2C14E" opacity="0.6" />
          <circle cx="80" cy="80" r="1.5" fill="#F2C14E" opacity="0.4" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid-pattern)" />
    </svg>
  )
}

function MeshScene({ mouseRef }: { mouseRef: React.RefObject<{ x: number; y: number }> }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const pointsRef = useRef<THREE.Points>(null)

  // Low-poly plane geometry with wave vertex displacement
  const { geometry, originalPositions } = useMemo(() => {
    const geo = new THREE.PlaneGeometry(12, 10, 24, 20)
    const pos = geo.attributes.position.array as Float32Array
    const orig = new Float32Array(pos.length)
    orig.set(pos)
    return { geometry: geo, originalPositions: orig }
  }, [])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * 0.4
    const m = mouseRef.current || { x: 0, y: 0 }
    if (meshRef.current) {
      // Gentle tilt toward cursor
      meshRef.current.rotation.x = -0.4 + m.y * 0.15 + Math.sin(t * 0.5) * 0.05
      meshRef.current.rotation.y = m.x * 0.2 + Math.cos(t * 0.4) * 0.05
      meshRef.current.rotation.z = Math.sin(t * 0.3) * 0.02

      // Wave displacement
      const pos = geometry.attributes.position.array as Float32Array
      for (let i = 0; i < pos.length; i += 3) {
        const u = originalPositions[i]
        const v = originalPositions[i + 1]
        pos[i + 2] =
          Math.sin(u * 0.6 + t) * 0.45 +
          Math.cos(v * 0.8 + t * 0.8) * 0.35 +
          Math.sin((u + v) * 0.4 + t * 0.5) * 0.25
      }
      geometry.attributes.position.needsUpdate = true
    }

    if (pointsRef.current && meshRef.current) {
      pointsRef.current.rotation.copy(meshRef.current.rotation)
    }
  })

  return (
    <group position={[0, -0.5, 0]}>
      {/* Wireframe Mesh in Sand color */}
      <mesh ref={meshRef} geometry={geometry}>
        <meshBasicMaterial
          color="#E8DDD3"
          wireframe
          transparent
          opacity={0.16}
          depthWrite={false}
        />
      </mesh>

      {/* Accents points in warm yellow */}
      <points ref={pointsRef} geometry={geometry}>
        <pointsMaterial
          color="#F2C14E"
          size={0.035}
          transparent
          opacity={0.35}
          depthWrite={false}
        />
      </points>
    </group>
  )
}

export default function WireframeBackground() {
  const [isTabVisible, setIsTabVisible] = useState(true)
  const [isSupported, setIsSupported] = useState(true)
  const mouseRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    // Check reduced motion or small mobile screens or lack of WebGL
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isMobile = window.innerWidth < 640

    if (prefersReducedMotion || isMobile) {
      setIsSupported(false)
      return
    }

    // Visibility change handler to pause render
    const handleVisibility = () => {
      setIsTabVisible(!document.hidden)
    }
    document.addEventListener('visibilitychange', handleVisibility)

    // Cursor tracking for subtle tilt without triggering React re-renders
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1
    }
    window.addEventListener('mousemove', handleMouseMove, { passive: true })

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  if (!isSupported) {
    return <StaticSvgWireframe />
  }

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden z-0" aria-hidden="true">
      <Canvas
        dpr={[1, 1.5]}
        frameloop={isTabVisible ? 'always' : 'never'}
        camera={{ position: [0, 0, 6], fov: 45 }}
        gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
        style={{ pointerEvents: 'none' }}
      >
        <MeshScene mouseRef={mouseRef} />
      </Canvas>
    </div>
  )
}
