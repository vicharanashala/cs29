import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Lerp between keyframes based on normalized progress */
function lerpKeyframes(progress: number, keyframes: [number, number[]][]): number[] {
  for (let i = 0; i < keyframes.length - 1; i++) {
    const [t0, v0] = keyframes[i];
    const [t1, v1] = keyframes[i + 1];
    if (progress >= t0 && progress <= t1) {
      const t = (progress - t0) / (t1 - t0);
      return v0.map((val, idx) => THREE.MathUtils.lerp(val, v1[idx], t));
    }
  }
  return keyframes[keyframes.length - 1][1];
}

// ── Satellite positions ─────────────────────────────────────────────────────

function generateOrbitPositions(count: number, radius: number): THREE.Vector3[] {
  const positions: THREE.Vector3[] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = goldenAngle * i;
    positions.push(new THREE.Vector3(
      Math.cos(theta) * r * radius,
      y * radius,
      Math.sin(theta) * r * radius,
    ));
  }
  return positions;
}

function generateGridPositions(count: number, spacing: number): THREE.Vector3[] {
  const cols = Math.ceil(Math.sqrt(count));
  const positions: THREE.Vector3[] = [];
  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    positions.push(new THREE.Vector3(
      (col - (cols - 1) / 2) * spacing,
      (row - (cols - 1) / 2) * spacing * 0.8,
      0,
    ));
  }
  return positions;
}

// ── Core Node ────────────────────────────────────────────────────────────────

const TEAL = new THREE.Color('#00e5ff');
const TEAL_DIM = new THREE.Color('#005f6b');

interface CoreNodeProps {
  scrollProgress: React.MutableRefObject<number>;
}

const CoreNode: React.FC<CoreNodeProps> = ({ scrollProgress }) => {
  const meshRef = useRef<THREE.Mesh>(null!);

  const scaleKeyframes: [number, number[]][] = [
    [0.0, [1.0, 1.0, 1.0]],
    [0.2, [0.6, 0.6, 0.6]],
    [0.4, [1.5, 1.5, 1.5]],
    [0.6, [1.0, 1.0, 1.0]],
    [0.8, [0.5, 0.5, 0.5]],
    [1.0, [0.5, 0.5, 0.5]],
  ];

  const emissiveKeyframes: [number, number[]][] = [
    [0.0, [0.3]],
    [0.2, [0.2]],
    [0.4, [0.8]],
    [0.6, [0.4]],
    [0.8, [0.15]],
    [1.0, [0.15]],
  ];

  useFrame((_state, delta) => {
    const p = scrollProgress.current;
    const mesh = meshRef.current;
    if (!mesh) return;

    // Auto-rotate
    mesh.rotation.y += delta * 0.3;
    mesh.rotation.x += delta * 0.15;

    // Scale from keyframes
    const s = lerpKeyframes(p, scaleKeyframes);
    mesh.scale.set(s[0], s[1], s[2]);

    // Emissive intensity
    const ei = lerpKeyframes(p, emissiveKeyframes);
    const mat = mesh.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = ei[0];
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1, 1]} />
      <meshStandardMaterial
        color="#0a2e3a"
        emissive={TEAL}
        emissiveIntensity={0.3}
        wireframe
        transparent
        opacity={0.9}
      />
    </mesh>
  );
};

// ── Satellite Nodes ──────────────────────────────────────────────────────────

interface SatelliteNodesProps {
  scrollProgress: React.MutableRefObject<number>;
}

const SATELLITE_COUNT = 16;

