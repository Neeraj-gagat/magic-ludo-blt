import { useFrame } from "@react-three/fiber/native";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

// FIXED: Proper face rotations that ensure dice sit flat
const faceRotations: Record<number, [number, number, number]> = {
  1: [0, 0, 0], // Top face
  2: [Math.PI / 2, 0, 0], // Front face
  3: [0, 0, -Math.PI / 2], // Right face
  4: [0, 0, Math.PI / 2], // Left face
  5: [-Math.PI / 2, 0, 0], // Back face
  6: [Math.PI, 0, 0], // Bottom face
};

// Create traditional dice with dots
function createDiceMaterial() {
  for (let face = 1; face <= 6; face++) {
    const canvas = document.createElement("canvas"); // 🔥 HERE
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d")!;

    const dotPositions: Record<number, { x: number; y: number }[]> = {
      1: [{ x: 0.5, y: 0.5 }],
      2: [
        { x: 0.25, y: 0.25 },
        { x: 0.75, y: 0.75 },
      ],
      3: [
        { x: 0.25, y: 0.25 },
        { x: 0.5, y: 0.5 },
        { x: 0.75, y: 0.75 },
      ],
      4: [
        { x: 0.25, y: 0.25 },
        { x: 0.75, y: 0.25 },
        { x: 0.25, y: 0.75 },
        { x: 0.75, y: 0.75 },
      ],
      5: [
        { x: 0.25, y: 0.25 },
        { x: 0.75, y: 0.25 },
        { x: 0.5, y: 0.5 },
        { x: 0.25, y: 0.75 },
        { x: 0.75, y: 0.75 },
      ],
      6: [
        { x: 0.25, y: 0.25 },
        { x: 0.75, y: 0.25 },
        { x: 0.25, y: 0.5 },
        { x: 0.75, y: 0.5 },
        { x: 0.25, y: 0.75 },
        { x: 0.75, y: 0.75 },
      ],
    };

    const materials: THREE.MeshStandardMaterial[] = [];

    for (let face = 1; face <= 6; face++) {
      ctx.fillStyle = "#2d7a3e"; // Green
      ctx.fillRect(0, 0, 256, 256);

      // Draw white dots
      ctx.fillStyle = "white";
      const dots = dotPositions[face];
      dots.forEach((dot) => {
        ctx.beginPath();
        ctx.arc(dot.x * 256, dot.y * 256, 18, 0, Math.PI * 2);
        ctx.fill();
      });

      const texture = new THREE.CanvasTexture(canvas);
      materials.push(
        new THREE.MeshStandardMaterial({
          map: texture,
          roughness: 0.7,
          metalness: 0.1,
        }),
      );
    }

    return materials;
  }
}

interface DiceProps {
  rollTrigger: boolean | number;
  targetValue?: number;
  position: [number, number, number];
  onLanded?: (value: number) => void;
}

export default function Dice({
  rollTrigger,
  targetValue,
  position,
  onLanded,
}: DiceProps) {
  const ref = useRef<THREE.Mesh>(null);
  const [rolling, setRolling] = useState(false);
  // const [velocity, setVelocity] = useState({ x: 0, y: 0, z: 0 });
  // const [angularVelocity, setAngularVelocity] = useState({ x: 0, y: 0, z: 0 });
  const velocity = useRef({ x: 0, y: 0, z: 0 });
  const angularVelocity = useRef({ x: 0, y: 0, z: 0 });
  const [currentPosition, setCurrentPosition] = useState({
    x: position[0],
    y: position[1],
    z: position[2],
  });
  const [target, setTarget] = useState(1);
  const [materials] = useState(() => createDiceMaterial());
  const [hasLanded, setHasLanded] = useState(false);

  const gravity = -0.01;
  const damping = 0.98; // Air resistance
  const bounceDamping = 0.5; // Energy loss on bounce
  const angularDamping = 0.95; // Rotation slowdown

  useEffect(() => {
    setRolling(true);
    setHasLanded(false);

    const finalValue = targetValue || Math.floor(Math.random() * 6) + 1;
    setTarget(finalValue);

    velocity.current = {
      x: (Math.random() - 0.5) * 0.05, // small side variation
      y: 0.25, // smaller upward force
      z: -1.35 - Math.random() * 2, // 🔥 STRONG forward throw
    };

    angularVelocity.current = {
      x: (Math.random() - 0.5) * 0.4,
      y: (Math.random() - 0.5) * 0.4,
      z: (Math.random() - 0.5) * 0.4,
    };
  }, [rollTrigger]);

  useFrame(() => {
    if (!ref.current) return;

    if (rolling) {
      // 🎲 APPLY ROTATION
      ref.current.rotation.x += angularVelocity.current.x;
      ref.current.rotation.y += angularVelocity.current.y;
      ref.current.rotation.z += angularVelocity.current.z;

      // 💥 APPLY DAMPING + GRAVITY (THIS IS WHAT YOU ASKED)
      angularVelocity.current.x *= 0.96;
      angularVelocity.current.y *= 0.96;
      angularVelocity.current.z *= 0.96;

      velocity.current.x *= 0.98;
      velocity.current.z *= 0.98;
      velocity.current.y += gravity;

      // 📍 UPDATE POSITION
      const pos = ref.current.position;

      pos.x = THREE.MathUtils.clamp(
        pos.x + velocity.current.x,
        position[0] - 0.8,
        position[0] + 0.8,
      );

      pos.y = Math.max(0.5, pos.y + velocity.current.y);

      pos.z = THREE.MathUtils.clamp(
        pos.z + velocity.current.z,
        position[2] - 2.8,
        position[2] + 40.8,
      );

      const WALL_Z = -4; // adjust based on screen

      if (pos.z <= WALL_Z) {
        pos.z = WALL_Z;

        // bounce back slightly
        velocity.current.z = -velocity.current.z * 0.4;

        // reduce energy
        velocity.current.y *= 0.8;
      }

      // 🪂 BOUNCE
      if (pos.y <= 0.5 && velocity.current.y < 0) {
        velocity.current.y = -velocity.current.y * 0.5;
      }

      // 🎯 STOP CONDITION (IMPORTANT)
      if (pos.y <= 0.5 && Math.abs(velocity.current.y) < 0.01) {
        velocity.current = { x: 0, y: 0, z: 0 };
        angularVelocity.current = { x: 0, y: 0, z: 0 };

        const [x, y, z] = faceRotations[target];

        ref.current.rotation.set(x, y, z);
        ref.current.position.y = 0.5; // only fix height
        setRolling(false);

        if (!hasLanded) {
          setHasLanded(true);
          onLanded?.(target);
        }
      }
    }
  });

  return (
    <mesh ref={ref} position={position} scale={1} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      {materials!.map((mat, i) => (
        <primitive object={mat} attach={`material-${i}`} key={i} />
      ))}
    </mesh>
  );
}
