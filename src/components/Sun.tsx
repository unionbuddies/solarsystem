import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { AdditiveBlending, BackSide, Color, type Mesh } from 'three'
import { useStore } from '../store'
import { bodyById } from '../data/bodies'
import { textureUrl } from '../textures'

export function Sun() {
  const body = bodyById('sun')!
  const meshRef = useRef<Mesh>(null)
  const map = useTexture(textureUrl('sun.jpg'))
  // Push the surface above 1.0 luminance so the bloom pass makes it glow,
  // while sunlit planets stay below the bloom threshold.
  const glowColor = useMemo(() => new Color(1.9, 1.6, 1.3), [])

  const select = useStore((s) => s.select)
  const setHovered = useStore((s) => s.setHovered)

  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += body.spinSpeed * delta
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
        <sphereGeometry args={[body.radius, 64, 64]} />
        <meshBasicMaterial map={map} color={glowColor} toneMapped={false} />
      </mesh>

      {/* Two additive shells fake a soft corona glow */}
      <mesh scale={1.15}>
        <sphereGeometry args={[body.radius, 32, 32]} />
        <meshBasicMaterial color="#ff8a2a" transparent opacity={0.25} side={BackSide} blending={AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh scale={1.4}>
        <sphereGeometry args={[body.radius, 32, 32]} />
        <meshBasicMaterial color="#ff5a1a" transparent opacity={0.12} side={BackSide} blending={AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  )
}
