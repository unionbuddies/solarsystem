import { useMemo } from 'react'
import { Line } from '@react-three/drei'
import { MathUtils, Vector3 } from 'three'
import { bodies } from '../data/bodies'
import { useStore } from '../store'

/** Faint guide rings tracing each planet's elliptical, inclined orbital path. */
export function Orbits() {
  const showOrbits = useStore((s) => s.showOrbits)
  const orbits = useMemo(() => {
    return bodies
      .filter((b) => b.type === 'planet')
      .map((b) => {
        const a = b.distance
        const e = b.eccentricity ?? 0
        const bAxis = a * Math.sqrt(1 - e * e)
        const c = a * e // focus offset — keeps the Sun at a focus, not the center

        const points: Vector3[] = []
        const segments = 200
        for (let i = 0; i <= segments; i++) {
          const t = (i / segments) * Math.PI * 2
          points.push(new Vector3(a * Math.cos(t) - c, 0, bAxis * Math.sin(t)))
        }
        return {
          id: b.id,
          points,
          node: MathUtils.degToRad(b.node ?? 0),
          incl: MathUtils.degToRad(b.inclination ?? 0),
        }
      })
  }, [])

  if (!showOrbits) return null

  return (
    <group>
      {orbits.map((o) => (
        <group key={o.id} rotation={[0, o.node, 0]}>
          <group rotation={[o.incl, 0, 0]}>
            <Line points={o.points} color="#4a5578" transparent opacity={0.35} lineWidth={1} />
          </group>
        </group>
      ))}
    </group>
  )
}
