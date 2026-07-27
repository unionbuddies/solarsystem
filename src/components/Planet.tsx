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
  type MeshBasicMaterial,
  type Texture,
} from 'three'
import type { Body, Moon as MoonData } from '../data/bodies'
import { REAL_SCALE_K, meanLongitudeAt } from '../data/bodies'
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
  const auroraN = useRef<Mesh>(null)
  const auroraS = useRef<Mesh>(null)

  useFrame((state, delta) => {
    if (cloudRef.current) cloudRef.current.rotation.y += 0.06 * delta
    if (nightRef.current) nightRef.current.rotation.y += 0.05 * delta
    // Shimmering aurora flicker.
    const t = state.clock.elapsedTime
    const flick = Math.max(0.08, 0.24 + 0.14 * Math.sin(t * 2.3) + 0.07 * Math.sin(t * 5.9))
    for (const a of [auroraN.current, auroraS.current]) {
      if (a) (a.material as MeshBasicMaterial).opacity = flick
    }
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
      {/* Auroral ovals glowing at the poles */}
      <mesh ref={auroraN} position={[0, radius * 0.84, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius * 0.5, radius * 0.055, 12, 48]} />
        <meshBasicMaterial color="#5affb4" transparent opacity={0.25} blending={AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh ref={auroraS} position={[0, -radius * 0.84, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius * 0.5, radius * 0.055, 12, 48]} />
        <meshBasicMaterial color="#5affb4" transparent opacity={0.25} blending={AdditiveBlending} depthWrite={false} />
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

  // Seed the artistic starting position once.
  useEffect(() => {
    theta.current = startAngle(body.id)
  }, [body.id])

  useFrame((_, delta) => {
    // Read motion-related state live so scrubbing the date doesn't re-render.
    const st = useStore.getState()

    if (st.today) {
      // Freeze to the real alignment for the scrubbed date.
      const L = meanLongitudeAt(body, st.dateOffsetDays)
      if (L != null) theta.current = MathUtils.degToRad(L) - orbit.node
    } else if (!st.paused || st.follow) {
      // Orbit normally; follow mode keeps things moving while a planet is focused.
      theta.current += body.orbitSpeed * delta
    }

    if (holderRef.current) {
      holderRef.current.position.set(
        orbit.a * Math.cos(theta.current) - orbit.c,
        0,
        orbit.b * Math.sin(theta.current),
      )
    }
    if (meshRef.current) meshRef.current.rotation.y += body.spinSpeed * delta

    // Smoothly morph the body toward its true relative size (moons excluded).
    const target = st.realScale ? realRatio : 1
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
