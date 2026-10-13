import type { CameraControls } from "@react-three/drei";
import * as THREE from "three";

/**
 * Positions the camera so the hose fills a consistent
 * fraction of the screen width (screenFillRatio), regardless of
 * the model's physical size.
 */
export const cameraHoseView = (
  scene: THREE.Object3D,
  cameraControls: CameraControls,
  screenFillRatio = 0.6,
): void => {
  // 1. Compute bounding box
  scene.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(scene);

  if (box.isEmpty()) return;

  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());

  // 2. Set boundary so camera cannot drift away from model
  const boundaryBox = box
    .clone()
    .expandByVector(
      new THREE.Vector3(size.x * 0.1, size.y * 0.1, size.z * 0.1),
    );
  if (typeof cameraControls.setBoundary === "function") {
    cameraControls.setBoundary(boundaryBox);
  }

  // 3. Get camera intrinsics (FOV + aspect ratio)
  const camera = cameraControls.camera as THREE.PerspectiveCamera;
  if (!camera || !camera.isPerspectiveCamera) return;

  const vFOV = THREE.MathUtils.degToRad(camera.fov);
  const hFOV = 2 * Math.atan(Math.tan(vFOV / 2) * camera.aspect);

  // 4. Compute distance so hose X-extent fills `screenFillRatio` of screen width
  const halfHoseWidth = size.x / 2;
  const d = halfHoseWidth / (Math.tan(hFOV / 2) * screenFillRatio);

  // 5. Clamp to reasonable limits
  const finalDistance = Math.max(d, 0.05);

  // 6. Expand maxDistance temporarily so setLookAt is not clamped
  cameraControls.maxDistance = Math.max(finalDistance * 2, 2.0);
  cameraControls.minDistance = 0.01;

  // 7. Set lookAt immediately looking at center
  cameraControls.setLookAt(
    center.x,
    center.y,
    center.z + finalDistance,
    center.x,
    center.y,
    center.z,
    false, // instant snap
  );

  // 8. Enforce balanced distance bounds
  cameraControls.maxDistance = finalDistance * 1.5;
  cameraControls.minDistance = finalDistance * 0.6;

  // 9. Force camera-controls internal state to update immediately
  if (typeof (cameraControls as any).update === "function") {
    (cameraControls as any).update(0);
  }
};
