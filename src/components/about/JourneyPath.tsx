import { useMemo, useState, useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import {
  getCachedJourneyCurve,
  STATIONS_CONFIG,
  getUnitsPerPixel,
} from '../../lib/journeyPath'
import { getObjectState } from '../../hooks/useObjectMotion'

const NUM_SAMPLE_POINTS = 400

/**
 * 3D Journey Path:
 * - Dim ahead line (sand at 30% opacity) for the full path ahead
 * - Solid gold line (#F2C14E) from the start to the current coin position (using setDrawRange)
 * - 5 Station markers: 10px ring on the path with glowing yellow highlights
 */
export default function JourneyPath() {
  const [resizeCount, setResizeCount] = useState(0)
  useEffect(() => {
    const handleResize = () => setResizeCount((c) => c + 1)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const { curve, stationPoints3D } = useMemo(() => getCachedJourneyCurve(), [resizeCount])
  const unitsPerPx = useMemo(() => getUnitsPerPixel(), [resizeCount])

  // Sample points along the curve from Station 0 to Station 4
  const { aheadLine, goldLine, goldGeometry, stationRings } = useMemo(() => {
    const points: THREE.Vector3[] = []

    for (let i = 0; i <= NUM_SAMPLE_POINTS; i++) {
      points.push(curve.getPoint(i / NUM_SAMPLE_POINTS))
    }

    const aheadGeo = new THREE.BufferGeometry().setFromPoints(points)
    const goldGeo = new THREE.BufferGeometry().setFromPoints(points)
    goldGeo.setDrawRange(0, 0)

    const aheadMat = new THREE.LineBasicMaterial({
      color: '#E8DDD3',
      transparent: true,
      opacity: 0.30,
      depthWrite: false,
    })

    const goldMat = new THREE.LineBasicMaterial({
      color: '#F2C14E',
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
    })

    const ahead = new THREE.Line(aheadGeo, aheadMat)
    const gold = new THREE.Line(goldGeo, goldMat)

    return {
      aheadLine: ahead,
      goldLine: gold,
      goldGeometry: goldGeo,
      stationRings: stationPoints3D.map((pt, idx) => ({
        point: pt,
        config: STATIONS_CONFIG[idx],
      })),
    }
  }, [curve, stationPoints3D, unitsPerPx])

  const groupRef = useRef<THREE.Group>(null)

  useFrame(() => {
    const s = getObjectState()
    const count = Math.min(
      NUM_SAMPLE_POINTS + 1,
      Math.max(0, Math.floor(s.journeyProgress * (NUM_SAMPLE_POINTS + 1)))
    )
    goldGeometry.setDrawRange(0, count)

    // Fade out path line and station rings during end of journey transition
    const transitionP = s.contactTransition !== undefined ? s.contactTransition : (s.reassemblyProgress || 0)
    const rFade = Math.max(0, 1.0 - transitionP)
    if (groupRef.current) {
      groupRef.current.visible = rFade > 0.01
    }
    const aMat = aheadLine.material as THREE.LineBasicMaterial
    const gMat = goldLine.material as THREE.LineBasicMaterial
    if (aMat) aMat.opacity = 0.30 * rFade
    if (gMat) gMat.opacity = 0.95 * rFade
  })

  return (
    <group ref={groupRef}>
      {/* 1. Full Path Ahead: Dim sand line at 30% opacity */}
      <primitive object={aheadLine} />

      {/* 2. Completed Path: Solid gold line (#F2C14E) up to coin position */}
      <primitive object={goldLine} />

      {/* 3. Station Markers: 10px rings on the path */}
      {stationRings.map(({ point, config }) => (
        <group key={config.id} position={[point.x, point.y, 0.02]}>
          {/* Ring on the path */}
          <mesh>
            <ringGeometry args={[0.028, 0.040, 32]} />
            <meshBasicMaterial
              color="#F2C14E"
              transparent
              opacity={0.85}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>

          {/* Central subtle dot */}
          <mesh>
            <circleGeometry args={[0.014, 16]} />
            <meshBasicMaterial
              color="#F2C14E"
              transparent
              opacity={0.65}
              depthWrite={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  )
}
