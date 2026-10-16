import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { useSpatialStore } from '../../store/useSpatialStore';

export function PointerCursor3D() {
  const { pointer, objects, grabbedObjectId } = useSpatialStore();
  const ringRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const tetherLineRef = useRef<THREE.Line>(null);

  // Smooth lerping towards target position
  const currentPos = useRef(new THREE.Vector3(0, 0, 0));

  useFrame((_, delta) => {
    if (!pointer.active) {
      if (ringRef.current) ringRef.current.visible = false;
      if (coreRef.current) coreRef.current.visible = false;
      if (tetherLineRef.current) tetherLineRef.current.visible = false;
      return;
    }

    if (ringRef.current) ringRef.current.visible = true;
    if (coreRef.current) coreRef.current.visible = true;

    const targetPos = new THREE.Vector3(
      pointer.position[0],
      pointer.position[1],
      pointer.position[2]
    );

    // Fast responsive lerping
    currentPos.current.lerp(targetPos, Math.min(1, delta * 24));

    if (ringRef.current) {
      ringRef.current.position.copy(currentPos.current);
      ringRef.current.rotation.z += delta * 1.5;
      const targetScale = pointer.pinchActive ? 0.45 : 0.85;
      ringRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 15);
    }

    if (coreRef.current) {
      coreRef.current.position.copy(currentPos.current);
      const coreScale = pointer.pinchActive ? 1.2 : 0.9;
      coreRef.current.scale.lerp(new THREE.Vector3(coreScale, coreScale, coreScale), delta * 15);
    }

    // Tether beam to grabbed object
    if (tetherLineRef.current) {
      if (grabbedObjectId) {
        const grabbedObj = objects.find((o) => o.id === grabbedObjectId);
        if (grabbedObj) {
          tetherLineRef.current.visible = true;
          const points = [
            currentPos.current,
            new THREE.Vector3(...grabbedObj.position),
          ];
          tetherLineRef.current.geometry.setFromPoints(points);
        } else {
          tetherLineRef.current.visible = false;
        }
      } else {
        tetherLineRef.current.visible = false;
      }
    }
  });

  return (
    <group>
      {/* Outer Reticle Ring */}
      <mesh ref={ringRef} renderOrder={999}>
        <ringGeometry args={[0.22, 0.26, 32]} />
        <meshBasicMaterial
          color={pointer.pinchActive ? '#38bdf8' : '#00f0ff'}
          transparent
          opacity={0.85}
          side={THREE.DoubleSide}
          depthTest={false}
        />
      </mesh>

      {/* Core Pointer Dot */}
      <mesh ref={coreRef} renderOrder={1000}>
        <circleGeometry args={[0.07, 24]} />
        <meshBasicMaterial
          color={pointer.pinchActive ? '#ffffff' : '#00f0ff'}
          transparent
          opacity={0.95}
          depthTest={false}
        />
      </mesh>

      {/* Energy Tether Line to Grabbed Object */}
      {/* @ts-ignore */}
      <line ref={tetherLineRef} renderOrder={998}>
        <bufferGeometry />
        <lineBasicMaterial
          color="#00f0ff"
          transparent
          opacity={0.65}
          linewidth={2}
          depthTest={false}
        />
      </line>
    </group>
  );
}
