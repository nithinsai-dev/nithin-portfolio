import * as THREE from 'three'

export const CAMERA_DISTANCE = 5.5
export const CAMERA_FOV = 45

/**
 * Height of the 3D viewport at z = 0 with camera at z = 5.5 and FOV = 45 deg.
 * 2 * tan(22.5 deg) * 5.5 ≈ 4.55635 units.
 */
export function get3DViewportHeight(): number {
  const rad = (CAMERA_FOV * Math.PI) / 360
  return 2 * Math.tan(rad) * CAMERA_DISTANCE
}

/**
 * Mathematical 1:1 mapping between screen pixels and 3D units at z = 0.
 * Three.js uses square pixels, so unitsPerPixel = viewportHeight_3d / innerHeight.
 */
export function getUnitsPerPixel(): number {
  if (typeof window === 'undefined') return 4.55635 / 800
  return get3DViewportHeight() / (window.innerHeight || 800)
}

/**
 * 5 Station definitions with normalized path positions.
 * All panels sit above the path in the text zone (10vh to 56vh).
 */
export interface StationConfig {
  id: number
  label: string
  shortLabel: string
  number: string
  title: string
  /** Normalized position along the journey (0.0 to 1.0) */
  progress: number
  /** Y undulation sign along the lower S-curve (+/-7vh amplitude) */
  ySign: number
  /** Panel vertical placement: all sit above the path */
  panelPlacement: 'above'
}

export const STATIONS_CONFIG: StationConfig[] = [
  {
    id: 1,
    number: '01',
    label: '01 / about',
    shortLabel: 'about',
    title: 'About',
    progress: 0.0,
    ySign: -0.8,
    panelPlacement: 'above',
  },
  {
    id: 2,
    number: '02',
    label: '02 / what I build',
    shortLabel: 'build',
    title: 'What I Build',
    progress: 0.25,
    ySign: 1.0,
    panelPlacement: 'above',
  },
  {
    id: 3,
    number: '03',
    label: '03 / now - next',
    shortLabel: 'now',
    title: 'Now · Next',
    progress: 0.50,
    ySign: -1.0,
    panelPlacement: 'above',
  },
  {
    id: 4,
    number: '04',
    label: '04 / skills',
    shortLabel: 'skills',
    title: 'Skills',
    progress: 0.75,
    ySign: 1.0,
    panelPlacement: 'above',
  },
  {
    id: 5,
    number: '05',
    label: '05 / off screen',
    shortLabel: 'life',
    title: 'Off Screen',
    progress: 1.0,
    ySign: -0.8,
    panelPlacement: 'above',
  },
]

/**
 * Calculates current journey dimensions based on window size.
 * Station spacing is at least 110vw (115vw) so panels of up to 60vw never overlap.
 * Coin rides at ~72% viewport height with S-curve amplitude +/-7vh.
 */
export function getJourneyDimensions() {
  const winW = typeof window !== 'undefined' ? window.innerWidth : 1200
  const winH = typeof window !== 'undefined' ? window.innerHeight : 800
  const unitsPerPx = getUnitsPerPixel()
  const vH = get3DViewportHeight()

  // Station spacing: 115vw (at least 110vw) between consecutive stations
  const stationSpacingPx = winW * 1.15
  const totalTravelPx = stationSpacingPx * (STATIONS_CONFIG.length - 1)
  // Path center at 72% viewport height (22% below center in 3D: -0.22 * vH)
  const pathCenterY_3D = -0.22 * vH
  const amplitude3D = vH * 0.07 // +/-7vh in 3D units (~0.319 units)
  const amplitudePx = winH * 0.07 // +/-7vh in pixels

  return {
    winW,
    winH,
    unitsPerPx,
    vH,
    stationSpacingPx,
    totalTravelPx,
    pathCenterY_3D,
    amplitude3D,
    amplitudePx,
  }
}

/**
 * Generates the Catmull-Rom curve in 3D space.
 * Path rides lower at ~72% of viewport height.
 */
