import { OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { bodies } from '../data/bodies'
import { Starfield } from './Starfield'
import { Sun } from './Sun'
import { Planet } from './Planet'
import { Orbits } from './Orbits'
import { AsteroidBelt } from './AsteroidBelt'
import { Meteors } from './Meteors'
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
      <AsteroidBelt />
      <Meteors />

      <CameraRig />
      <OrbitControls
        makeDefault
        enablePan={false}
        zoomToCursor
        minDistance={10}
        maxDistance={320}
        zoomSpeed={0.8}
        rotateSpeed={0.5}
      />

      <EffectComposer>
        <Bloom intensity={0.9} luminanceThreshold={1} luminanceSmoothing={0.9} mipmapBlur />
      </EffectComposer>
    </>
  )
}
