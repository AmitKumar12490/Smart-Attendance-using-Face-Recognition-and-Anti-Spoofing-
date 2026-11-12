import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, OrbitControls, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

// Particle Field Orbiting the Shield
function ParticleField({ count = 250, alertMode = false }) {
  const points = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const radius = 2.5 + Math.random() * 2.5;
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      p[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      p[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      p[i * 3 + 2] = radius * Math.cos(phi);
    }
    return p;
  }, [count]);

  const ref = useRef();
  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.15;
      ref.current.rotation.x += delta * 0.05;
    }
  });

  return (
    <group ref={ref}>
      <Points positions={points} stride={3}>
        <PointMaterial
          transparent
          color={alertMode ? "#f43f5e" : "#00f0ff"}
          size={0.06}
          sizeAttenuation={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </Points>
    </group>
  );
}

// 3D Procedural Shield Mesh with Edge Glow
function ShieldGeometryMesh({ alertMode = false }) {
  const meshRef = useRef();
  const wireframeRef = useRef();
  const ringRef = useRef();

  // Create custom shield 2D extruded shape
  const shieldShape = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 1.6);
    shape.lineTo(1.1, 1.2);
    shape.lineTo(1.1, 0.2);
    shape.quadraticCurveTo(1.1, -0.8, 0, -1.6);
    shape.quadraticCurveTo(-1.1, -0.8, -1.1, 0.2);
    shape.lineTo(-1.1, 1.2);
    shape.closePath();
    return shape;
  }, []);

  const extrudeSettings = useMemo(() => ({
    depth: 0.22,
    bevelEnabled: true,
    bevelSegments: 6,
    steps: 2,
    bevelSize: 0.08,
    bevelThickness: 0.08,
  }), []);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.35;
      meshRef.current.rotation.x = Math.cos(state.clock.elapsedTime * 0.6) * 0.12;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.4;
      ringRef.current.rotation.x = Math.PI / 2 + Math.sin(state.clock.elapsedTime) * 0.1;
    }
  });

  const mainColor = alertMode ? '#e11d48' : '#0284c7';
  const emissiveColor = alertMode ? '#f43f5e' : '#00f0ff';

  return (
    <group ref={meshRef}>
      {/* Solid Glass / Cyber Metal Shield Body */}
      <mesh castShadow receiveShadow>
        <extrudeGeometry args={[shieldShape, extrudeSettings]} />
        <meshPhysicalMaterial
          color={mainColor}
          emissive={emissiveColor}
          emissiveIntensity={alertMode ? 0.8 : 0.45}
          roughness={0.15}
          metalness={0.85}
          clearcoat={1.0}
          clearcoatRoughness={0.1}
          transparent
          opacity={0.92}
        />
      </mesh>

      {/* Cyber Wireframe Overlay */}
      <mesh ref={wireframeRef} scale={[1.02, 1.02, 1.02]}>
        <extrudeGeometry args={[shieldShape, extrudeSettings]} />
        <meshBasicMaterial
          color={emissiveColor}
          wireframe
          transparent
          opacity={0.35}
        />
      </mesh>

      {/* Central AI Biometric Node Core */}
      <mesh position={[0, 0, 0.2]}>
        <octahedronGeometry args={[0.35, 0]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive={emissiveColor}
          emissiveIntensity={1.2}
          wireframe
        />
      </mesh>

      {/* Orbiting Quantum Scanner Ring */}
      <mesh ref={ringRef} position={[0, 0, 0]}>
        <torusGeometry args={[1.8, 0.02, 16, 64]} />
        <meshStandardMaterial
          color={emissiveColor}
          emissive={emissiveColor}
          emissiveIntensity={0.8}
        />
      </mesh>
    </group>
  );
}

export const SecurityShield3D = ({ alertMode = false, className = "h-72 w-full" }) => {
  return (
    <div className={`relative ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 4.5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 5, 5]} intensity={1.5} color="#38bdf8" />
        <pointLight position={[-5, -5, -2]} intensity={0.8} color="#06b6d4" />
        <pointLight position={[0, 3, 2]} intensity={alertMode ? 2.5 : 1.2} color={alertMode ? "#f43f5e" : "#00f0ff"} />

        <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
          <ShieldGeometryMesh alertMode={alertMode} />
          <ParticleField alertMode={alertMode} />
        </Float>

        <OrbitControls enableZoom={false} enablePan={false} maxPolarAngle={Math.PI / 1.8} minPolarAngle={Math.PI / 2.2} />
      </Canvas>
    </div>
  );
};
