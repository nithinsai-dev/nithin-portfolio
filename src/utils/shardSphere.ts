import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

// Deterministic PRNG for consistent shard geometry across Builder and Breaker
function createSeededRandom(initialSeed = 1337) {
  let s = initialSeed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

export interface ShardDef {
  centroid: THREE.Vector3
  normal: THREE.Vector3
  // Base extruded vertices (shrunk by 6%, random normal offset applied)
  v0in: THREE.Vector3
  v1in: THREE.Vector3
  v2in: THREE.Vector3
  v0out: THREE.Vector3
  v1out: THREE.Vector3
  v2out: THREE.Vector3
}

// Cached shard definitions generated once
let cachedShards: ShardDef[] | null = null

export function getShardDefinitions(): ShardDef[] {
  if (cachedShards) return cachedShards

  const prng = createSeededRandom(1337)
  const icosaGeo = new THREE.IcosahedronGeometry(1, 1)
  const baseIcosa = icosaGeo.index ? icosaGeo.toNonIndexed() : icosaGeo
  const pos = baseIcosa.attributes.position.array
  const faceCount = pos.length / 9 // 80 faces

  // Target direction for cracked opening: front face, slightly to the right
  const targetDir = new THREE.Vector3(0.35, 0.08, 0.93).normalize()

  interface FaceInfo {
    id: number
    v0: THREE.Vector3
    v1: THREE.Vector3
    v2: THREE.Vector3
    centroid: THREE.Vector3
    normal: THREE.Vector3
    dot: number
  }

  const faces: FaceInfo[] = []

  for (let i = 0; i < faceCount; i++) {
    const i9 = i * 9
    const v0 = new THREE.Vector3(pos[i9], pos[i9 + 1], pos[i9 + 2])
    const v1 = new THREE.Vector3(pos[i9 + 3], pos[i9 + 4], pos[i9 + 5])
    const v2 = new THREE.Vector3(pos[i9 + 6], pos[i9 + 7], pos[i9 + 8])
    const centroid = new THREE.Vector3().add(v0).add(v1).add(v2).divideScalar(3)
    const normal = centroid.clone().normalize()
    const dot = normal.dot(targetDir)
    faces.push({ id: i, v0, v1, v2, centroid, normal, dot })
  }

  // Sort by alignment with target opening direction
  faces.sort((a, b) => b.dot - a.dot)

  // Remove top 7 faces facing front-right to create the cracked opening revealing the coin
  const keptFaces = faces.slice(7)

  const shards: ShardDef[] = []

  for (const f of keptFaces) {
    const C = f.centroid
    const N = f.normal

    // Shrink triangle toward centroid by 6% to create visible gaps
    const v0 = f.v0.clone().sub(C).multiplyScalar(0.94).add(C)
    const v1 = f.v1.clone().sub(C).multiplyScalar(0.94).add(C)
    const v2 = f.v2.clone().sub(C).multiplyScalar(0.94).add(C)

    // Hand-broken seeded random offset (+/- 0.02)
    const randOffset = (prng() - 0.5) * 0.04
    // Thickness about 0.06 along normal
    const thickness = 0.06

    const v0in = v0.clone().addScaledVector(N, randOffset)
    const v1in = v1.clone().addScaledVector(N, randOffset)
    const v2in = v2.clone().addScaledVector(N, randOffset)

    const v0out = v0.clone().addScaledVector(N, randOffset + thickness)
    const v1out = v1.clone().addScaledVector(N, randOffset + thickness)
    const v2out = v2.clone().addScaledVector(N, randOffset + thickness)

    shards.push({
      centroid: C,
      normal: N,
      v0in,
      v1in,
      v2in,
      v0out,
      v1out,
      v2out,
    })
  }

  baseIcosa.dispose()
  cachedShards = shards
  return shards
}

/**
 * Creates merged solid shard geometry with outward displacement for spread
 */
export function createSolidShardsGeometry(spread: number): THREE.BufferGeometry {
  const shards = getShardDefinitions()
  const positions: number[] = []
  const spreadDist = spread * 0.7

  for (const s of shards) {
    const N = s.normal
    const offX = N.x * spreadDist
    const offY = N.y * spreadDist
    const offZ = N.z * spreadDist

    const AinX = s.v0in.x + offX
    const AinY = s.v0in.y + offY
    const AinZ = s.v0in.z + offZ

    const BinX = s.v1in.x + offX
    const BinY = s.v1in.y + offY
    const BinZ = s.v1in.z + offZ

    const CinX = s.v2in.x + offX
    const CinY = s.v2in.y + offY
    const CinZ = s.v2in.z + offZ

    const AoutX = s.v0out.x + offX
    const AoutY = s.v0out.y + offY
    const AoutZ = s.v0out.z + offZ

    const BoutX = s.v1out.x + offX
    const BoutY = s.v1out.y + offY
    const BoutZ = s.v1out.z + offZ

    const CoutX = s.v2out.x + offX
    const CoutY = s.v2out.y + offY
    const CoutZ = s.v2out.z + offZ

    // Outer face triangle
    positions.push(AoutX, AoutY, AoutZ, BoutX, BoutY, BoutZ, CoutX, CoutY, CoutZ)
    // Inner face triangle (reversed winding)
    positions.push(AinX, AinY, AinZ, CinX, CinY, CinZ, BinX, BinY, BinZ)

    // Side Quad 0: Ain, Bin, Bout, Aout
    positions.push(AinX, AinY, AinZ, BinX, BinY, BinZ, BoutX, BoutY, BoutZ)
    positions.push(AinX, AinY, AinZ, BoutX, BoutY, BoutZ, AoutX, AoutY, AoutZ)

    // Side Quad 1: Bin, Cin, Cout, Bout
    positions.push(BinX, BinY, BinZ, CinX, CinY, CinZ, CoutX, CoutY, CoutZ)
    positions.push(BinX, BinY, BinZ, CoutX, CoutY, CoutZ, BoutX, BoutY, BoutZ)

    // Side Quad 2: Cin, Ain, Aout, Cout
    positions.push(CinX, CinY, CinZ, AinX, AinY, AinZ, AoutX, AoutY, AoutZ)
    positions.push(CinX, CinY, CinZ, AoutX, AoutY, AoutZ, CoutX, CoutY, CoutZ)
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.computeVertexNormals()
  return geo
}

/**
 * Creates wireframe line segments geometry for Breaker shards
 */
export function createWireShardsGeometry(spread: number): {
  linesGeo: THREE.BufferGeometry
  dotsGeo: THREE.BufferGeometry
} {
  const shards = getShardDefinitions()
  const linePositions: number[] = []
  const dotPositions: number[] = []
  const spreadDist = spread * 0.7

  let index = 0
  for (const s of shards) {
    const N = s.normal
    const offX = N.x * spreadDist
    const offY = N.y * spreadDist
    const offZ = N.z * spreadDist

    const AinX = s.v0in.x + offX
    const AinY = s.v0in.y + offY
    const AinZ = s.v0in.z + offZ

    const BinX = s.v1in.x + offX
    const BinY = s.v1in.y + offY
    const BinZ = s.v1in.z + offZ

    const CinX = s.v2in.x + offX
    const CinY = s.v2in.y + offY
    const CinZ = s.v2in.z + offZ

    const AoutX = s.v0out.x + offX
    const AoutY = s.v0out.y + offY
    const AoutZ = s.v0out.z + offZ

    const BoutX = s.v1out.x + offX
    const BoutY = s.v1out.y + offY
    const BoutZ = s.v1out.z + offZ

    const CoutX = s.v2out.x + offX
    const CoutY = s.v2out.y + offY
    const CoutZ = s.v2out.z + offZ

    // Outer triangle edges (3 lines = 6 vertices)
    linePositions.push(AoutX, AoutY, AoutZ, BoutX, BoutY, BoutZ)
    linePositions.push(BoutX, BoutY, BoutZ, CoutX, CoutY, CoutZ)
    linePositions.push(CoutX, CoutY, CoutZ, AoutX, AoutY, AoutZ)

    // Inner triangle edges (3 lines = 6 vertices)
    linePositions.push(AinX, AinY, AinZ, BinX, BinY, BinZ)
    linePositions.push(BinX, BinY, BinZ, CinX, CinY, CinZ)
    linePositions.push(CinX, CinY, CinZ, AinX, AinY, AinZ)

    // Connecting side pillars (3 lines = 6 vertices)
    linePositions.push(AinX, AinY, AinZ, AoutX, AoutY, AoutZ)
    linePositions.push(BinX, BinY, BinZ, BoutX, BoutY, BoutZ)
    linePositions.push(CinX, CinY, CinZ, CoutX, CoutY, CoutZ)

    // Yellow accent dots on outer vertices for every 2nd shard
    if (index % 2 === 0) {
      dotPositions.push(AoutX, AoutY, AoutZ)
      dotPositions.push(BoutX, BoutY, BoutZ)
      dotPositions.push(CoutX, CoutY, CoutZ)
    }
    index++
  }

  const linesGeo = new THREE.BufferGeometry()
  linesGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3))

  const dotsGeo = new THREE.BufferGeometry()
  dotsGeo.setAttribute('position', new THREE.Float32BufferAttribute(dotPositions, 3))

  return { linesGeo, dotsGeo }
}

