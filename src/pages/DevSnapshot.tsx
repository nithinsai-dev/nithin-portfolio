import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import {
  createPersistentSolidShardsGeometry,
  createWireShardsGeometry,
  getCoinBodyGeometry,
  getCoinEdgesGeometry,
  getCoinGlowTexture,
} from '../utils/shardData'
import CoinSymbol from '../components/CoinSymbol'

// Fixed pose constants
const SHELL_ROTATION: [number, number, number] = [0.08, -0.35, 0] // x = 0.08, y = -0.35
const COIN_ROTATION: [number, number, number] = [0, (35 * Math.PI) / 180, 0] // ~35 deg visible through opening
const OBJECT_SCALE = 1.45

function SolidSnapshotScene() {
  const dynamicShards = useMemo(() => createPersistentSolidShardsGeometry(), [])
  const coinBodyGeo = useMemo(() => getCoinBodyGeometry(), [])
  const glowTexture = useMemo(() => getCoinGlowTexture(), [])

  useEffect(() => {
    return () => {
      dynamicShards.geometry.dispose()
    }
  }, [dynamicShards])

  return (
    <group scale={[OBJECT_SCALE, OBJECT_SCALE, OBJECT_SCALE]}>
      {/* Shell in fixed pose */}
      <group rotation={SHELL_ROTATION}>
        <mesh geometry={dynamicShards.geometry}>
          <meshStandardMaterial
            vertexColors={true}
            roughness={0.9}
            metalness={0}
            flatShading={true}
            transparent={true}
            opacity={1.0}
          />
        </mesh>
      </group>

      {/* Coin rotated ~35 deg */}
      <group rotation={COIN_ROTATION}>
        <mesh geometry={coinBodyGeo}>
          <meshStandardMaterial
            color="#F2C14E"
            roughness={0.45}
            metalness={0.25}
            emissive="#F2C14E"
            emissiveIntensity={0.12}
          />
        </mesh>

        <CoinSymbol variant="solid" />

        <pointLight
          position={[0, 0, 0]}
          color="#F2C14E"
          intensity={2.6}
          distance={4.5}
          decay={2}
        />

        {glowTexture && (
          <sprite scale={[2.5, 2.5, 1]} position={[0, 0, 0]}>
            <spriteMaterial
              map={glowTexture}
              transparent={true}
              opacity={0.65}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </sprite>
        )}
      </group>
    </group>
  )
}

function WireSnapshotScene() {
  const wireShards = useMemo(() => createWireShardsGeometry(0.12), [])
  const coinEdges = useMemo(() => getCoinEdgesGeometry(), [])
  const glowTexture = useMemo(() => getCoinGlowTexture(), [])

  useEffect(() => {
    return () => {
      wireShards.linesGeo.dispose()
      wireShards.dotsGeo.dispose()
    }
  }, [wireShards])

  return (
    <group scale={[OBJECT_SCALE, OBJECT_SCALE, OBJECT_SCALE]}>
      {/* Wire Shell in fixed pose */}
      <group rotation={SHELL_ROTATION}>
        <lineSegments geometry={wireShards.linesGeo}>
          <lineBasicMaterial
            color="#E8DDD3"
            transparent
            opacity={0.30}
            depthWrite={false}
          />
        </lineSegments>
        <points geometry={wireShards.dotsGeo}>
          <pointsMaterial
            color="#F2C14E"
            size={0.03}
            transparent
            opacity={0.75}
            depthWrite={false}
          />
        </points>
      </group>

      {/* Wire Coin rotated ~35 deg */}
      <group rotation={COIN_ROTATION}>
        {glowTexture && (
          <sprite scale={[1.15, 1.15, 1]} position={[0, 0, -0.06]}>
            <spriteMaterial
              map={glowTexture}
              transparent
              opacity={0.85}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </sprite>
        )}

        <lineSegments geometry={coinEdges}>
          <lineBasicMaterial
            color="#E8DDD3"
            transparent
            opacity={0.5}
            depthWrite={false}
          />
        </lineSegments>

        <CoinSymbol variant="breaker" />
      </group>
    </group>
  )
}

