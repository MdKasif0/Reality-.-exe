import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { spatialStore, useSpatialStore } from '../../store/useSpatialStore';
import { VirtualObject } from '../../types';

interface VirtualObjectMeshProps {
  object: VirtualObject;
}

export function VirtualObjectMesh({ object }: VirtualObjectMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const { selectedObjectId, hoveredObjectId, grabbedObjectId, pointer } = useSpatialStore();

  const isSelected = selectedObjectId === object.id;
  const isHovered = hoveredObjectId === object.id || pointer.targetedObjectId === object.id;
  const isGrabbed = grabbedObjectId === object.id;

  // Deterministic phase offset derived from object id so objects don't bob in sync
  const phaseOffset = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < object.id.length; i++) {
      hash = (hash << 5) - hash + object.id.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash % 100) / 100 * Math.PI * 2;
  }, [object.id]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const time = state.clock.getElapsedTime();

    // Idle rotation
    if (!isGrabbed) {
      meshRef.current.rotation.y += delta * 0.35;
      meshRef.current.rotation.x += delta * 0.15;

      // Subtle vertical breathing float
      meshRef.current.position.y =
        object.position[1] + Math.sin(time * 1.5 + phaseOffset) * 0.08;
    } else {
      meshRef.current.position.set(...object.position);
    }

    // Halo pulse animation when selected
    if (haloRef.current && isSelected) {
      haloRef.current.rotation.z += delta * 1.2;
      const s = 1.35 + Math.sin(time * 3) * 0.08;
      haloRef.current.scale.set(s, s, s);
    }
  });

  const renderGeometry = () => {
    switch (object.type) {
      case 'cube':
        return <boxGeometry args={[1, 1, 1]} />;
      case 'sphere':
        return <sphereGeometry args={[0.7, 32, 32]} />;
      case 'ring':
        return <torusGeometry args={[0.65, 0.18, 24, 48]} />;
      case 'octahedron':
        return <octahedronGeometry args={[0.8, 0]} />;
      case 'torus':
        return <torusKnotGeometry args={[0.5, 0.15, 64, 16]} />;
      case 'cylinder':
        return <cylinderGeometry args={[0.5, 0.5, 1.2, 32]} />;
      default:
        return <boxGeometry args={[1, 1, 1]} />;
    }
  };

  const emissiveColor = useMemo(() => {
    if (isGrabbed) return '#00f0ff';
    if (isSelected) return '#38bdf8';
    if (isHovered) return '#0284c7';
    return object.emissive || '#000000';
  }, [isGrabbed, isSelected, isHovered, object.emissive]);

  const emissiveIntensity = isGrabbed ? 1.0 : isSelected ? 0.75 : isHovered ? 0.5 : 0.2;

  return (
    <group
      position={object.position}
      scale={object.scale}
      onClick={(e) => {
        e.stopPropagation();
        spatialStore.selectObject(object.id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        spatialStore.hoverObject(object.id);
      }}
      onPointerOut={() => {
        if (!isGrabbed) spatialStore.hoverObject(null);
      }}
    >
      {/* Primary Procedural Mesh */}
      <mesh ref={meshRef} castShadow receiveShadow>
        {renderGeometry()}
        <meshStandardMaterial
          color={object.color}
          roughness={0.25}
          metalness={0.7}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
          wireframe={object.wireframe}
        />
      </mesh>

      {/* Wireframe Holographic Ghost Shell */}
      <mesh scale={[1.05, 1.05, 1.05]}>
        {renderGeometry()}
        <meshBasicMaterial
          color={isGrabbed ? '#ffffff' : object.color}
          wireframe
          transparent
          opacity={isGrabbed ? 0.45 : isSelected ? 0.35 : isHovered ? 0.25 : 0.08}
        />
      </mesh>

      {/* Selection Holographic Halo */}
      {isSelected && (
        <mesh ref={haloRef} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.95, 1.05, 48]} />
          <meshBasicMaterial
            color="#00f0ff"
            side={THREE.DoubleSide}
            transparent
            opacity={0.7}
          />
        </mesh>
      )}

      {/* High-tech Selection Brackets */}
      {(isSelected || isHovered) && (
        <group scale={[1.2, 1.2, 1.2]}>
          <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(1.2, 1.2, 1.2)]} />
            <lineBasicMaterial
              color={isGrabbed ? '#00f0ff' : isSelected ? '#38bdf8' : '#64748b'}
              transparent
              opacity={isGrabbed ? 0.8 : 0.5}
            />
          </lineSegments>
        </group>
      )}
    </group>
  );
}
