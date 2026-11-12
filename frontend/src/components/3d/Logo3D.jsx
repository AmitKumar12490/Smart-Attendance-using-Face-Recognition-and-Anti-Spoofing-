import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

function MiniShield() {
  const ref = useRef();
  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.8;
      ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 1.2) * 0.15;
    }
  });

  return (
    <group ref={ref}>
      <mesh>
        <octahedronGeometry args={[1.1, 0]} />
        <meshStandardMaterial
          color="#00f0ff"
          emissive="#0284c7"
          emissiveIntensity={0.6}
          roughness={0.2}
          metalness={0.8}
          wireframe
        />
      </mesh>
      <mesh>
        <octahedronGeometry args={[0.7, 0]} />
        <meshPhysicalMaterial
          color="#06b6d4"
          emissive="#00f0ff"
          emissiveIntensity={0.8}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.5, 0.03, 16, 32]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>
    </group>
  );
}

export const Logo3D = ({ className = "w-16 h-16" }) => {
  return (
    <div className={className}>
      <Canvas camera={{ position: [0, 0, 3.8], fov: 45 }} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.9} />
        <directionalLight position={[3, 3, 3]} intensity={1.5} color="#38bdf8" />
        <pointLight position={[-2, -2, 2]} intensity={1.0} color="#00f0ff" />
        <Float speed={2.5} rotationIntensity={0.2} floatIntensity={0.3}>
          <MiniShield />
        </Float>
      </Canvas>
    </div>
  );
};
