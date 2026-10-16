import { Canvas, useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import * as THREE from 'three';
import { spatialInteractionManager } from '../../spatial/spatialInteractionManager';
import { spatialStore, useSpatialStore } from '../../store/useSpatialStore';
import { ParticleField } from './ParticleField';
import { PointerCursor3D } from './PointerCursor3D';
import { SpatialGridFloor } from './SpatialGridFloor';
import { VirtualObjectMesh } from './VirtualObjectMesh';

function SceneController() {
  const { viewport } = useThree();
  const { settings } = useSpatialStore();

  useEffect(() => {
    // Keep 3D projection plane aligned with camera FOV and screen aspect ratio
    spatialInteractionManager.setProjectionDimensions(
      viewport.width,
      viewport.height,
      settings.mirrorCamera
    );
  }, [viewport.width, viewport.height, settings.mirrorCamera]);

  return null;
}

export function ThreeScene() {
  const { objects, backgroundMode } = useSpatialStore();

  return (
    <div
      className="absolute inset-0 w-full h-full pointer-events-auto"
      onClick={() => {
        // Deselect if clicking on empty space
        spatialStore.selectObject(null);
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 7.5], fov: 50, near: 0.1, far: 100 }}
        gl={{
          antialias: true,
          alpha: backgroundMode === 'camera',
          powerPreference: 'high-performance',
        }}
        onCreated={({ gl, scene }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.1;
          if (backgroundMode !== 'camera') {
            scene.background = new THREE.Color(
              backgroundMode === 'dark' ? '#07080b' : '#030304'
            );
          }
        }}
      >
        <SceneController />

        {/* Lighting Rig */}
        <ambientLight intensity={0.9} color="#94a3b8" />
        <directionalLight position={[6, 8, 5]} intensity={2.2} color="#f8fafc" castShadow />
        <directionalLight position={[-6, -4, -2]} intensity={1.2} color="#00f0ff" />
        <pointLight position={[0, 4, 2]} intensity={1.5} color="#38bdf8" distance={15} />

        {/* Spatial Grid Floor */}
        <SpatialGridFloor />

        {/* Ambient Spatial Dust */}
        {backgroundMode !== 'minimal' && <ParticleField count={80} />}

        {/* Virtual Procedural Objects */}
        {objects.map((obj) => (
          <VirtualObjectMesh key={obj.id} object={obj} />
        ))}

        {/* 3D Holographic Hand Pointer */}
        <PointerCursor3D />
      </Canvas>
    </div>
  );
}
