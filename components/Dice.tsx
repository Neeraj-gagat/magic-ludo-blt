import { RigidBody } from "@react-three/rapier";
import { useEffect, useRef } from "react";
import * as THREE from "three";

const FACE_NORMALS: [number, THREE.Vector3][] = [
  [1, new THREE.Vector3(0, 1, 0)],
  [6, new THREE.Vector3(0, -1, 0)],
  [2, new THREE.Vector3(-1, 0, 0)],
  [5, new THREE.Vector3(1, 0, 0)],
  [3, new THREE.Vector3(0, 0, 1)],
  [4, new THREE.Vector3(0, 0, -1)],
];

const FACE_SLOT_TO_VALUE = [5, 2, 1, 6, 3, 4];

function createMaterials() {
  const dotMap: Record<number, [number, number][]> = {
    1: [[128, 128]],
    2: [
      [72, 72],
      [184, 184],
    ],
    3: [
      [72, 72],
      [128, 128],
      [184, 184],
    ],
    4: [
      [72, 72],
      [184, 72],
      [72, 184],
      [184, 184],
    ],
    5: [
      [72, 72],
      [184, 72],
      [128, 128],
      [72, 184],
      [184, 184],
    ],
    6: [
      [72, 72],
      [184, 72],
      [72, 128],
      [184, 128],
      [72, 184],
      [184, 184],
    ],
  };

  return FACE_SLOT_TO_VALUE.map((value) => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d")!;

    const r = 36;
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.lineTo(256 - r, 0);
    ctx.quadraticCurveTo(256, 0, 256, r);
    ctx.lineTo(256, 256 - r);
    ctx.quadraticCurveTo(256, 256, 256 - r, 256);
    ctx.lineTo(r, 256);
    ctx.quadraticCurveTo(0, 256, 0, 256 - r);
    ctx.lineTo(0, r);
    ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.closePath();
    ctx.clip();

    ctx.fillStyle = "#f9f4ea";
    ctx.fillRect(0, 0, 256, 256);

    ctx.strokeStyle = "#d4c9b0";
    ctx.lineWidth = 8;
    ctx.stroke();

    ctx.fillStyle = value === 1 ? "#c0392b" : "#1a1a2e";
    dotMap[value].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 22, 0, Math.PI * 2);
      ctx.fill();
    });

    const texture = new THREE.CanvasTexture(canvas);
    return new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.35,
      metalness: 0.05,
    });
  });
}

function detectFaceUp(q: THREE.Quaternion): number {
  const worldUp = new THREE.Vector3(0, 1, 0);
  let bestValue = 1;
  let bestDot = -Infinity;
  for (const [value, localNormal] of FACE_NORMALS) {
    const dot = localNormal.clone().applyQuaternion(q).dot(worldUp);
    if (dot > bestDot) {
      bestDot = dot;
      bestValue = value;
    }
  }
  return bestValue;
}

interface DiceProps {
  trigger: number;
  position: [number, number, number];
  onLanded?: (value: number) => void;
}

export default function Dice({ trigger, position, onLanded }: DiceProps) {
  const rigidRef = useRef<any>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const materials = useRef(createMaterials()).current;
  const prevTrigger = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reported = useRef(false);

  useEffect(() => {
    if (trigger === 0 || trigger === prevTrigger.current) return;
    prevTrigger.current = trigger;
    reported.current = false;
    if (!rigidRef.current) return;

    // Reset to center-ish spawn with slight offset
    rigidRef.current.setTranslation(
      { x: position[0], y: position[1], z: position[2] },
      true,
    );
    const q = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
      ),
    );
    rigidRef.current.setRotation({ x: q.x, y: q.y, z: q.z, w: q.w }, true);

    // Random direction on XZ plane — will bounce off all 4 screen-edge walls
    const angle = Math.random() * Math.PI * 2;
    const speed = 9 + Math.random() * 5;
    rigidRef.current.setLinvel(
      {
        x: Math.cos(angle) * speed,
        y: 5 + Math.random() * 3, // toss upward, gravity brings it back
        z: Math.sin(angle) * speed,
      },
      true,
    );
    rigidRef.current.setAngvel(
      {
        x: (Math.random() - 0.5) * 35,
        y: (Math.random() - 0.5) * 35,
        z: (Math.random() - 0.5) * 35,
      },
      true,
    );

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (reported.current || !rigidRef.current) return;
      reported.current = true;
      const rot = rigidRef.current.rotation();
      onLanded?.(
        detectFaceUp(new THREE.Quaternion(rot.x, rot.y, rot.z, rot.w)),
      );
    }, 3800);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [trigger]);

  return (
    <RigidBody
      ref={rigidRef}
      colliders="cuboid"
      restitution={0.6}
      friction={0.5}
      linearDamping={0.35}
      angularDamping={0.3}
      position={position}
    >
      <mesh ref={meshRef} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        {materials.map((mat, i) => (
          <primitive object={mat} attach={`material-${i}`} key={i} />
        ))}
      </mesh>
    </RigidBody>
  );
}