export function createJourneyCurve(dims = getJourneyDimensions()): {
  curve: THREE.CatmullRomCurve3
  controlPoints: THREE.Vector3[]
  stationPoints3D: THREE.Vector3[]
  stationPositionsPx: number[]
} {
  const { stationSpacingPx, unitsPerPx, pathCenterY_3D, amplitude3D } = dims

  const stationPoints3D: THREE.Vector3[] = []
  const stationPositionsPx: number[] = []

  // Compute 3D and pixel positions for each station
  STATIONS_CONFIG.forEach((station, i) => {
    const xPx = i * stationSpacingPx
    const x3D = xPx * unitsPerPx
    const y3D = pathCenterY_3D + station.ySign * amplitude3D
    stationPositionsPx.push(xPx)
    stationPoints3D.push(new THREE.Vector3(x3D, y3D, 0))
  })

  // CatmullRomCurve3 parameterized directly across the 5 stations
  const curve = new THREE.CatmullRomCurve3(stationPoints3D, false, 'catmullrom', 0.5)

  return {
    curve,
    controlPoints: stationPoints3D,
    stationPoints3D,
    stationPositionsPx,
  }
}

// Cached singleton curve instance for 60fps frame loop lookups
let cachedCurveInstance: ReturnType<typeof createJourneyCurve> | null = null
let lastWinW = 0
let lastWinH = 0

export function getCachedJourneyCurve() {
  const winW = typeof window !== 'undefined' ? window.innerWidth : 1200
  const winH = typeof window !== 'undefined' ? window.innerHeight : 800

  if (!cachedCurveInstance || winW !== lastWinW || winH !== lastWinH) {
    lastWinW = winW
    lastWinH = winH
    cachedCurveInstance = createJourneyCurve()
  }
  return cachedCurveInstance
}

/**
 * Returns the exact 3D position, world X translation, and tilt angle for a given journeyProgress (0 to 1).
 */
export function getJourneyCurveEvaluation(progress: number): {
  worldX: number // Amount to translate the 3D world left: worldX = currentPoint.x
  coinY: number  // Y position of the coin at screen center
  coinTiltZ: number // Tilt angle toward curve tangent
} {
  const { curve } = getCachedJourneyCurve()
  const pClamped = Math.max(0, Math.min(1, progress))

  const pt = curve.getPoint(pClamped)
  const tangent = curve.getTangent(pClamped)

  // Tangent angle in radians (tilt along curve slope)
  const tilt = Math.atan2(tangent.y, tangent.x) * 0.45

  return {
    worldX: pt.x,
    coinY: pt.y,
    coinTiltZ: tilt,
  }
}

/**
 * Seeded Home cluster arrangement for the 5 stations.
 * Divides shards into 5 groups of ~14-15 shards, each placed in a compact
 * radius ~0.58 sphere (~1.2 units wide) around its station with seeded repeatable offsets.
 */
export interface StationClusterData {
  stationIndex: number
  centerOffset: THREE.Vector3 // relative to station point
  shardOffsets: THREE.Vector3[]
  shardRotations: THREE.Euler[]
}

function pseudoRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

export function generateStationClusters(): StationClusterData[] {
  const clusters: StationClusterData[] = []
  const prng = pseudoRandom(42)

  for (let sIdx = 0; sIdx < STATIONS_CONFIG.length; sIdx++) {
    // Cluster center is placed near the station marker on the path
    const centerOffset = new THREE.Vector3(0, 0.12, 0)

    const shardOffsets: THREE.Vector3[] = []
    const shardRotations: THREE.Euler[] = []

    // 15 shards per station, loose cluster of about 1.2 units wide (radius 0.22 to 0.58)
    for (let i = 0; i < 16; i++) {
      const u = prng()
      const v = prng()
      const theta = u * 2.0 * Math.PI
      const phi = Math.acos(2.0 * v - 1.0)
      const r = 0.22 + prng() * 0.36 // radius max ~0.58 => width ~1.16 to 1.2 units

      const sinPhi = Math.sin(phi)
      const x = r * sinPhi * Math.cos(theta)
      const y = r * sinPhi * Math.sin(theta)
      // Depth stays strictly behind z <= 0.5
      const z = Math.min(0.35, -0.15 + (prng() - 0.5) * 0.4)

      shardOffsets.push(new THREE.Vector3(x, y, z))
      shardRotations.push(
        new THREE.Euler(
          prng() * Math.PI * 2,
          prng() * Math.PI * 2,
          prng() * Math.PI * 2
        )
      )
    }

    clusters.push({
      stationIndex: sIdx,
      centerOffset,
      shardOffsets,
      shardRotations,
    })
  }

  return clusters
}
