import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import {
  generateStationClusters,
  getCachedJourneyCurve,
  STATIONS_CONFIG,
} from '../lib/journeyPath'

// Deterministic PRNG for identical seeded geometry and blast trajectories
function createSeededRandom(initialSeed = 1337) {
  let s = initialSeed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

export interface ShardDataDef {
  centroid: THREE.Vector3
  normal: THREE.Vector3
  // Base extruded vertices (shrunk by 6%, random normal offset applied)
  verts: THREE.Vector3[]
  // Seeded blast and drift parameters
  blastDist: number // 2.0 to 7.0 units outward
  blastAxis: THREE.Vector3
  blastAngle: number
  driftPhase: number
}

let cachedShardsData: ShardDataDef[] | null = null

export function getSharedShardData(): ShardDataDef[] {
  if (cachedShardsData) return cachedShardsData

  const prng = createSeededRandom(1337)
  // Base icosahedron radius 1.0 (detail 1, 80 faces)
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

  // Remove top 7 faces facing front-right to create the cracked opening
  const keptFaces = faces.slice(7)

  const shards: ShardDataDef[] = []

  for (const f of keptFaces) {
    const C = f.centroid
    const N = f.normal

    // Shrink triangle toward centroid by 6% to create visible gaps
    const v0 = f.v0.clone().sub(C).multiplyScalar(0.94).add(C)
    const v1 = f.v1.clone().sub(C).multiplyScalar(0.94).add(C)
    const v2 = f.v2.clone().sub(C).multiplyScalar(0.94).add(C)

    // Hand-broken seeded random offset (+/- 0.02)
    const randOffset = (prng() - 0.5) * 0.04
    const thickness = 0.06

    const v0in = v0.clone().addScaledVector(N, randOffset)
    const v1in = v1.clone().addScaledVector(N, randOffset)
    const v2in = v2.clone().addScaledVector(N, randOffset)

    const v0out = v0.clone().addScaledVector(N, randOffset + thickness)
    const v1out = v1.clone().addScaledVector(N, randOffset + thickness)
    const v2out = v2.clone().addScaledVector(N, randOffset + thickness)

    // 24 vertices for 8 extruded triangles
    const verts = [
      // Outer face
      v0out, v1out, v2out,
      // Inner face (reversed winding)
      v0in, v2in, v1in,
      // Side Quad 0
      v0in, v1in, v1out, v0in, v1out, v0out,
      // Side Quad 1
      v1in, v2in, v2out, v1in, v2out, v1out,
      // Side Quad 2
      v2in, v0in, v0out, v2in, v0out, v2out,
    ]

    // Seeded blast distance (2.0 to 7.0 units) and random rotation parameters
    const blastDist = 2.0 + prng() * 5.0
    const blastAxis = new THREE.Vector3(
      prng() - 0.5,
      prng() - 0.5,
      prng() - 0.5
    ).normalize()
    const blastAngle = (prng() - 0.5) * Math.PI * 2
    const driftPhase = prng() * Math.PI * 2

    shards.push({
      centroid: C,
      normal: N,
      verts,
      blastDist,
      blastAxis,
      blastAngle,
      driftPhase,
    })
  }

  baseIcosa.dispose()
  cachedShardsData = shards
  return shards
}

export interface ShardBaseTransform {
  centroid: THREE.Vector3
  quaternion: THREE.Quaternion
  normal: THREE.Vector3
  localVerts: THREE.Vector3[]
  baseVerts: THREE.Vector3[]
  blastDist: number
  blastAxis: THREE.Vector3
  blastAngle: number
  driftPhase: number
}

/**
 * Creates persistent solid shard geometry that smoothly updates outward spread,
 * explosive blast translation (2-7 units), random rotation, and subtle field drift.
 */
export function createPersistentSolidShardsGeometry(): {
  geometry: THREE.BufferGeometry
  update: (
    spread: number,
    blast: number,
    driftTime: number,
    journeyProgress?: number
  ) => void
} {
  const shards = getSharedShardData()
  
  // Store immutable BASE transforms
  const shardBases: ShardBaseTransform[] = shards.map((s) => ({
    centroid: s.centroid.clone(),
    quaternion: new THREE.Quaternion(0, 0, 0, 1), // identity
    normal: s.normal.clone(),
    localVerts: s.verts.map((v) => v.clone().sub(s.centroid)),
    baseVerts: s.verts.map((v) => v.clone()),
    blastDist: s.blastDist,
    blastAxis: s.blastAxis.clone(),
    blastAngle: s.blastAngle,
    driftPhase: s.driftPhase,
  }))

  const count = shards.length * 24 * 3
  const currentPos = new Float32Array(count)
  const currentColors = new Float32Array(count)

  // Initialize with original hero matte sand #D9CDBE [0.851, 0.804, 0.745]
  for (let i = 0; i < count; i += 3) {
    currentColors[i] = 0.851
    currentColors[i + 1] = 0.804
    currentColors[i + 2] = 0.745
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(currentPos, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(currentColors, 3))

  const stationClusters = generateStationClusters()
  const posScatter = new THREE.Vector3()
  const qScatter = new THREE.Quaternion()
  const qBlastTarget = new THREE.Quaternion()
  const posHome = new THREE.Vector3()
  const qHome = new THREE.Quaternion()
  const posFinal = new THREE.Vector3()
  const qFinal = new THREE.Quaternion()
  const tempV = new THREE.Vector3()

  const update = (
    spread: number,
    blast: number,
    driftTime: number,
    journeyProgress = 0
  ) => {
    // Clamp inputs to [0, 1] and snap values below 0.001 to exactly 0
    const sSpread = spread < 0.001 ? 0 : Math.min(1.0, Math.max(0, spread))
    const sBlast = blast < 0.001 ? 0 : Math.min(1.0, Math.max(0, blast))
    const sJourneyProgress = journeyProgress < 0.001 ? 0 : Math.min(1.0, Math.max(0, journeyProgress))

    const posAttr = geometry.attributes.position.array as Float32Array
    const colAttr = geometry.attributes.color.array as Float32Array
    const { stationPoints3D } = getCachedJourneyCurve()
    let idx = 0

    for (let i = 0; i < shardBases.length; i++) {
      const base = shardBases[i]
      const C = base.centroid
      const N = base.normal
      const qBase = base.quaternion // identity (0, 0, 0, 1)

      // 1. Station group and cluster weight w_i (defaults to 0 for all shards)
      const numStations = STATIONS_CONFIG.length
      const groupIdx = Math.min(numStations - 1, Math.floor((i / shardBases.length) * numStations))
      const uStation = STATIONS_CONFIG[groupIdx]?.progress || 0
      const cluster = stationClusters[groupIdx] || stationClusters[0]
      const shardInCluster = i % cluster.shardOffsets.length
      const homeOffset = cluster.shardOffsets[shardInCluster]
      const homeEuler = cluster.shardRotations[shardInCluster]
      const stationPoint = stationPoints3D[groupIdx] || new THREE.Vector3(0, 0, 0)

      let w_i = 0
      if (sJourneyProgress > 0) {
        if (groupIdx === 0) {
          const t = Math.min(1.0, sJourneyProgress / 0.06)
          w_i = t * t * (3 - 2 * t)
        } else {
          const approachStart = uStation - 0.20
          if (sJourneyProgress <= approachStart) {
            w_i = 0
          } else if (sJourneyProgress >= uStation) {
            w_i = 1.0
          } else {
            const t = (sJourneyProgress - approachStart) / 0.20
            w_i = t * t * (3 - 2 * t)
          }
        }
      }

      // Clamp cluster weight to [0, 1] and snap values below 0.001 to exactly 0
      if (w_i < 0.001) w_i = 0
      else if (w_i > 0.999) w_i = 1.0
      else w_i = Math.min(1.0, Math.max(0, w_i))

      // 2. Compute scatter transform (Base -> Scatter by Blast and Spread)
      if (sBlast === 0 && sSpread === 0) {
        posScatter.copy(C)
        qScatter.copy(qBase)
      } else {
        const clampedBlastDist = Math.min(3.8, base.blastDist)
        const dist = Math.min(5.0, sSpread * 0.7 + sBlast * clampedBlastDist)

        const driftX = sBlast * Math.sin(driftTime * 0.4 + base.driftPhase) * 0.12
        const driftY = sBlast * Math.cos(driftTime * 0.35 + base.driftPhase * 1.3) * 0.12
        const driftZ = sBlast * Math.sin(driftTime * 0.3 + base.driftPhase * 0.7) * 0.08

        const scatterAnchorX = stationPoint.x * Math.min(1.0, sJourneyProgress * 5.0)
        const scatterAnchorY = stationPoint.y * Math.min(1.0, sJourneyProgress * 5.0)

        const normalZ = sBlast > 0 && N.z > 0 ? N.z * 0.12 : N.z
        let rawScatterX = scatterAnchorX + C.x + N.x * dist + driftX
        let rawScatterY = scatterAnchorY + C.y + N.y * dist + driftY
        let rawScatterZ = C.z + normalZ * dist + driftZ

        if (sBlast > 0) {
          rawScatterZ = Math.min(0.48, rawScatterZ)
          const dx = rawScatterX - scatterAnchorX
          const dy = rawScatterY - scatterAnchorY
          const distFromAnchor = Math.hypot(dx, dy)
          if (distFromAnchor > 5.5) {
            const factor = 5.5 / distFromAnchor
            rawScatterX = scatterAnchorX + dx * factor
            rawScatterY = scatterAnchorY + dy * factor
          }

          // While Station 1 / Values panel is active, push shards away from the upper text zone
          if (sJourneyProgress < 0.16 && rawScatterY > 0.05) {
            const pushFactor = Math.max(0, 1.0 - sJourneyProgress / 0.16)
            rawScatterY -= (rawScatterY + 0.1) * 0.7 * pushFactor
          }
        }

        posScatter.set(rawScatterX, rawScatterY, rawScatterZ)

        // Interpolate blast rotation from qBase using sBlast weight
        qBlastTarget.setFromAxisAngle(
          base.blastAxis,
          base.blastAngle + driftTime * 0.04
        )
        qScatter.copy(qBase).slerp(qBlastTarget, sBlast)
      }

      // 3. Compute final transform (Scatter -> Station Home interpolated by w_i)
      if (w_i === 0) {
        posFinal.copy(posScatter)
        qFinal.copy(qScatter)
      } else {
        posHome.set(
          stationPoint.x + cluster.centerOffset.x + homeOffset.x,
          stationPoint.y + cluster.centerOffset.y + homeOffset.y,
          Math.min(0.40, homeOffset.z)
        )
        qHome.setFromEuler(homeEuler)

        posFinal.set(
          posScatter.x * (1 - w_i) + posHome.x * w_i,
          posScatter.y * (1 - w_i) + posHome.y * w_i,
          posScatter.z * (1 - w_i) + posHome.z * w_i
        )
        qFinal.copy(qScatter).slerp(qHome, w_i)
      }

      // 4. Compute Colors:
      // Hero sand #D9CDBE [0.851, 0.804, 0.745] at blast = 0
      // Blends to dimmed field 55% brightness [0.468, 0.442, 0.410] or cluster [0.38, 0.36, 0.33] as blast increases
      const sandR = 0.851 * (1 - sBlast) + (w_i > 0.99 ? 0.380 : 0.468) * sBlast
      const sandG = 0.804 * (1 - sBlast) + (w_i > 0.99 ? 0.360 : 0.442) * sBlast
      const sandB = 0.745 * (1 - sBlast) + (w_i > 0.99 ? 0.330 : 0.410) * sBlast

      let highlight = 0
      if (sJourneyProgress > 0) {
        const diff = sJourneyProgress - uStation
        if (diff >= -0.01 && diff <= 0.07) {
          if (diff < 0.01) {
            highlight = (diff + 0.01) / 0.02
          } else {
            highlight = Math.max(0, 1.0 - (diff - 0.01) / 0.06)
          }
        }
      }

      // Dim shards in upper text zone while Station 1 / Values panel is active
      let textZoneDim = 1.0
      if (sBlast > 0 && sJourneyProgress < 0.16 && posScatter.y > 0.0) {
        const factor = Math.max(0, 1.0 - sJourneyProgress / 0.16)
        textZoneDim = 1.0 - 0.45 * factor
      }

      const finalR = (sandR * (1 - highlight) + 0.949 * highlight) * textZoneDim
      const finalG = (sandG * (1 - highlight) + 0.757 * highlight) * textZoneDim
      const finalB = (sandB * (1 - highlight) + 0.306 * highlight) * textZoneDim

      // 5. Apply final transform to shard's 24 vertices
      const shardStartIdx = idx
      for (let j = 0; j < 24; j++) {
        const local = base.localVerts[j]
        tempV.copy(local)
        if (sBlast > 0 || w_i > 0) {
          tempV.applyQuaternion(qFinal)
        }
        posAttr[idx] = tempV.x + posFinal.x
        posAttr[idx + 1] = tempV.y + posFinal.y
        posAttr[idx + 2] = tempV.z + posFinal.z

        colAttr[idx] = finalR
        colAttr[idx + 1] = finalG
        colAttr[idx + 2] = finalB

        idx += 3
      }

      // 6. Dev-only check: verify zero deviation from base when blast = 0, spread = 0, w_i = 0
      const isDev = Boolean((import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV)
      if (isDev && sBlast === 0 && sSpread === 0 && w_i === 0) {
        let maxDev = 0
        for (let j = 0; j < 24; j++) {
          const vBase = base.baseVerts[j]
          const curX = posAttr[shardStartIdx + j * 3]
          const curY = posAttr[shardStartIdx + j * 3 + 1]
          const curZ = posAttr[shardStartIdx + j * 3 + 2]
          const dev = Math.hypot(curX - vBase.x, curY - vBase.y, curZ - vBase.z)
          if (dev > maxDev) maxDev = dev
        }
        if (maxDev > 0.001 && import.meta.env.DEV) {
          console.warn(
            `[ShardCheck] Shard ${i} final transform differs from base by ${maxDev.toFixed(5)} (> 0.001) at zero state!`
          )
        }
      }
    }

    geometry.attributes.position.needsUpdate = true
    geometry.attributes.color.needsUpdate = true
    geometry.computeVertexNormals()
  }

  // Initial update at pure assembled hero state: spread = 0, blast = 0, journeyProgress = 0
  update(0, 0, 0, 0)

  return { geometry, update }
}

/**
 * Creates wireframe lines and dots for the Step 1 Breaker overlay
 */
export function createWireShardsGeometry(spread: number): {
  linesGeo: THREE.BufferGeometry
  dotsGeo: THREE.BufferGeometry
} {
  const shards = getSharedShardData()
  const linePositions: number[] = []
  const dotPositions: number[] = []
  const spreadDist = spread * 0.7

  let index = 0
  for (const s of shards) {
    const N = s.normal
    const offX = N.x * spreadDist
    const offY = N.y * spreadDist
    const offZ = N.z * spreadDist

    const v0out = s.verts[0]
    const v1out = s.verts[1]
    const v2out = s.verts[2]
    const v0in = s.verts[3]
    const v1in = s.verts[5]
    const v2in = s.verts[4]

    const AoutX = v0out.x + offX
    const AoutY = v0out.y + offY
    const AoutZ = v0out.z + offZ

    const BoutX = v1out.x + offX
    const BoutY = v1out.y + offY
    const BoutZ = v1out.z + offZ

    const CoutX = v2out.x + offX
    const CoutY = v2out.y + offY
    const CoutZ = v2out.z + offZ

    const AinX = v0in.x + offX
    const AinY = v0in.y + offY
    const AinZ = v0in.z + offZ

    const BinX = v1in.x + offX
    const BinY = v1in.y + offY
    const BinZ = v1in.z + offZ

    const CinX = v2in.x + offX
    const CinY = v2in.y + offY
    const CinZ = v2in.z + offZ

    // Outer edges
    linePositions.push(AoutX, AoutY, AoutZ, BoutX, BoutY, BoutZ)
    linePositions.push(BoutX, BoutY, BoutZ, CoutX, CoutY, CoutZ)
    linePositions.push(CoutX, CoutY, CoutZ, AoutX, AoutY, AoutZ)

    // Inner edges
    linePositions.push(AinX, AinY, AinZ, BinX, BinY, BinZ)
    linePositions.push(BinX, BinY, BinZ, CinX, CinY, CinZ)
    linePositions.push(CinX, CinY, CinZ, AinX, AinY, AinZ)

    // Connecting pillars
    linePositions.push(AinX, AinY, AinZ, AoutX, AoutY, AoutZ)
    linePositions.push(BinX, BinY, BinZ, BoutX, BoutY, BoutZ)
    linePositions.push(CinX, CinY, CinZ, CoutX, CoutY, CoutZ)

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
 * Chunky Coin Body and Raised Rims
 */
let cachedCoinBodyGeometry: THREE.BufferGeometry | null = null
let cachedCoinEdgesGeometry: THREE.BufferGeometry | null = null

export function getCoinBodyGeometry(): THREE.BufferGeometry {
  if (cachedCoinBodyGeometry) return cachedCoinBodyGeometry

  const rawBody = new THREE.CylinderGeometry(0.42, 0.42, 0.1, 64)
  const bodyGeo = rawBody.index ? rawBody.toNonIndexed() : rawBody
  bodyGeo.rotateX(Math.PI / 2)

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

export function getCoinEdgesGeometry(): THREE.BufferGeometry {
  if (cachedCoinEdgesGeometry) return cachedCoinEdgesGeometry
  const coinBody = getCoinBodyGeometry()
  const edges = new THREE.EdgesGeometry(coinBody, 30)
  cachedCoinEdgesGeometry = edges
  return edges
}

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
