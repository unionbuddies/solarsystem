import { OrbitControls } from '@react-three/drei'
import { bodies } from '../data/bodies'
import { Starfield } from './Starfield'
import { Sun } from './Sun'
import { Planet } from './Planet'
import { Orbits } from './Orbits'
import { CameraRig } from './CameraRig'

/** All the 3D content that lives inside the main <Canvas>. */
export function Scene() {
  return (
    <>
      <ambientLight intensity={0.12} />
      <Starfield />
      <Orbits />
      <Sun />
      {bodies
        .filter((b) => b.type === 'planet')
        .map((b) => (
          <Planet key={b.id} body={b} />
        ))}

      <CameraRig />
      <OrbitControls
        makeDefault
        enablePan={false}
        minDistance={10}
        maxDistance={320}
        zoomSpeed={0.8}
        rotateSpeed={0.5}
      />
    </>
  )
}
