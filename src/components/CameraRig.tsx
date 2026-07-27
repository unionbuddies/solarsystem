import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { PerspectiveCamera, Vector3 } from 'three'
import { useStore } from '../store'
import { bodyById } from '../data/bodies'
import { getBodyObject } from '../bodyRegistry'

const OVERVIEW_POS = new Vector3(0, 48, 118)
const OVERVIEW_TARGET = new Vector3(0, 0, 0)
const UP = new Vector3(0, 1, 0)
// Matches the info panel's max width (Tailwind max-w-[440px]).
const PANEL_WIDTH = 440
// Below this width the panel becomes a bottom sheet (Tailwind `sm`).
const MOBILE_BREAKPOINT = 640

/** Flies the camera to a focused body (or back to the overview) on selection
 *  change, then releases control to OrbitControls so the user can freely
 *  drag-to-orbit and scroll-to-zoom. */
export function CameraRig() {
  const selectedId = useStore((s) => s.selectedId)
  const controls = useThree((s) => s.controls) as unknown as
    | { target: Vector3; update: () => void; minDistance: number }
    | undefined
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)

  const flying = useRef(false)
  const desiredPos = useRef(new Vector3())
  const desiredTarget = useRef(new Vector3())
  const worldPos = useRef(new Vector3())
  const radial = useRef(new Vector3())
  const tangent = useRef(new Vector3())
  const offset = useRef(new Vector3())
  const followVec = useRef(new Vector3())
  const followHas = useRef(false)
  const tmpDelta = useRef(new Vector3())

  // Kick off a fly-to whenever the selection changes.
  useEffect(() => {
    flying.current = true
  }, [selectedId])

  // Shift the camera lens so the focused body centers in the free space, not
  // behind the info panel: left of a desktop sidebar, or above a mobile sheet.
  useEffect(() => {
    if (!(camera instanceof PerspectiveCamera)) return
    if (!selectedId) {
      camera.clearViewOffset()
      return
    }
    if (size.width < MOBILE_BREAKPOINT) {
      // Bottom sheet — push content up so the body sits above it.
      const sheet = size.height * 0.62
      camera.setViewOffset(size.width, size.height, 0, sheet / 2, size.width, size.height)
    } else {
      // Right sidebar — push content left by half the panel width.
      const panel = Math.min(PANEL_WIDTH, size.width)
      if (size.width - panel > 200) {
        camera.setViewOffset(size.width, size.height, panel / 2, 0, size.width, size.height)
      } else {
        camera.clearViewOffset()
      }
    }
    return () => {
      if (camera instanceof PerspectiveCamera) camera.clearViewOffset()
    }
  }, [selectedId, camera, size.width, size.height])

  useFrame((state, delta) => {
    if (!flying.current) {
      // Follow mode: translate the whole rig by the planet's per-frame movement
      // so it stays framed while the user can still orbit/zoom around it.
      if (useStore.getState().follow && selectedId) {
        const obj = getBodyObject(selectedId)
        if (obj && controls) {
          obj.getWorldPosition(worldPos.current)
          if (followHas.current) {
            tmpDelta.current.subVectors(worldPos.current, followVec.current)
            state.camera.position.add(tmpDelta.current)
            controls.target.add(tmpDelta.current)
            controls.update()
          }
          followVec.current.copy(worldPos.current)
          followHas.current = true
        }
      } else {
        followHas.current = false
      }
      return
    }

    // Reset follow tracking during a fly-to so it re-initialises cleanly after.
    followHas.current = false

    if (selectedId) {
      const body = bodyById(selectedId)
      if (!body) {
        flying.current = false
        return
      }
      const obj = getBodyObject(selectedId)
      if (obj) obj.getWorldPosition(worldPos.current)
      else worldPos.current.set(0, 0, 0)

      desiredTarget.current.copy(worldPos.current)

      // Frame every body to a similar apparent size by scaling the distance to
      // its extent (rings included), so small planets fill the view just like
      // the gas giants. Also drop the min zoom so you can get close to them.
      const extent = body.ring ? body.ring.outer : body.radius
      const dist = extent * 3.4
      if (controls) controls.minDistance = Math.max(1.5, extent * 1.2)

      // Frame the body from above and to the side (along its orbit) rather than
      // from directly behind it, so the Sun stays out of the background.
      radial.current.copy(worldPos.current)
      if (radial.current.lengthSq() < 0.001) {
        // The Sun itself (at origin) — just view it head-on and slightly above.
        offset.current.set(0, 0.35, 1).normalize()
      } else {
        radial.current.normalize()
        tangent.current.crossVectors(UP, radial.current).normalize()
        offset.current
          .copy(tangent.current)
          .multiplyScalar(0.8)
          .addScaledVector(UP, 0.65)
          .addScaledVector(radial.current, 0.2)
          .normalize()
      }
      desiredPos.current.copy(worldPos.current).addScaledVector(offset.current, dist)
    } else {
      desiredPos.current.copy(OVERVIEW_POS)
      desiredTarget.current.copy(OVERVIEW_TARGET)
      if (controls) controls.minDistance = 10
    }

    // Frame-rate independent smoothing toward the desired framing.
    const k = 1 - Math.pow(0.0016, delta)
    state.camera.position.lerp(desiredPos.current, k)
    if (controls) {
      controls.target.lerp(desiredTarget.current, k)
      controls.update()
    }

    // Arrived — release the camera back to the user.
    if (state.camera.position.distanceTo(desiredPos.current) < 0.4) {
      flying.current = false
    }
  })

  return null
}