export default function DevSnapshot() {
  const [status, setStatus] = useState<string>('Ready')
  const autoCaptured = useRef(false)

  const downloadCanvas = (canvasId: string, filename: string) => {
    const container = document.getElementById(canvasId)
    const canvas = container?.querySelector('canvas')
    if (!canvas) {
      setStatus(`Error: Canvas ${canvasId} not found`)
      return
    }

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setStatus(`Error: Failed to export blob for ${filename}`)
          return
        }
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        a.click()
        URL.revokeObjectURL(url)
        setStatus(`Saved ${filename} (${(blob.size / 1024).toFixed(1)} KB)`)
      },
      'image/webp',
      0.88
    )
  }

  // Automatic capture when ?auto=1 is in URL
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (!params.get('auto') || autoCaptured.current) return
    autoCaptured.current = true

    setStatus('Capturing snapshots automatically...')
    const timer = setTimeout(async () => {
      try {
        const solidCanvas = document.querySelector('#solid-canvas canvas') as HTMLCanvasElement
        const wireCanvas = document.querySelector('#wire-canvas canvas') as HTMLCanvasElement

        if (!solidCanvas || !wireCanvas) {
          setStatus('Canvases not ready')
          return
        }

        const solidData = solidCanvas.toDataURL('image/webp', 0.88)
        const wireData = wireCanvas.toDataURL('image/webp', 0.88)

        const r1 = await fetch('/__save_hero_snapshot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: 'hero-solid.webp', data: solidData }),
        })
        const res1 = await r1.json()

        const r2 = await fetch('/__save_hero_snapshot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: 'hero-wire.webp', data: wireData }),
        })
        const res2 = await r2.json()

        setStatus(
          `Auto-capture successful! Solid: ${(res1.size / 1024).toFixed(1)} KB, Wire: ${(
            res2.size / 1024
          ).toFixed(1)} KB`
        )
      } catch (err: unknown) {
        setStatus(`Auto-capture error: ${String(err)}`)
      }
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen bg-[#0a0707] text-[#E8DDD3] p-8 font-mono">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-[#F2C14E]">/dev/snapshot — Hero Object Pre-renderer</h1>
          <p className="text-xs text-[#E8DDD3]/60 mt-1">
            Renders 1000x1000 transparent WebP snapshots of the real 3D solid and wire objects.
          </p>
          <p className="text-xs text-[#F2C14E] mt-2">Status: {status}</p>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => downloadCanvas('solid-canvas', 'hero-solid.webp')}
            className="px-4 py-2 bg-[#F2C14E] text-[#140C0D] font-bold rounded hover:opacity-90 transition-opacity cursor-pointer text-sm"
          >
            download solid
          </button>
          <button
            onClick={() => downloadCanvas('wire-canvas', 'hero-wire.webp')}
            className="px-4 py-2 bg-[#E8DDD3] text-[#140C0D] font-bold rounded hover:opacity-90 transition-opacity cursor-pointer text-sm"
          >
            download wire
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Solid Canvas */}
          <div className="flex flex-col items-center">
            <span className="text-xs text-[#E8DDD3]/70 mb-2">hero-solid.webp (1000x1000)</span>
            <div
              id="solid-canvas"
              className="w-[500px] h-[500px] border border-[#E8DDD3]/20 bg-transparent rounded shadow-lg overflow-hidden"
              style={{
                backgroundImage:
                  'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)',
                backgroundSize: '16px 16px',
              }}
            >
              <Canvas
                dpr={1}
                camera={{ position: [0, 0, 5.5], fov: 45 }}
                gl={{
                  alpha: true,
                  antialias: true,
                  preserveDrawingBuffer: true,
                  toneMapping: THREE.ACESFilmicToneMapping,
                  toneMappingExposure: 0.9,
                }}
                onCreated={({ gl }) => {
                  gl.setClearColor(0x000000, 0)
                }}
                style={{ width: '1000px', height: '1000px', transform: 'scale(0.5)', transformOrigin: 'top left' }}
              >
                <ambientLight intensity={0.65} color="#E8DDD3" />
                <directionalLight position={[3, 4, 4]} intensity={0.8} color="#E8DDD3" />
                <directionalLight position={[-4, 2, -3]} intensity={1.2} color="#F2C14E" />
                <SolidSnapshotScene />
              </Canvas>
            </div>
          </div>

          {/* Wire Canvas */}
          <div className="flex flex-col items-center">
            <span className="text-xs text-[#E8DDD3]/70 mb-2">hero-wire.webp (1000x1000)</span>
            <div
              id="wire-canvas"
              className="w-[500px] h-[500px] border border-[#E8DDD3]/20 bg-transparent rounded shadow-lg overflow-hidden"
              style={{
                backgroundImage:
                  'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)',
                backgroundSize: '16px 16px',
              }}
            >
              <Canvas
                dpr={1}
                camera={{ position: [0, 0, 5.5], fov: 45 }}
                gl={{
                  alpha: true,
                  antialias: true,
                  preserveDrawingBuffer: true,
                }}
                onCreated={({ gl }) => {
                  gl.setClearColor(0x000000, 0)
                }}
                style={{ width: '1000px', height: '1000px', transform: 'scale(0.5)', transformOrigin: 'top left' }}
              >
                <ambientLight intensity={1.5} color="#FFFFFF" />
                <WireSnapshotScene />
              </Canvas>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
