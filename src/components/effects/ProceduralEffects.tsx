import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useSpatialStore } from '../../store/useSpatialStore';
import { Stroke3D } from '../../types';

function StrokeMesh({ stroke }: { stroke: Stroke3D }) {
  const lineRef = useRef<THREE.Line>(null);

  const geometry = useMemo(() => {
    if (stroke.points.length < 2) return null;
    const vectors = stroke.points.map((p) => new THREE.Vector3(...p.position));
    const curve = new THREE.CatmullRomCurve3(vectors);
    const points = curve.getPoints(Math.max(20, stroke.points.length * 3));
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [stroke.points]);

  if (!geometry) return null;

  return (
    // @ts-ignore
    <line ref={lineRef} geometry={geometry}>
      <lineBasicMaterial
        color={stroke.color || '#00f0ff'}
        transparent
        opacity={0.85}
        linewidth={3}
      />
    </line>
  );
}

export function ProceduralEffects() {
  const { strokes, activeStroke, pointer, grabbedObjectId, settings } = useSpatialStore();
  const burstParticlesRef = useRef<THREE.Points>(null);

  // Small particle burst on pinch
  const [burstPositions, burstVelocities] = useMemo(() => {
    const count = 30;
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      vel[i * 3] = (Math.sin(i * 1.5) * 0.05);
      vel[i * 3 + 1] = (Math.cos(i * 1.5) * 0.05);
      vel[i * 3 + 2] = (Math.sin(i * 2.2) * 0.05);
    }
    return [pos, vel];
  }, []);

  useFrame((_, delta) => {
    if (settings.reducedMotion) return;

    if (burstParticlesRef.current && pointer.pinchActive) {
      burstParticlesRef.current.visible = true;
      const positions = burstParticlesRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < 30; i++) {
        positions[i * 3] += burstVelocities[i * 3] * delta * 20;
        positions[i * 3 + 1] += burstVelocities[i * 3 + 1] * delta * 20;
        positions[i * 3 + 2] += burstVelocities[i * 3 + 2] * delta * 20;
      }
      burstParticlesRef.current.geometry.attributes.position.needsUpdate = true;
    } else if (burstParticlesRef.current) {
      burstParticlesRef.current.visible = false;
      // Reset positions to pointer
      const positions = burstParticlesRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < 30; i++) {
        positions[i * 3] = pointer.position[0];
        positions[i * 3 + 1] = pointer.position[1];
        positions[i * 3 + 2] = pointer.position[2];
      }
      burstParticlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* Air Drawing 3D Strokes */}
      {strokes.map((stroke) => (
        <StrokeMesh key={stroke.id} stroke={stroke} />
      ))}
      {activeStroke && <StrokeMesh stroke={activeStroke} />}

      {/* Pinch Dynamic Particle Burst */}
      {!settings.reducedMotion && (
        <points ref={burstParticlesRef} visible={false}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[burstPositions, 3]}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.05}
            color={grabbedObjectId ? '#38bdf8' : '#00f0ff'}
            transparent
            opacity={0.8}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>
      )}
    </group>
  );
}
