import type { Object3D } from 'three'

// Live registry of each body's scene object so the camera rig can read a
// planet's current world position even while it orbits the Sun.
const registry = new Map<string, Object3D>()

export const registerBody = (id: string, obj: Object3D) => {
  registry.set(id, obj)
}

export const unregisterBody = (id: string) => {
  registry.delete(id)
}

export const getBodyObject = (id: string): Object3D | undefined => registry.get(id)
