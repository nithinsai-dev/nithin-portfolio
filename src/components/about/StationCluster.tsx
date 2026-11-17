import { useMemo, useState, useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { STATIONS_CONFIG, getCachedJourneyCurve } from '../../lib/journeyPath'
import { getObjectState } from '../../hooks/useObjectMotion'

interface StationClusterProps {
  stationIndex: number
}

/**
 * 3D Station Cluster Helper:
 * Station marker number label and subtle localized station light.
 */
export default function StationCluster({ stationIndex }: StationClusterProps) {
  const lightRef = useRef<THREE.PointLight>(null)
  const [resizeCount, setResizeCount] = useState(0)
  useEffect(() => {
    const handleResize = () => setResizeCount((c) => c + 1)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const { stationPoints3D } = useMemo(() => getCachedJourneyCurve(), [resizeCount])
  const point = stationPoints3D[stationIndex] || new THREE.Vector3(0, 0, 0)
  const station = STATIONS_CONFIG[stationIndex]

  useFrame(() => {
    const s = getObjectState()
    const transitionP = s.contactTransition !== undefined ? s.contactTransition : (s.reassemblyProgress || 0)
    const rFade = Math.max(0, 1.0 - transitionP)
    if (lightRef.current) {
      lightRef.current.intensity = 0.65 * rFade
    }
  })

  if (!station) return null

  return (
    <group position={[point.x, point.y, 0]}>
      {/* Subtle warm point light at station to softly illuminate arriving shards */}
      <pointLight
        ref={lightRef}
        color="#F2C14E"
        intensity={0.65}
        distance={2.2}
        decay={2}
      />
    </group>
  )
}