const SatelliteNodes: React.FC<SatelliteNodesProps> = ({ scrollProgress }) => {
  const groupRef = useRef<THREE.Group>(null!);
  const meshRefs = useRef<THREE.Mesh[]>([]);

  const orbitPositions = useMemo(() => generateOrbitPositions(SATELLITE_COUNT, 3.5), []);
  const gridPositions = useMemo(() => generateGridPositions(SATELLITE_COUNT, 1.8), []);
  const farPositions = useMemo(() => generateOrbitPositions(SATELLITE_COUNT, 8), []);

  useFrame((_state, delta) => {
    const p = scrollProgress.current;
    const group = groupRef.current;
    if (!group) return;

    group.rotation.y += delta * 0.1;

    meshRefs.current.forEach((mesh, i) => {
      if (!mesh) return;

      const orbit = orbitPositions[i];
      const grid = gridPositions[i];
      const far = farPositions[i];

      let targetX: number, targetY: number, targetZ: number;

      if (p < 0.2) {
        // Orbiting around core
        targetX = orbit.x;
        targetY = orbit.y;
        targetZ = orbit.z;
      } else if (p < 0.4) {
        // Transition to grid
        const t = (p - 0.2) / 0.2;
        targetX = THREE.MathUtils.lerp(orbit.x, grid.x, t);
        targetY = THREE.MathUtils.lerp(orbit.y, grid.y, t);
        targetZ = THREE.MathUtils.lerp(orbit.z, grid.z, t);
      } else if (p < 0.6) {
        // Stay in grid, slightly breathe
        targetX = grid.x;
        targetY = grid.y;
        targetZ = grid.z;
      } else if (p < 0.8) {
        // Two-node focus: most fade out, indices 0 & 1 move to connection points
        if (i === 0) {
          targetX = -1.5;
          targetY = 0;
          targetZ = 0;
        } else if (i === 1) {
          targetX = 1.5;
          targetY = 0;
          targetZ = 0;
        } else {
          const t = (p - 0.6) / 0.2;
          targetX = THREE.MathUtils.lerp(grid.x, grid.x * 3, t);
          targetY = THREE.MathUtils.lerp(grid.y, grid.y * 3, t);
          targetZ = THREE.MathUtils.lerp(grid.z, grid.z * 3 - 5, t);
        }
      } else {
        // Far network spread
        const t = (p - 0.8) / 0.2;
        if (i === 0 || i === 1) {
          targetX = THREE.MathUtils.lerp(i === 0 ? -1.5 : 1.5, far.x, t);
          targetY = THREE.MathUtils.lerp(0, far.y, t);
          targetZ = THREE.MathUtils.lerp(0, far.z, t);
        } else {
          targetX = far.x;
          targetY = far.y;
          targetZ = far.z;
        }
      }

      mesh.position.x = THREE.MathUtils.lerp(mesh.position.x, targetX, 0.08);
      mesh.position.y = THREE.MathUtils.lerp(mesh.position.y, targetY, 0.08);
      mesh.position.z = THREE.MathUtils.lerp(mesh.position.z, targetZ, 0.08);

      // Opacity: fade others during two-node focus
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (p >= 0.6 && p < 0.8 && i > 1) {
        mat.opacity = THREE.MathUtils.lerp(mat.opacity, 0.15, 0.05);
      } else {
        mat.opacity = THREE.MathUtils.lerp(mat.opacity, 0.85, 0.05);
      }
    });
  });

  return (
    <group ref={groupRef}>
      {Array.from({ length: SATELLITE_COUNT }).map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) meshRefs.current[i] = el;
          }}
          position={[orbitPositions[i].x, orbitPositions[i].y, orbitPositions[i].z]}
        >
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial
            color={TEAL_DIM}
            emissive={TEAL}
            emissiveIntensity={0.5}
            transparent
            opacity={0.85}
          />
        </mesh>
      ))}
    </group>
  );
};

// ── Connection Lines ─────────────────────────────────────────────────────────

interface ConnectionLinesProps {
  scrollProgress: React.MutableRefObject<number>;
}

