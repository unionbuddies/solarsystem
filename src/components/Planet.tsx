import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import {
  AdditiveBlending,
  BackSide,
  Color,
  DoubleSide,
  MathUtils,
  RingGeometry,
  Vector3,
  type Group,
  type Mesh,
  type Texture,
} from 'three'
import type { Body, Moon as MoonData } from '../data/bodies'
import { REAL_SCALE_K, currentMeanLongitude } from '../data/bodies'
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
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} castShadow>
      {useMap ? (
        <meshBasicMaterial map={map} side={DoubleSide} transparent depthWrite={false} />
      ) : (
        <meshBasicMaterial color={ring.color} side={DoubleSide} transparent opacity={0.5} depthWrite={false} />
      )}
    </mesh>
  )
}

/** Cloud layer, night-side city lights, and an atmospheric rim glow for Earth. */
function EarthExtras({ radius }: { radius: number }) {
  const clouds = useTexture(textureUrl('earth_clouds.jpg'))
  const night = useTexture(textureUrl('earth_night.jpg'))
  const cloudRef = useRef<Mesh>(null)
  const nightRef = useRef<Mesh>(null)

  useFrame((_, delta) => {
    if (cloudRef.current) cloudRef.current.rotation.y += 0.06 * delta
    if (nightRef.current) nightRef.current.rotation.y += 0.05 * delta
  })

  return (
    <>
      {/* City lights — additive, so they only read on the dark night side */}
      <mesh ref={nightRef}>
        <sphereGeometry args={[radius * 1.002, 64, 64]} />
        <meshBasicMaterial map={night} blending={AdditiveBlending} transparent depthWrite={false} />
      </mesh>
      {/* Drifting cloud deck */}
      <mesh ref={cloudRef}>
        <sphereGeometry args={[radius * 1.015, 64, 64]} />
        <meshStandardMaterial map={clouds} alphaMap={clouds} transparent depthWrite={false} opacity={0.9} />
      </mesh>
      {/* Soft blue atmosphere */}
      <mesh>
        <sphereGeometry args={[radius * 1.07, 48, 48]} />
        <meshBasicMaterial color="#5a9bff" transparent opacity={0.14} side={BackSide} blending={AdditiveBlending} depthWrite={false} />
      </mesh>
    </>
  )
}

function MoonBody({ moon, map, seed }: { moon: MoonData; map: Texture; seed: number }) {
  const orbitRef = useRef<Group>(null)
  const color = useMemo(() => new Color(moon.color), [moon.color])

  useEffect(() => {
    if (orbitRef.current) orbitRef.current.rotation.y = seed * 1.7
  }, [seed])

  useFrame((_, delta) => {
    if (orbitRef.current) orbitRef.current.rotation.y += moon.speed * delta
  })

  return (
    <group ref={orbitRef}>
      <mesh position={[moon.distance, 0, 0]} castShadow receiveShadow raycast={() => null}>
        <sphereGeometry args={[moon.radius, 32, 32]} />
        <meshStandardMaterial map={map} color={color} roughness={1} />
      </mesh>
    </group>
  )
}

function Moons({ moons }: { moons: MoonData[] }) {
  const map = useTexture(textureUrl('moon.jpg')) as Texture
  return (
    <>
      {moons.map((m, i) => (
        <MoonBody key={m.name} moon={m} map={map} seed={i} />
      ))}
    </>
  )
}

export function Planet({ body }: { body: Body }) {
  const holderRef = useRef<Group>(null)
  const scaleRef = useRef<Group>(null)
  const meshRef = useRef<Mesh>(null)
  const theta = useRef(0)
  const scaleVal = useRef(1)

  const map = useTexture(textureUrl(`${body.id}.jpg`))

  const select = useStore((s) => s.select)
  const setHovered = useStore((s) => s.setHovered)
  const hoveredId = useStore((s) => s.hoveredId)
  const paused = useStore((s) => s.paused)
  const realScale = useStore((s) => s.realScale)
  const today = useStore((s) => s.today)

  const hovered = hoveredId === body.id
  const isEarth = body.id === 'earth'

  // Ellipse geometry (Sun at a focus) and orbit-plane orientation.
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

  const realRatio = useMemo(() => (body.diameterKm * REAL_SCALE_K) / body.radius, [body.diameterKm, body.radius])

  // Register this planet's mesh so the camera rig can follow its live position.
  useEffect(() => {
    if (meshRef.current) registerBody(body.id, meshRef.current)
    return () => unregisterBody(body.id)
  }, [body.id])

  // Seed the starting position — either an artistic spread or today's real alignment.
  useEffect(() => {
    if (today) {
      const L = currentMeanLongitude(body)
      theta.current = L != null ? MathUtils.degToRad(L) - orbit.node : startAngle(body.id)
    } else {
      theta.current = startAngle(body.id)
    }
  }, [body, today, orbit.node])

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

    // Smoothly morph the body toward its true relative size (moons excluded).
    const target = realScale ? realRatio : 1
    scaleVal.current = MathUtils.damp(scaleVal.current, target, 4, delta)
    if (scaleRef.current) scaleRef.current.scale.setScalar(scaleVal.current)
  })

  return (
    // Ascending node → inclination → position along the elliptical path → tilt.
    <group rotation={[0, orbit.node, 0]}>
      <group rotation={[orbit.incl, 0, 0]}>
        <group ref={holderRef}>
          <group rotation={[0, 0, MathUtils.degToRad(body.axialTilt)]}>
            <group ref={scaleRef}>
              <mesh
                ref={meshRef}
                castShadow
                receiveShadow
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

              {isEarth && <EarthExtras radius={body.radius} />}
              {body.ring && <Rings body={body} />}
            </group>

            {body.moons && <Moons moons={body.moons} />}
          </group>
        </group>
      </group>
    </group>
  )
}
