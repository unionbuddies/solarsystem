import { useLayoutEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Object3D, type Group, type InstancedMesh } from 'three'

const COUNT = 2200
const INNER = 33 // just outside Mars (orbit 31)
const OUTER = 41 // just inside Jupiter (orbit 44)

// A faint band of instanced rocks orbiting between Mars and Jupiter.
export function AsteroidBelt() {
  const groupRef = useRef<Group>(null)
  const meshRef = useRef<InstancedMesh>(null)

  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    const dummy = new Object3D()
    // Deterministic pseudo-random placement (seeded, no Math.random dependency).
    let s = 1234.567
    const rand = () => {
      s = Math.sin(s) * 43758.5453
      return s - Math.floor(s)
    }
    for (let i = 0; i < COUNT; i++) {
      const angle = rand() * Math.PI * 2
      const radius = INNER + rand() * (OUTER - INNER)
      const y = (rand() - 0.5) * 2.2
      dummy.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius)
      dummy.rotation.set(rand() * Math.PI, rand() * Math.PI, rand() * Math.PI)
      const scale = 0.03 + rand() * 0.12
      dummy.scale.setScalar(scale)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  }, [])

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += 0.01 * delta
  })

  return (
    <group ref={groupRef}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#8a7f70" roughness={1} metalness={0} flatShading />
      </instancedMesh>
    </group>
  )
}
