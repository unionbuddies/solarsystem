import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { AdditiveBlending, BackSide, type Mesh } from 'three'
import { useStore } from '../store'
import { bodyById } from '../data/bodies'
import { textureUrl } from '../textures'

export function Sun() {
  const body = bodyById('sun')!
  const meshRef = useRef<Mesh>(null)
  const map = useTexture(textureUrl('sun.jpg'))

  const select = useStore((s) => s.select)
  const setHovered = useStore((s) => s.setHovered)

  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += body.spinSpeed * delta
  })

  return (
    <group>
      {/* Warm light cast across the whole system */}
      <pointLight position={[0, 0, 0]} intensity={3} distance={0} decay={0} color="#fff2df" />

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
        <meshBasicMaterial map={map} toneMapped={false} />
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
