export interface HeroBounds {
  top: number
  bottom: number
  left: number
  right: number
}

export interface HeroState {
  dividerX: number
  dividerY: number
  isDragging: boolean
  isVertical: boolean
  heroBounds: HeroBounds | null
}

const heroState: HeroState = {
  dividerX: typeof window !== 'undefined' ? window.innerWidth * 0.5 : 600,
  dividerY: typeof window !== 'undefined' ? window.innerHeight * 0.5 : 400,
  isDragging: false,
  isVertical: true,
  heroBounds: null,
}

export function setHeroDivider(
  x: number,
  y: number,
  isVertical: boolean,
  bounds: DOMRect | null
) {
  heroState.dividerX = x
  heroState.dividerY = y
  heroState.isVertical = isVertical
  if (bounds) {
    heroState.heroBounds = {
      top: bounds.top + window.scrollY,
      bottom: bounds.bottom + window.scrollY,
      left: bounds.left + window.scrollX,
      right: bounds.right + window.scrollX,
    }
  }
}

export function setHeroDragging(isDragging: boolean) {
  heroState.isDragging = isDragging
}

export function clearHeroState() {
  heroState.heroBounds = null
  heroState.isDragging = false
}

export function getHeroState(): Readonly<HeroState> {
  return heroState
}
