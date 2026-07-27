import { useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, useTexture } from '@react-three/drei'
import { DoubleSide, Plane, Vector3 } from 'three'
import type { Body } from '../data/bodies'
import { textureUrl } from '../textures'

const R = 1.6 // display radius of the cutaway model

function CutawayModel({ body }: { body: Body }) {
  const surface = useTexture(textureUrl(`${body.id}.jpg`))

  // Clip away the hemisphere facing the camera (+z) to expose the interior.
  const clip = useMemo(() => [new Plane(new Vector3(0, 0, -1), 0)], [])

  // Rounded shells (largest first) — their far hemispheres form the exterior.
  const shells = useMemo(
    () =>
      [...body.layers]
        .sort((a, b) => b.outerRadius - a.outerRadius)
        .map((l) => ({ ...l, r: l.outerRadius * R })),
    [body],
  )

  // Flat caps at the cut face: smaller discs drawn slightly in front of larger
  // ones so the concentric layers read as an onion cross-section.
  const caps = useMemo(
    () =>
      [...body.layers]
        .sort((a, b) => b.outerRadius - a.outerRadius)
        .map((l, i, arr) => ({
          color: l.color,
          r: l.outerRadius * R,
          z: -0.02 + (i / arr.length) * 0.015,
        })),
    [body],
  )

  return (
    <group rotation={[0.15, 0, 0]}>
      {shells.map((s, i) => (
        <mesh key={`shell-${i}`}>
          <sphereGeometry args={[s.r, 64, 64]} />
          <meshStandardMaterial
            color={s.color}
            map={i === 0 ? surface : undefined}
            roughness={0.75}
            metalness={0.05}
            side={DoubleSide}
            clippingPlanes={clip}
          />
        </mesh>
      ))}
      {caps.map((c, i) => (
        <mesh key={`cap-${i}`} position={[0, 0, c.z]}>
          <circleGeometry args={[c.r, 64]} />
          <meshStandardMaterial color={c.color} roughness={0.9} side={DoubleSide} />
        </mesh>
      ))}
    </group>
  )
}

export function Cutaway({ body }: { body: Body }) {
  return (
    <Canvas
      camera={{ position: [R * 2.5, R * 1.0, R * 1.7], fov: 42 }}
      gl={{ localClippingEnabled: true }}
      dpr={[1, 2]}
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[2, 3, 5]} intensity={1.6} />
      <pointLight position={[0, 0, 6]} intensity={0.6} />
      <CutawayModel body={body} />
      <OrbitControls enablePan={false} enableZoom={false} rotateSpeed={0.5} />
    </Canvas>
  )
}
