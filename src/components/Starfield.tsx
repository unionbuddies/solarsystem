import { useTexture, Stars } from '@react-three/drei'
import { BackSide } from 'three'
import { textureUrl } from '../textures'

/** Deep-space backdrop: a Milky Way sphere plus a layer of parallax stars. */
export function Starfield() {
  const map = useTexture(textureUrl('stars.jpg'))

  return (
    <>
      <mesh scale={[1, 1, 1]}>
        <sphereGeometry args={[600, 64, 64]} />
        <meshBasicMaterial map={map} side={BackSide} />
      </mesh>
      <Stars radius={300} depth={80} count={2500} factor={5} saturation={0} fade speed={0.4} />
    </>
  )
}