/**
 * Split the 73 shards into 5 clusters (corresponding to the 5 skill groups)
 */
export const SHARD_CLUSTERS = [
  { start: 0, end: 15 }, // Cluster 0: Languages (~15 shards)
  { start: 15, end: 29 }, // Cluster 1: Concepts (~14 shards)
  { start: 29, end: 43 }, // Cluster 2: Tools (~14 shards)
  { start: 43, end: 58 }, // Cluster 3: Frameworks (~15 shards)
  { start: 58, end: 73 }, // Cluster 4: Databases (~15 shards)
]

export function createClusterEdgesGeometry(
  clusterIndex: number,
  spread: number
): THREE.BufferGeometry {
  const shards = getShardDefinitions()
  const cluster = SHARD_CLUSTERS[clusterIndex] || SHARD_CLUSTERS[0]
  const clusterShards = shards.slice(cluster.start, cluster.end)
  const linePositions: number[] = []
  const spreadDist = spread * 0.7

  for (const s of clusterShards) {
    const N = s.normal
    const offX = N.x * spreadDist
    const offY = N.y * spreadDist
    const offZ = N.z * spreadDist

    const AoutX = s.v0out.x + offX
    const AoutY = s.v0out.y + offY
    const AoutZ = s.v0out.z + offZ

    const BoutX = s.v1out.x + offX
    const BoutY = s.v1out.y + offY
    const BoutZ = s.v1out.z + offZ

    const CoutX = s.v2out.x + offX
    const CoutY = s.v2out.y + offY
    const CoutZ = s.v2out.z + offZ

    // Outer perimeter edges for the cluster highlight
    linePositions.push(AoutX, AoutY, AoutZ, BoutX, BoutY, BoutZ)
    linePositions.push(BoutX, BoutY, BoutZ, CoutX, CoutY, CoutZ)
    linePositions.push(CoutX, CoutY, CoutZ, AoutX, AoutY, AoutZ)
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3))
  return geo
}

