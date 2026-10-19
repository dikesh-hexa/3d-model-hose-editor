import { useGLTF, ContactShadows } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { observer } from 'mobx-react-lite';
import React, { useEffect, useState } from 'react';
import * as THREE from 'three';

import { useMainContext } from '../../hooks/useMainContext';
import { hosePipeBoundingBox } from '../../utils/hosePipeBoundingBox';
import { cameraHoseView } from '../../utils/cameraHoseView';
import { getShadowProps } from '../../utils/getShadowProps';

type ShadowProps = NonNullable<ReturnType<typeof getShadowProps>>;

export interface ModelStats {
  meshCount: number;
  vertexCount: number;
  triangleCount: number;
  dimensions: { x: number; y: number; z: number };
}

interface TestModelLoaderProps {
  url: string;
  onModelLoaded?: (stats: ModelStats) => void;
  resetTrigger?: number;
}

export const TestModelLoader: React.FC<TestModelLoaderProps> = observer(({
  url,
  onModelLoaded,
  resetTrigger = 0,
}) => {
  const gltf = useGLTF(url);
  const scene = gltf.scene as THREE.Group;

  const { design3DManager } = useMainContext();
  const { hosePipe3DManager, cameraManager } = design3DManager;
  const { gl, invalidate } = useThree();
  const [shadowProps, setShadowProps] = useState<ShadowProps | null>(null);

  useEffect(() => {
    if (!scene) return;

    // Calculate bounds & shadows
    const bounds = hosePipeBoundingBox(scene);
    if (bounds) {
      hosePipe3DManager.setBounds(bounds.minX, bounds.maxX);
    }

    const calculatedShadowProps = getShadowProps(scene);
    setShadowProps(calculatedShadowProps);

    // Frame camera to fit model
    const applyFraming = () => {
      const cameraControls = cameraManager.cameraRef;
      if (cameraControls) {
        cameraHoseView(scene, cameraControls, 0.6);
        invalidate();
        return true;
      }
      return false;
    };

    if (!applyFraming()) {
      const timer = setTimeout(applyFraming, 60);
      return () => clearTimeout(timer);
    } else {
      requestAnimationFrame(applyFraming);
    }

    // Configure textures for sharp rendering (matching HosePipeModel)
    let meshes = 0;
    let vertices = 0;
    let triangles = 0;

    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        meshes++;
        if (child.geometry) {
          const geom = child.geometry;
          if (geom.attributes.position) {
            vertices += geom.attributes.position.count;
          }
          if (geom.index) {
            triangles += geom.index.count / 3;
          } else if (geom.attributes.position) {
            triangles += geom.attributes.position.count / 3;
          }
        }

        const materials = Array.isArray(child.material)
          ? child.material
          : [child.material];
        materials.forEach((material) => {
          if (material && material.map) {
            const texture = material.map;
            texture.generateMipmaps = true;
            texture.minFilter = THREE.NearestFilter;
            texture.magFilter = THREE.NearestFilter;
            const maxAnisotropy = gl.capabilities.getMaxAnisotropy() ?? 1;
            texture.anisotropy = maxAnisotropy;
            texture.needsUpdate = true;
          }
        });
      }
    });

    if (onModelLoaded) {
      const bbox = new THREE.Box3().setFromObject(scene);
      const size = new THREE.Vector3();
      bbox.getSize(size);
      onModelLoaded({
        meshCount: meshes,
        vertexCount: vertices,
        triangleCount: Math.round(triangles),
        dimensions: {
          x: Math.round(size.x * 1000) / 1000,
          y: Math.round(size.y * 1000) / 1000,
          z: Math.round(size.z * 1000) / 1000,
        },
      });
    }

    invalidate();
  }, [scene, url, resetTrigger, cameraManager.cameraRef, gl, invalidate, hosePipe3DManager, onModelLoaded]);

  return (
    <group
      ref={(ref) => {
        if (ref) {
          hosePipe3DManager.setGroupRef(ref);
        }
      }}
    >
      <primitive object={scene} />
      {shadowProps && (
        <ContactShadows
          position={shadowProps.position}
          opacity={0.65}
          scale={shadowProps.scale}
          blur={2}
          far={shadowProps.far}
          resolution={512}
          color="#000000"
        />
      )}
    </group>
  );
});
