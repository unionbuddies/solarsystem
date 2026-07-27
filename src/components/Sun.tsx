import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { AdditiveBlending, BackSide, Color, type Group, type Mesh, type MeshBasicMaterial } from 'three'
import { useStore } from '../store'
import { bodyById } from '../data/bodies'
import { textureUrl } from '../textures'

// A few solar prominences flaring off the limb at fixed angles.
const PROMINENCES = [0.4, 1.4, 2.5, 3.6, 4.8, 5.7]

export function Sun() {
  const body = bodyById('sun')!
  const R = body.radius
  const meshRef = useRef<Mesh>(null)
  const shimmerRef = useRef<Mesh>(null)
  const corona1 = useRef<Mesh>(null)
  const corona2 = useRef<Mesh>(null)
  const promRefs = useRef<(Group | null)[]>([])
  const map = useTexture(textureUrl('sun.jpg'))
  // Push the surface above 1.0 luminance so the bloom pass makes it glow,
  // while sunlit planets stay below the bloom threshold.
  const glowColor = useMemo(() => new Color(1.9, 1.6, 1.3), [])

  const select = useStore((s) => s.select)
  const setHovered = useStore((s) => s.setHovered)

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    if (meshRef.current) meshRef.current.rotation.y += body.spinSpeed * delta
    // Churning shimmer rotating against the surface.
    if (shimmerRef.current) {
      shimmerRef.current.rotation.y -= body.spinSpeed * 0.6 * delta
      ;(shimmerRef.current.material as MeshBasicMaterial).opacity = 0.14 + 0.08 * Math.sin(t * 3.1)
    }
    // Breathing corona.
    const pulse = 1 + 0.03 * Math.sin(t * 1.3) + 0.02 * Math.sin(t * 2.7)
    if (corona1.current) corona1.current.scale.setScalar(1.15 * pulse)
    if (corona2.current) corona2.current.scale.setScalar(1.4 * pulse)
    // Flickering prominences.
    for (let i = 0; i < PROMINENCES.length; i++) {
      const p = promRefs.current[i]
      if (!p) continue
      const f = 0.6 + 0.4 * Math.sin(t * (2 + i * 0.3) + i)
      p.scale.set(1, 0.7 + 0.6 * f, 1)
    }
  })

  return (
    <group>
      {/* Warm light cast across the whole system, casting shadows */}
      <pointLight
        position={[0, 0, 0]}
        intensity={3}
        distance={0}
        decay={0}
        color="#fff2df"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={240}
        shadow-bias={-0.0004}
      />

      {/* The visible photosphere */}
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation()
          select('sun')
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered('sun')
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHovered(null)
          document.body.style.cursor = 'auto'
        }}
      >
        <sphereGeometry args={[R, 64, 64]} />
        <meshBasicMaterial map={map} color={glowColor} toneMapped={false} />
      </mesh>

      {/* Churning surface shimmer */}
      <mesh ref={shimmerRef} scale={1.02}>
        <sphereGeometry args={[R, 48, 48]} />
        <meshBasicMaterial map={map} color="#ffcf7a" transparent opacity={0.16} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>

      {/* Prominences flaring off the limb */}
      {PROMINENCES.map((angle, i) => (
        <group key={i} rotation={[0, angle, 0]} ref={(el) => (promRefs.current[i] = el)}>
          <mesh position={[R * 1.05, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
            <coneGeometry args={[R * 0.16, R * 0.5, 8, 1, true]} />
            <meshBasicMaterial color="#ff7a1e" transparent opacity={0.5} side={BackSide} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
          </mesh>
        </group>
      ))}

      {/* Two additive shells fake a soft corona glow */}
      <mesh ref={corona1} scale={1.15}>
        <sphereGeometry args={[R, 32, 32]} />
        <meshBasicMaterial color="#ff8a2a" transparent opacity={0.25} side={BackSide} blending={AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh ref={corona2} scale={1.4}>
        <sphereGeometry args={[R, 32, 32]} />
        <meshBasicMaterial color="#ff5a1a" transparent opacity={0.12} side={BackSide} blending={AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  )
}
