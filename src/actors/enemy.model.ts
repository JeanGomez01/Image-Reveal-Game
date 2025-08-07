// Enemigo simple
interface Enemy {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
}

export const enemies: Enemy[] = [
  { x: 150, y: 150, vx: 2, vy: 1.5, radius: 30 }
]