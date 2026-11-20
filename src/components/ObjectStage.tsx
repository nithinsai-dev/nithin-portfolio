import { useRef, useEffect, useState, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { testWebGL } from '../hooks/useDeviceCapabilities'
import {
  getObjectState,
  getSmoothedNormMouse,
  subscribeObjectMotion,
  subscribe3DPause,
} from '../hooks/useObjectMotion'
import { getHeroState } from '../store/heroStore'
import {
  createPersistentSolidShardsGeometry,
  createWireShardsGeometry,
  getCoinBodyGeometry,
  getCoinEdgesGeometry,
  getCoinGlowTexture,
} from '../utils/shardData'
import CoinSymbol from './CoinSymbol'
import JourneyPath from './about/JourneyPath'
import StationCluster from './about/StationCluster'
import { STATIONS_CONFIG } from '../lib/journeyPath'

// Dynamic cursor point light for solid scene
function StageCursorLight() {
  const lightRef = useRef<THREE.PointLight>(null)
  const { viewport } = useThree()

  useFrame(() => {
    if (lightRef.current) {
      const { normX, normY } = getSmoothedNormMouse()
      const sceneX = (normX * viewport.width) / 2
      const sceneY = (normY * viewport.height) / 2
      lightRef.current.position.set(sceneX, sceneY, 1.8)
    }
  })

  return (
    <pointLight
      ref={lightRef}
      color="#F2C14E"
      intensity={0.95}
      distance={7}
      decay={2}
    />
  )
}

// Persistent Solid Shard-Sphere + Gold Coin + Journey Path
function SolidStageObject() {
  const rootRef = useRef<THREE.Group>(null)
  const worldRef = useRef<THREE.Group>(null)
  const shellRef = useRef<THREE.Group>(null)
  const shardsMatRef = useRef<THREE.MeshStandardMaterial>(null)
  const coinRef = useRef<THREE.Group>(null)
  const coreLightRef = useRef<THREE.PointLight>(null)
  const { viewport } = useThree()

  // Persistent dynamic shards geometry with blast & drift & station clustering
  const dynamicShards = useMemo(() => {
    return createPersistentSolidShardsGeometry()
  }, [])

  const coinBodyGeo = useMemo(() => getCoinBodyGeometry(), [])
  const glowTexture = useMemo(() => getCoinGlowTexture(), [])

  useEffect(() => {
    return () => {
      dynamicShards.geometry.dispose()
    }
  }, [dynamicShards])

  useFrame(() => {
    const s = getObjectState()

    const spread = s.spread < 0.001 ? 0 : Math.min(1.0, Math.max(0, s.spread))
    const blast = s.blast < 0.001 ? 0 : Math.min(1.0, Math.max(0, s.blast))
    const journeyProgress = s.journeyProgress < 0.001 ? 0 : Math.min(1.0, Math.max(0, s.journeyProgress))
    const T = s.contactTransition < 0.001 ? 0 : Math.min(1.0, Math.max(0, s.contactTransition))

    // 1. Update shard positions (spread, blast distance, drift, station clustering)
    // No reassembly: shards keep their scattered field positions with slow drift only
    dynamicShards.update(spread, blast, s.driftTime, journeyProgress)

    // Shards fade out over the end transition (opacity to 0, slow drift only)
    const shardsOpacity = Math.max(0, 1.0 - T) * s.opacity
    if (shardsMatRef.current) {
      shardsMatRef.current.opacity = shardsOpacity
    }
    if (shellRef.current) {
      shellRef.current.visible = shardsOpacity > 0.005
    }

    // 2. Position & scale mapped from scroll timeline
    if (rootRef.current) {
      const posX = s.posX * viewport.width
      const posY = s.posY * viewport.height
      const baseScale = (0.34 * viewport.width) / 2.16
      const heroScale = Math.max(0.75, Math.min(1.45, baseScale * s.scaleMultiplier))

      if ((s.journeyActive || journeyProgress > 0.001) && T <= 0.001) {
        // In Journey: Keep root unscaled (1.0) so 1px in HTML matches 1 3D unit via unitsPerPx exactly
        rootRef.current.position.set(0, 0, 0)
        rootRef.current.scale.set(1, 1, 1)
      } else if (T > 0.001) {
        // End of journey glide / Contact: root stays unscaled at origin
        rootRef.current.position.set(0, 0, 0)
        rootRef.current.scale.set(1, 1, 1)
      } else {
        // Hero
        rootRef.current.position.set(posX, posY, 0)
        rootRef.current.scale.set(heroScale, heroScale, heroScale)
      }
    }

    // 3. Journey world offset (translates 3D path, stations, and shards together along X)
    if (worldRef.current) {
      if ((s.journeyActive || journeyProgress > 0) && T <= 0.001) {
        worldRef.current.position.set(-s.worldX, 0, 0)
        worldRef.current.visible = true
      } else if (T > 0.001) {
        worldRef.current.position.set(-s.worldX * (1 - T), 0, 0)
        worldRef.current.visible = T < 0.999
      } else {
        worldRef.current.position.set(0, 0, 0)
        worldRef.current.visible = true
      }
    }

    // 4. Shell sway (gentle sway while intact, stabilizes during journey)
    if (shellRef.current) {
      if (journeyProgress > 0.05) {
        shellRef.current.rotation.set(0, 0, 0)
      } else {
        shellRef.current.rotation.set(s.shellRotationX, s.shellRotationY, s.shellRotationZ)
      }
    }

    // 5. Coin positioning, tangent tilt, glide to Contact, continuous spin, cursor tilt, and flip
    if (coinRef.current) {
      // Contact position: x about 70% viewport width, y about 50%, scale about 2.3x
      // In Three.js: center is 0, so 70% from left is +0.20 * viewport.width, 50% is 0.0
      const contactTargetX = 0.20 * viewport.width
      const contactTargetY = 0.0
      const contactTargetScale = 2.3

      if ((s.journeyActive || journeyProgress > 0) && T <= 0.001) {
        // On journey curve
        coinRef.current.position.set(0, s.coinCurveY, 0)
        coinRef.current.rotation.set(0, s.coinRotationY, s.coinTiltZ)
        coinRef.current.scale.set(1.15, 1.15, 1.15)
      } else if (T > 0.001) {
        // Gliding to Contact / In Contact:
        const curX = 0 * (1 - T) + contactTargetX * T
        const curY = s.coinCurveY * (1 - T) + contactTargetY * T + s.flipHopY
        const curScale = 1.15 * (1 - T) + contactTargetScale * T
        coinRef.current.position.set(curX, curY, 0)
        coinRef.current.scale.set(curScale, curScale, curScale)

        // Rotation:
        // Tangent tilt (Z) fades to 0 as coin faces camera: s.coinTiltZ * (1 - T)
        // Cursor tilt (max 12 deg = 0.2094 rad): s.contactTiltX * T and s.contactTiltZ * T
        // Coin flip: full 360-deg rotation on X: s.flipRotationX
        // Continuous Y spin: s.coinRotationY
        const tiltX = s.contactTiltX * T + s.flipRotationX
        const rotY = s.coinRotationY
        const tiltZ = s.coinTiltZ * (1 - T) + s.contactTiltZ * T
        coinRef.current.rotation.set(tiltX, rotY, tiltZ)
      } else {
        // Hero
        coinRef.current.position.set(0, 0, 0)
        coinRef.current.rotation.set(0, s.coinRotationY, 0)
        coinRef.current.scale.set(1, 1, 1)
      }
    }

    // 6. Central point light intensity (flashes during blast, pulses on coin flip)
    if (coreLightRef.current) {
      if (T > 0.001) {
        coreLightRef.current.intensity = 2.6 + s.flipLightPulse
      } else {
        coreLightRef.current.intensity = s.coreLightIntensity
      }
    }

  })

  return (
    <group ref={rootRef}>
      {/* 3D World Group: holds Shards, Journey Path, and Stations, offset by -worldX */}
      <group ref={worldRef}>
        {/* Shard Shell: flat shading with dynamic vertex colors for sand & station highlights */}
        <group ref={shellRef}>
          <mesh geometry={dynamicShards.geometry}>
            <meshStandardMaterial
              ref={shardsMatRef}
              vertexColors={true}
              roughness={0.9}
              metalness={0}
              flatShading={true}
              transparent={true}
              opacity={1.0}
            />
          </mesh>
        </group>

        {/* 3D Journey S-Curve Path Line & Station Rings */}
        <JourneyPath />

        {/* Station cluster localized light helpers */}
        {STATIONS_CONFIG.map((_, idx) => (
          <StationCluster key={idx} stationIndex={idx} />
        ))}
      </group>

      {/* Persistent Gold Coin: stays at horizontal center in journey, glides to 70% vw in Contact */}
      <group ref={coinRef}>
        <mesh geometry={coinBodyGeo}>
          <meshStandardMaterial
            color="#F2C14E"
            roughness={0.45}
            metalness={0.25}
            emissive="#F2C14E"
            emissiveIntensity={0.12}
          />
        </mesh>

        {/* Shared Coin Symbol Disc on both faces */}
        <CoinSymbol variant="solid" />

        <pointLight
          ref={coreLightRef}
          position={[0, 0, 0]}
          color="#F2C14E"
          intensity={2.6}
          distance={4.5}
          decay={2}
        />

        {/* Soft gold glow billboard sprite */}
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

// Step 1 Wireframe Object (Breaker mode in Hero)
function WireStageObject() {
  const rootRef = useRef<THREE.Group>(null)
  const shellRef = useRef<THREE.Group>(null)
  const coinRef = useRef<THREE.Group>(null)
  const { viewport } = useThree()

  const wireShards = useMemo(() => createWireShardsGeometry(0.12), [])
  const coinEdges = useMemo(() => getCoinEdgesGeometry(), [])
  const glowTexture = useMemo(() => getCoinGlowTexture(), [])

  useEffect(() => {
    return () => {
      wireShards.linesGeo.dispose()
      wireShards.dotsGeo.dispose()
    }
  }, [wireShards])

  useFrame(() => {
    const s = getObjectState()

    if (rootRef.current) {
      const posX = s.posX * viewport.width
      const posY = s.posY * viewport.height
      const baseScale = (0.34 * viewport.width) / 2.16
      const scale = Math.max(0.75, Math.min(1.45, baseScale * s.scaleMultiplier))

      rootRef.current.position.set(posX, posY, 0)
      rootRef.current.scale.set(scale, scale, scale)
    }

    if (shellRef.current) {
      shellRef.current.rotation.set(s.shellRotationX, s.shellRotationY, s.shellRotationZ)
    }

    if (coinRef.current) {
      coinRef.current.rotation.set(0, s.coinRotationY, 0)
    }
  })

  return (
    <group ref={rootRef}>
      <group ref={shellRef}>
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

      <group ref={coinRef}>
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

        {/* Shared Coin Symbol Disc on both faces (Breaker / Wireframe view) */}
        <CoinSymbol variant="breaker" />
      </group>
    </group>
  )
}

export default function ObjectStage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isSupported, setIsSupported] = useState(true)
  const [isVisible, setIsVisible] = useState(true)
  const [dividerState, setDividerState] = useState({
    x: 600,
    progress: 0,
    wireMounted: true,
    opacity: 1,
  })

  useEffect(() => {
    // 1. Check prefers-reduced-motion, mobile screens (<768px), or WebGL support
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isMobile = window.innerWidth < 768
    const glTest = testWebGL()

    if (prefersReducedMotion || isMobile || !glTest.supported) {
      setIsSupported(false)
      return
    }

    // 2. Subscribe to persistent object motion loop
    const unsubscribeMotion = subscribeObjectMotion()

    // 3. Tab visibility and overlay pause listener
    let isOverlayPaused = false
    const unsubPause = subscribe3DPause((paused) => {
      isOverlayPaused = paused
      setIsVisible(!document.hidden && !isOverlayPaused)
    })

    const handleVisibility = () => {
      setIsVisible(!document.hidden && !isOverlayPaused)
    }
    document.addEventListener('visibilitychange', handleVisibility)

    // 4. Update divider clipping on animation frame
    let animId: number
    const checkState = () => {
      const s = getObjectState()
      const hero = getHeroState()
      const winW = window.innerWidth

      // Effective divider coordinate accounting for scroll progress
      const effX = hero.dividerX + (winW - hero.dividerX) * s.dividerProgress
      setDividerState((prev) => {
        if (
          Math.abs(prev.x - effX) < 0.25 &&
          Math.abs(prev.progress - s.dividerProgress) < 0.001 &&
          prev.wireMounted === s.isWireMounted &&
          Math.abs(prev.opacity - s.opacity) < 0.001
        ) {
          return prev
        }
        return {
          x: effX,
          progress: s.dividerProgress,
          wireMounted: s.isWireMounted,
          opacity: s.opacity,
        }
      })

      animId = requestAnimationFrame(checkState)
    }
    animId = requestAnimationFrame(checkState)

    return () => {
      unsubscribeMotion()
      unsubPause()
      document.removeEventListener('visibilitychange', handleVisibility)
      cancelAnimationFrame(animId)
    }
  }, [])

  if (!isSupported) {
    return null
  }

  // Dual-clipping for Step 1 Hero split:
  // Solid canvas is clipped to the left of the divider while in hero, then unclipped as divider glides to right
  const solidClip =
    dividerState.progress >= 0.98
      ? undefined
      : `inset(0 calc(100% - ${Math.round(dividerState.x)}px) 0 0)`

  // Wireframe canvas is clipped to the right of the divider during Step 1
  const wireClip = `inset(0 0 0 ${Math.round(dividerState.x)}px)`

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden select-none bg-[#140C0D]"
      aria-hidden="true"
    >
      {/* 1. PERSISTENT SOLID OBJECT CANVAS (Main stage) */}
      <div
        className="absolute inset-0 w-full h-full will-change-[clip-path,opacity] transition-opacity duration-150"
        style={{
          clipPath: solidClip,
          WebkitClipPath: solidClip,
          opacity: dividerState.opacity,
        }}
      >
        <Canvas
          dpr={[1, 1.5]}
          frameloop={isVisible ? 'always' : 'never'}
          camera={{ position: [0, 0, 5.5], fov: 45 }}
          gl={{
            alpha: true,
            antialias: true,
            powerPreference: 'low-power',
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 0.9,
          }}
          style={{ pointerEvents: 'none' }}
          onCreated={({ gl, scene }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping
            gl.toneMappingExposure = 0.9
            // Subtle depth fog so blasted distant shards fade into dark background
            scene.fog = new THREE.FogExp2('#140C0D', 0.045)
          }}
        >
          <ambientLight intensity={0.65} color="#E8DDD3" />
          <directionalLight position={[3, 4, 4]} intensity={0.8} color="#E8DDD3" />
          <directionalLight position={[-4, 2, -3]} intensity={1.2} color="#F2C14E" />
          <StageCursorLight />

          <SolidStageObject />
        </Canvas>
      </div>

      {/* 2. WIREFRAME OBJECT CANVAS (Step 1 Hero breaker view only) */}
      {dividerState.wireMounted && (
        <div
          className="absolute inset-0 w-full h-full will-change-[clip-path,opacity] transition-opacity duration-150"
          style={{
            clipPath: wireClip,
            WebkitClipPath: wireClip,
            opacity: getObjectState().breakerOpacity,
          }}
        >
          <Canvas
            dpr={[1, 1.5]}
            frameloop={isVisible ? 'always' : 'never'}
            camera={{ position: [0, 0, 5.5], fov: 45 }}
            gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
            style={{ pointerEvents: 'none' }}
          >
            <ambientLight intensity={1.5} color="#FFFFFF" />
            <WireStageObject />
          </Canvas>
        </div>
      )}
    </div>
  )
}