/**
 * Creates the chunky Coin body geometry with raised rims
 */
let cachedCoinBodyGeometry: THREE.BufferGeometry | null = null
let cachedCoinEdgesGeometry: THREE.BufferGeometry | null = null

export function getCoinBodyGeometry(): THREE.BufferGeometry {
  if (cachedCoinBodyGeometry) return cachedCoinBodyGeometry

  // 1. Chunky coin body (radius 0.42, height 0.1, 64 segments)
  // Rotated so circular faces face along Z and it stands vertically on edge
  const rawBody = new THREE.CylinderGeometry(0.42, 0.42, 0.1, 64)
  const bodyGeo = rawBody.index ? rawBody.toNonIndexed() : rawBody
  bodyGeo.rotateX(Math.PI / 2)

  // 2. Slightly raised rim on both circular faces
  const rawRimFront = new THREE.TorusGeometry(0.405, 0.015, 12, 64)
  const rimFront = rawRimFront.index ? rawRimFront.toNonIndexed() : rawRimFront
  rimFront.translate(0, 0, 0.05)

  const rawRimBack = new THREE.TorusGeometry(0.405, 0.015, 12, 64)
  const rimBack = rawRimBack.index ? rawRimBack.toNonIndexed() : rawRimBack
  rimBack.translate(0, 0, -0.05)

  const merged = mergeGeometries([bodyGeo, rimFront, rimBack], false)
  merged.computeVertexNormals()

  bodyGeo.dispose()
  rimFront.dispose()
  rimBack.dispose()

  cachedCoinBodyGeometry = merged
  return merged
}

/**
 * Creates clean rim circles for the coin in Breaker mode using EdgesGeometry (threshold 30°)
 * This prevents the dense triangle spoke scribble across the circular faces.
 */
export function getCoinEdgesGeometry(): THREE.BufferGeometry {
  if (cachedCoinEdgesGeometry) return cachedCoinEdgesGeometry

  const coinBody = getCoinBodyGeometry()
  // Threshold 30 degrees isolates the clean circular boundary rims and eliminates internal face triangulation
  const edges = new THREE.EdgesGeometry(coinBody, 30)
  cachedCoinEdgesGeometry = edges
  return edges
}

