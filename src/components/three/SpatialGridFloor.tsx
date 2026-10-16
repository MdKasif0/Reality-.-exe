import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

export function SpatialGridFloor() {
  const gridRef = useRef<THREE.GridHelper>(null);

  useFrame((state) => {
    if (gridRef.current) {
      // Subtle ambient breathing
      const time = state.clock.getElapsedTime();
      (gridRef.current.material as THREE.Material).opacity = 0.22 + Math.sin(time * 0.8) * 0.05;
    }
  });

  return (
    <group position={[0, -2.8, -2]}>
      <gridHelper
        ref={gridRef}
        args={[30, 40, '#00f0ff', '#1e293b']}
        position={[0, 0, 0]}
        rotation={[0, 0, 0]}
      >
        <lineBasicMaterial
          attach="material"
          color="#334155"
          transparent
          opacity={0.25}
        />
      </gridHelper>
    </group>
  );
}
