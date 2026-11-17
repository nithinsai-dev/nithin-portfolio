import { useMemo } from 'react'
import * as THREE from 'three'
import { COIN_SYMBOL } from '../lib/coinConfig'

// Single shared CircleGeometry of radius 0.34
let sharedDiscGeo: THREE.CircleGeometry | null = null

export function getSharedDiscGeometry(): THREE.CircleGeometry {
  if (!sharedDiscGeo) {
    sharedDiscGeo = new THREE.CircleGeometry(0.34, 64)
  }
  return sharedDiscGeo
}

let cachedSolidTexture: THREE.CanvasTexture | null = null
let cachedBreakerTexture: THREE.CanvasTexture | null = null

function drawSymbolToCanvas(
  canvas: HTMLCanvasElement,
  variant: 'solid' | 'breaker',
  onReady?: () => void
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, 1024, 1024)

  const isSolid = variant === 'solid'
  const strokeColor = isSolid ? '#1A0F10' : '#F2C14E'

  if (COIN_SYMBOL === 'chevrons') {
    // 1. Three upward-pointing chevrons stacked vertically, centred on (512, 512)
    // Left arm start (342, y + 110), apex (512, y), right arm end (682, y + 110)
    // y = 345, 455, 565. Solid lineWidth 58, Breaker lineWidth 6.
    ctx.strokeStyle = strokeColor
    ctx.lineJoin = 'miter'
    ctx.miterLimit = 10
    ctx.lineCap = 'butt'
    ctx.lineWidth = isSolid ? 58 : 6

    const yList = [345, 455, 565]
    for (const y of yList) {
      ctx.beginPath()
      ctx.moveTo(342, y + 110)
      ctx.lineTo(512, y)
      ctx.lineTo(682, y + 110)
      ctx.stroke()
    }

    // 2. One thin ring around everything: radius 340, lineWidth 10 (or 6 for breaker), no fill
    ctx.beginPath()
    ctx.arc(512, 512, 340, 0, Math.PI * 2)
    ctx.lineWidth = isSolid ? 10 : 6
    ctx.strokeStyle = strokeColor
    ctx.stroke()

    if (onReady) onReady()
  } else {
    // "N" drawing: bold "N" in Bricolage Grotesque 800, centred, font-size ~560px + thin ring
    const renderN = () => {
      ctx.clearRect(0, 0, 1024, 1024)

      ctx.font = '800 560px "Bricolage Grotesque"'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      if (isSolid) {
        ctx.fillStyle = '#1A0F10'
        ctx.fillText('N', 512, 512)
      } else {
        ctx.strokeStyle = '#F2C14E'
        ctx.lineWidth = 6
        ctx.strokeText('N', 512, 512)
      }

      // Thin ring around everything
      ctx.beginPath()
      ctx.arc(512, 512, 340, 0, Math.PI * 2)
      ctx.lineWidth = isSolid ? 10 : 6
      ctx.strokeStyle = strokeColor
      ctx.stroke()

      if (onReady) onReady()
    }

    if (typeof document !== 'undefined' && document.fonts) {
      document.fonts.load('800 560px "Bricolage Grotesque"').then(renderN).catch(renderN)
    } else {
      renderN()
    }
  }
}

export function getCoinSymbolTexture(variant: 'solid' | 'breaker'): THREE.CanvasTexture {
  if (variant === 'solid' && cachedSolidTexture) return cachedSolidTexture
  if (variant === 'breaker' && cachedBreakerTexture) return cachedBreakerTexture

  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 1024

  const texture = new THREE.CanvasTexture(canvas)
  texture.anisotropy = 8
  texture.colorSpace = THREE.SRGBColorSpace
  texture.generateMipmaps = true
  texture.minFilter = THREE.LinearMipmapLinearFilter
  texture.magFilter = THREE.LinearFilter

  drawSymbolToCanvas(canvas, variant, () => {
    texture.needsUpdate = true
  })

  if (variant === 'solid') {
    cachedSolidTexture = texture
  } else {
    cachedBreakerTexture = texture
  }

  return texture
}

let cachedSolidMaterial: THREE.MeshStandardMaterial | null = null
let cachedBreakerMaterial: THREE.MeshStandardMaterial | null = null

export function getCoinSymbolMaterial(variant: 'solid' | 'breaker'): THREE.MeshStandardMaterial {
  if (variant === 'solid') {
    if (!cachedSolidMaterial) {
      cachedSolidMaterial = new THREE.MeshStandardMaterial({
        map: getCoinSymbolTexture('solid'),
        transparent: true,
        roughness: 0.8,
        metalness: 0,
        emissive: new THREE.Color(0x000000),
        emissiveIntensity: 0,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
        depthWrite: false,
      })
    }
    return cachedSolidMaterial
  } else {
    if (!cachedBreakerMaterial) {
      cachedBreakerMaterial = new THREE.MeshStandardMaterial({
        map: getCoinSymbolTexture('breaker'),
        transparent: true,
        roughness: 0.8,
        metalness: 0,
        emissive: new THREE.Color(0x000000),
        emissiveIntensity: 0,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
        depthWrite: false,
      })
    }
    return cachedBreakerMaterial
  }
}

interface CoinSymbolProps {
  variant: 'solid' | 'breaker'
}

/**
 * Shared Coin Symbol Component
 * Renders identical thin discs with the 1024x1024 CanvasTexture on both faces
 * (0.004 above front at z = +0.054, and 0.004 above back at z = -0.054)
 */
export default function CoinSymbol({ variant }: CoinSymbolProps) {
  const geo = useMemo(() => getSharedDiscGeometry(), [])
  const mat = useMemo(() => getCoinSymbolMaterial(variant), [variant])

  return (
    <group>
      {/* Front Face: 0.004 above coin face (coin face z = +0.05) */}
      <mesh
        geometry={geo}
        material={mat}
        position={[0, 0, 0.054]}
      />

      {/* Back Face: 0.004 above back face (coin face z = -0.05), flipped around Y */}
      <mesh
        geometry={geo}
        material={mat}
        position={[0, 0, -0.054]}
        rotation={[0, Math.PI, 0]}
      />
    </group>
  )
}
