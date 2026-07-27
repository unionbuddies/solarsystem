import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, Quaternion, Vector3, type Mesh, type MeshBasicMaterial } from 'three'

const COUNT = 12
const STREAK_LEN = 9

interface Meteor {
  pos: Vector3
  vel: Vector3
  life: number
  maxLife: number
  delay: number
}

// A random unit vector, biased toward the upper hemisphere.
function randUnit(): Vector3 {
  const u = Math.random() * 2 - 1
  const theta = Math.random() * Math.PI * 2
  const r = Math.sqrt(1 - u * u)
  return new Vector3(r * Math.cos(theta), Math.abs(u) * 0.7 + 0.15, r * Math.sin(theta)).normalize()
}

function respawn(m: Meteor) {
  m.pos.copy(randUnit()).multiplyScalar(160 + Math.random() * 110)
  // Velocity roughly tangential to its position, so it streaks across the sky.
  m.vel.crossVectors(m.pos, randUnit()).normalize().multiplyScalar(55 + Math.random() * 85)
  m.vel.y -= 12
  m.maxLife = 0.8 + Math.random() * 1.2
  m.life = m.maxLife
}

/** Occasional shooting stars drifting through the deep-space background. */
export function Meteors() {
  const meteors = useMemo<Meteor[]>(
    () =>
      Array.from({ length: COUNT }, () => ({
        pos: new Vector3(),
        vel: new Vector3(),
        life: 0,
        maxLife: 1,
        delay: Math.random() * 8,
      })),
    [],
  )
  const refs = useRef<(Mesh | null)[]>([])
  const up = useMemo(() => new Vector3(0, 1, 0), [])
  const q = useMemo(() => new Quaternion(), [])
  const dir = useMemo(() => new Vector3(), [])

  useFrame((_, delta) => {
    for (let i = 0; i < meteors.length; i++) {
      const m = meteors[i]
      const mesh = refs.current[i]
      if (!mesh) continue

      if (m.life <= 0) {
        mesh.visible = false
        m.delay -= delta
        if (m.delay <= 0) respawn(m)
        continue
      }

      m.life -= delta
      if (m.life <= 0) {
        m.delay = 2.5 + Math.random() * 7
        continue
      }

      m.pos.addScaledVector(m.vel, delta)
      mesh.visible = true
      mesh.position.copy(m.pos)
      dir.copy(m.vel).normalize()
      q.setFromUnitVectors(up, dir)
      mesh.quaternion.copy(q)

      const p = 1 - m.life / m.maxLife // 0 → 1 across its life
      ;(mesh.material as MeshBasicMaterial).opacity = 0.9 * Math.sin(p * Math.PI)
    }
  })

  return (
    <group>
      {meteors.map((_, i) => (
        <mesh
          key={i}
          ref={(el) => (refs.current[i] = el)}
          visible={false}
          raycast={() => null}
        >
          <coneGeometry args={[0.13, STREAK_LEN, 6]} />
          <meshBasicMaterial color="#eaf2ff" transparent opacity={0} blending={AdditiveBlending} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}