const ConnectionLines: React.FC<ConnectionLinesProps> = ({ scrollProgress }) => {
  const lineRef = useRef<THREE.Line>(null!);
  const networkLinesRef = useRef<THREE.Group>(null!);

  // Main connection line between two focal nodes
  const lineGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(6); // 2 points × 3 components
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  // Network lines for final section
  const networkLineGeometries = useMemo(() => {
    const geos: THREE.BufferGeometry[] = [];
    const count = 12;
    for (let i = 0; i < count; i++) {
      const geo = new THREE.BufferGeometry();
      const positions = new Float32Array(6);
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geos.push(geo);
    }
    return geos;
  }, []);

  const lineMaterial = useMemo(() => new THREE.LineBasicMaterial({
    color: TEAL,
    transparent: true,
    opacity: 0,
    linewidth: 1,
  }), []);

  const networkMaterial = useMemo(() => new THREE.LineBasicMaterial({
    color: TEAL,
    transparent: true,
    opacity: 0,
    linewidth: 1,
  }), []);

  const mainLine = useMemo(() => new THREE.Line(lineGeometry, lineMaterial), [lineGeometry, lineMaterial]);

  const networkLines = useMemo(() => {
    return networkLineGeometries.map(geo => new THREE.Line(geo, networkMaterial));
  }, [networkLineGeometries, networkMaterial]);

  const farPositions = useMemo(() => generateOrbitPositions(SATELLITE_COUNT, 8), []);

  useFrame(() => {
    const p = scrollProgress.current;

    // Main connection line: visible during section 4 (0.6–0.8)
    if (p >= 0.55 && p < 0.85) {
      const t = Math.min(1, (p - 0.55) / 0.1);
      lineMaterial.opacity = t * 0.8;

      const posAttr = lineGeometry.getAttribute('position') as THREE.BufferAttribute;
      posAttr.setXYZ(0, -1.5, 0, 0);
      posAttr.setXYZ(1, 1.5, 0, 0);
      posAttr.needsUpdate = true;
    } else {
      lineMaterial.opacity = THREE.MathUtils.lerp(lineMaterial.opacity, 0, 0.05);
    }

    // Network lines: visible during section 5 (0.8–1.0)
    if (p >= 0.75) {
      const t = Math.min(1, (p - 0.75) / 0.15);
      networkMaterial.opacity = t * 0.3;

      networkLineGeometries.forEach((geo, i) => {
        const posAttr = geo.getAttribute('position') as THREE.BufferAttribute;
        const from = farPositions[i % farPositions.length];
        const to = farPositions[(i + 3) % farPositions.length];
        posAttr.setXYZ(0, from.x, from.y, from.z);
        posAttr.setXYZ(1, to.x, to.y, to.z);
        posAttr.needsUpdate = true;
      });
    } else {
      networkMaterial.opacity = THREE.MathUtils.lerp(networkMaterial.opacity, 0, 0.05);
    }
  });

  return (
    <>
      <primitive ref={lineRef} object={mainLine} />
      <group ref={networkLinesRef}>
        {networkLines.map((lineObj, i) => (
          <primitive key={i} object={lineObj} />
        ))}
      </group>
    </>
  );
};

// ── Camera Rig ───────────────────────────────────────────────────────────────

interface CameraRigProps {
  scrollProgress: React.MutableRefObject<number>;
}

const cameraKeyframes: [number, number[]][] = [
  [0.0, [0, 0, 8]],
  [0.2, [0, 2, 10]],
  [0.4, [0, 0, 3]],
  [0.6, [2, 0, 6]],
  [0.8, [0, 3, 18]],
  [1.0, [0, 3, 18]],
];

const CameraRig: React.FC<CameraRigProps> = ({ scrollProgress }) => {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3(0, 0, 8));

  useFrame(() => {
    const p = scrollProgress.current;
    const kf = lerpKeyframes(p, cameraKeyframes);
    targetPos.current.set(kf[0], kf[1], kf[2]);

    camera.position.lerp(targetPos.current, 0.06);
    camera.lookAt(0, 0, 0);
  });

  return null;
};

// ── Ambient Particles ────────────────────────────────────────────────────────

const PARTICLE_COUNT = 200;

const AmbientParticles: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null!);

  const positions = useMemo(() => {
    const arr = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 40;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 40;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    return arr;
  }, []);

  useFrame((_state, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.02;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={PARTICLE_COUNT}
        />
      </bufferGeometry>
      <pointsMaterial
        color={TEAL}
        size={0.04}
        transparent
        opacity={0.4}
        sizeAttenuation
      />
    </points>
  );
};

// ── Main Scene Export ────────────────────────────────────────────────────────

interface CoreSceneProps {
  scrollProgress: React.MutableRefObject<number>;
}

const CoreScene: React.FC<CoreSceneProps> = ({ scrollProgress }) => {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.15} />
      <pointLight position={[5, 5, 5]} intensity={0.8} color="#00e5ff" />
      <pointLight position={[-5, -3, 3]} intensity={0.4} color="#ffffff" />

      {/* Scene objects */}
      <CoreNode scrollProgress={scrollProgress} />
      <SatelliteNodes scrollProgress={scrollProgress} />
      <ConnectionLines scrollProgress={scrollProgress} />
      <AmbientParticles />

      {/* Camera control */}
      <CameraRig scrollProgress={scrollProgress} />
    </>
  );
};

export default CoreScene;
