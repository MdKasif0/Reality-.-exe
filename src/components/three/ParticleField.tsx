import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

export function ParticleField({ count = 120 }: { count?: number }) {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions, scales] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sc = new Float32Array(count);
    let seed = 42;
    const pseudoRand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (pseudoRand() - 0.5) * 16;
      pos[i * 3 + 1] = (pseudoRand() - 0.5) * 10;
      pos[i * 3 + 2] = (pseudoRand() - 0.5) * 12 - 2;
      sc[i] = pseudoRand() * 0.04 + 0.02;
    }
    return [pos, sc];
  }, [count]);

  useFrame((state) => {
    if (pointsRef.current) {
      const time = state.clock.getElapsedTime();
      pointsRef.current.rotation.y = time * 0.015;
      pointsRef.current.rotation.x = Math.sin(time * 0.01) * 0.05;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-scale"
          args={[scales, 1]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        color="#00f0ff"
        transparent
        opacity={0.35}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