/**
 * Creates soft radial yellow glow texture for Breaker coin background
 */
let cachedGlowTexture: THREE.CanvasTexture | null = null

export function getCoinGlowTexture(): THREE.CanvasTexture {
  if (cachedGlowTexture) return cachedGlowTexture

  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  if (ctx) {
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
    gradient.addColorStop(0, 'rgba(242, 193, 78, 0.40)')
    gradient.addColorStop(0.35, 'rgba(242, 193, 78, 0.15)')
    gradient.addColorStop(0.7, 'rgba(242, 193, 78, 0.04)')
    gradient.addColorStop(1, 'rgba(242, 193, 78, 0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 128, 128)
  }
  const texture = new THREE.CanvasTexture(canvas)
  cachedGlowTexture = texture
  return texture
}

/**
 * Creates dynamic solid shards geometry that can smoothly update spread in real time
 */
export function createDynamicSolidShardsGeometry(): {
  geometry: THREE.BufferGeometry
  updateSpread: (spread: number) => void
} {
  const shards = getShardDefinitions()
  const basePositions: number[] = []
  const normals: number[] = []

  for (const s of shards) {
    const N = s.normal
    const verts = [
      s.v0out, s.v1out, s.v2out,
      s.v0in, s.v2in, s.v1in,
      s.v0in, s.v1in, s.v1out, s.v0in, s.v1out, s.v0out,
      s.v1in, s.v2in, s.v2out, s.v1in, s.v2out, s.v1out,
      s.v2in, s.v0in, s.v0out, s.v2in, s.v0out, s.v2out,
    ]
    for (const v of verts) {
      basePositions.push(v.x, v.y, v.z)
      normals.push(N.x, N.y, N.z)
    }
  }

  const count = basePositions.length
  const baseArr = new Float32Array(basePositions)
  const normArr = new Float32Array(normals)
  const currentPos = new Float32Array(basePositions)

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(currentPos, 3))
  geometry.computeVertexNormals()

  let lastSpread = -999
  const updateSpread = (spread: number) => {
    if (Math.abs(spread - lastSpread) < 0.001) return
    lastSpread = spread
    const spreadDist = spread * 0.7
    const posAttr = geometry.attributes.position.array as Float32Array
    for (let i = 0; i < count; i += 3) {
      posAttr[i] = baseArr[i] + normArr[i] * spreadDist
      posAttr[i + 1] = baseArr[i + 1] + normArr[i + 1] * spreadDist
      posAttr[i + 2] = baseArr[i + 2] + normArr[i + 2] * spreadDist
    }
    geometry.attributes.position.needsUpdate = true
  }

  return { geometry, updateSpread }
}

/**
 * Creates 5 dynamic cluster edge geometries for skill group highlights
 */
export function createDynamicClusterEdgesGeometries(): Array<{
  geometry: THREE.BufferGeometry
  updateSpread: (spread: number) => void
}> {
  const shards = getShardDefinitions()

  return SHARD_CLUSTERS.map((cluster) => {
    const clusterShards = shards.slice(cluster.start, cluster.end)
    const baseLines: number[] = []
    const normals: number[] = []

    for (const s of clusterShards) {
      const N = s.normal
      // 3 lines = 6 vertices
      const lines = [
        s.v0out, s.v1out,
        s.v1out, s.v2out,
        s.v2out, s.v0out,
      ]
      for (const v of lines) {
        baseLines.push(v.x, v.y, v.z)
        normals.push(N.x, N.y, N.z)
      }
    }

    const count = baseLines.length
    const baseArr = new Float32Array(baseLines)
    const normArr = new Float32Array(normals)
    const currentPos = new Float32Array(baseLines)

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(currentPos, 3))

    let lastSpread = -999
    const updateSpread = (spread: number) => {
      if (Math.abs(spread - lastSpread) < 0.001) return
      lastSpread = spread
      const spreadDist = spread * 0.7
      const posAttr = geometry.attributes.position.array as Float32Array
      for (let i = 0; i < count; i += 3) {
        posAttr[i] = baseArr[i] + normArr[i] * spreadDist
        posAttr[i + 1] = baseArr[i + 1] + normArr[i + 1] * spreadDist
        posAttr[i + 2] = baseArr[i + 2] + normArr[i + 2] * spreadDist
      }
      geometry.attributes.position.needsUpdate = true
    }

    return { geometry, updateSpread }
  })
}
