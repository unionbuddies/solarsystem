import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import {
  DoubleSide,
  MathUtils,
  RingGeometry,
  Vector3,
  type Group,
  type Mesh,
} from 'three'
import type { Body } from '../data/bodies'
import { useStore } from '../store'
import { registerBody, unregisterBody } from '../bodyRegistry'
import { textureUrl } from '../textures'

// Deterministic starting angle so planets are spread around their orbits.
const startAngle = (id: string) => {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360
  return MathUtils.degToRad(h)
}

function Rings({ body }: { body: Body }) {
  const ring = body.ring!
  const map = useTexture(textureUrl('saturn_ring.png'))

  // Remap ring UVs so the strip texture runs radially (inner → outer edge).
  const geometry = useMemo(() => {
    const g = new RingGeometry(ring.inner, ring.outer, 128)
    const pos = g.attributes.position
    const v = new Vector3()
    const uv = g.attributes.uv
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i)
      const t = (v.length() - ring.inner) / (ring.outer - ring.inner)
      uv.setXY(i, t, 0.5)
    }
    return g
  }, [ring.inner, ring.outer])

  const useMap = body.id === 'saturn'

  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]}>
      {useMap ? (
        <meshBasicMaterial map={map} side={DoubleSide} transparent depthWrite={false} />
      ) : (
        <meshBasicMaterial color={ring.color} side={DoubleSide} transparent opacity={0.5} depthWrite={false} />
      )}
    </mesh>
  )
}

export function Planet({ body }: { body: Body }) {
  const holderRef = useRef<Group>(null)
  const meshRef = useRef<Mesh>(null)
  const theta = useRef(0)

  const map = useTexture(textureUrl(`${body.id}.jpg`))

  // Precompute the ellipse geometry (Sun sits at a focus, not the center) and
  // the orbit-plane orientation (inclination + ascending node).
  const orbit = useMemo(() => {
    const a = body.distance
    const e = body.eccentricity ?? 0
    return {
      a,
      b: a * Math.sqrt(1 - e * e),
      c: a * e,
      node: MathUtils.degToRad(body.node ?? 0),
      incl: MathUtils.degToRad(body.inclination ?? 0),
    }
  }, [body.distance, body.eccentricity, body.node, body.inclination])

  const select = useStore((s) => s.select)
  const setHovered = useStore((s) => s.setHovered)
  const hoveredId = useStore((s) => s.hoveredId)
  const paused = useStore((s) => s.paused)

  const hovered = hoveredId === body.id

  // Register this planet's mesh so the camera rig can follow its live position.
  useEffect(() => {
    if (meshRef.current) registerBody(body.id, meshRef.current)
    return () => unregisterBody(body.id)
  }, [body.id])

  // Seed the starting position along the orbit once.
  useEffect(() => {
    theta.current = startAngle(body.id)
  }, [body.id])

  useFrame((_, delta) => {
    if (!paused) theta.current += body.orbitSpeed * delta
    if (holderRef.current) {
      holderRef.current.position.set(
        orbit.a * Math.cos(theta.current) - orbit.c,
        0,
        orbit.b * Math.sin(theta.current),
      )
    }
    if (meshRef.current) meshRef.current.rotation.y += body.spinSpeed * delta
  })

  return (
    // Ascending node → inclination → position along the elliptical path.
    <group rotation={[0, orbit.node, 0]}>
      <group rotation={[orbit.incl, 0, 0]}>
        <group ref={holderRef}>
          <group rotation={[0, 0, MathUtils.degToRad(body.axialTilt)]}>
            <mesh
              ref={meshRef}
              onClick={(e) => {
                e.stopPropagation()
                select(body.id)
              }}
              onPointerOver={(e) => {
                e.stopPropagation()
                setHovered(body.id)
                document.body.style.cursor = 'pointer'
              }}
              onPointerOut={() => {
                setHovered(null)
                document.body.style.cursor = 'auto'
              }}
            >
              <sphereGeometry args={[body.radius, 64, 64]} />
              <meshStandardMaterial
                map={map}
                roughness={1}
                metalness={0}
                emissive="#ffffff"
                emissiveIntensity={hovered ? 0.06 : 0}
              />
            </mesh>

            {body.ring && <Rings body={body} />}
          </group>
        </group>
      </group>
    </group>
  )
}
