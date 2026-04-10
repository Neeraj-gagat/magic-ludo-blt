import Dice from "@/components/Dice";
import ProceduralWoodFloor from "@/components/ProceduralWoodFloor";
import { db } from "@/firebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import { Canvas, useThree } from "@react-three/fiber/native";
import { Physics, RigidBody } from "@react-three/rapier";
import { onValue, ref, update } from "firebase/database";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Camera height above the floor — drives wall sizing
const CAM_HEIGHT = 14;
const CAM_FOV = 50;

/**
 * Invisible walls that hug the visible screen edges.
 * Uses useThree() viewport to get the exact world-space visible area.
 */
function ScreenWalls() {
  const { viewport } = useThree();
  const hw = viewport.width / 2; // half-width in world units
  const hh = viewport.height / 2; // half-height in world units
  const wallThick = 0.5;
  const wallH = 10; // tall enough so dice can't jump over

  return (
    <>
      {/* Floor */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[viewport.width + 2, viewport.height + 2]} />
          <meshStandardMaterial color="#8B6914" roughness={0.9} />
        </mesh>
      </RigidBody>

      {/* Left wall — at left screen edge */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[-hw - wallThick / 2, wallH / 2, 0]}>
          <boxGeometry args={[wallThick, wallH, viewport.height + 2]} />
          <meshStandardMaterial transparent opacity={0} />
        </mesh>
      </RigidBody>

      {/* Right wall — at right screen edge */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[hw + wallThick / 2, wallH / 2, 0]}>
          <boxGeometry args={[wallThick, wallH, viewport.height + 2]} />
          <meshStandardMaterial transparent opacity={0} />
        </mesh>
      </RigidBody>

      {/* Top wall — at top screen edge */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, wallH / 2, -hh - wallThick / 2]}>
          <boxGeometry args={[viewport.width + 2, wallH, wallThick]} />
          <meshStandardMaterial transparent opacity={0} />
        </mesh>
      </RigidBody>

      {/* Bottom wall — at bottom screen edge */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, wallH / 2, hh + wallThick / 2]}>
          <boxGeometry args={[viewport.width + 2, wallH, wallThick]} />
          <meshStandardMaterial transparent opacity={0} />
        </mesh>
      </RigidBody>

      {/* Ceiling — stops dice escaping upward */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, wallH, 0]}>
          <boxGeometry
            args={[viewport.width + 2, wallThick, viewport.height + 2]}
          />
          <meshStandardMaterial transparent opacity={0} />
        </mesh>
      </RigidBody>

      {/* Lights */}
      <ambientLight intensity={0.7} />
      <directionalLight position={[0, 20, 0]} intensity={2.5} castShadow />
      <pointLight position={[-3, 10, -3]} intensity={0.8} color="#fff8e7" />
      <pointLight position={[3, 10, 3]} intensity={0.8} color="#fff8e7" />
    </>
  );
}

export default function Index() {
  const [rollCounter, setRollCounter] = useState(0);
  const [dice1Value, setDice1Value] = useState<number | undefined>(undefined);
  const [dice2Value, setDice2Value] = useState<number | undefined>(undefined);
  const [totalSum, setTotalSum] = useState(0);
  const [showSum, setShowSum] = useState(false);

  const sumOpacity = useRef(new Animated.Value(0)).current;
  const sumScale = useRef(new Animated.Value(0.5)).current;

  const d1Ref = useRef<number | undefined>(undefined);
  const d2Ref = useRef<number | undefined>(undefined);
  const d1Done = useRef(false);
  const d2Done = useRef(false);

  const generateDiceCombinations = (sum: number): [number, number][] => {
    const combinations: [number, number][] = [];
    for (let i = 1; i <= 6; i++)
      for (let j = 1; j <= 6; j++) if (i + j === sum) combinations.push([i, j]);
    return combinations.length > 0 ? combinations : [[1, 1]];
  };

  useEffect(() => {
    const reference = ref(db, "/diceControl");
    const unsubscribe = onValue(reference, (snapshot) => {
      const data = snapshot.val();
      if (data?.roll && data?.sum) {
        const combos = generateDiceCombinations(data.sum);
        const sel = combos[Math.floor(Math.random() * combos.length)];
        triggerRoll();
        update(ref(db, "/diceControl"), { roll: false });
      }
    });
    return () => unsubscribe();
  }, []);

  const triggerRoll = () => {
    d1Done.current = false;
    d2Done.current = false;
    d1Ref.current = undefined;
    d2Ref.current = undefined;
    setDice1Value(undefined);
    setDice2Value(undefined);
    setShowSum(false);
    sumOpacity.setValue(0);
    sumScale.setValue(0.5);
    setRollCounter((prev) => prev + 1);
  };

  const showSumAnimation = (sum: number) => {
    setTotalSum(sum);
    setShowSum(true);
    Animated.parallel([
      Animated.spring(sumScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(sumOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(sumOpacity, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.spring(sumScale, {
            toValue: 0.5,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }),
        ]).start(() => setShowSum(false));
      }, 2500);
    });
  };

  const handleDice1Landed = (value: number) => {
    d1Ref.current = value;
    d1Done.current = true;
    setDice1Value(value);
    if (d2Done.current && d2Ref.current !== undefined) {
      showSumAnimation(value + d2Ref.current);
    }
  };

  const handleDice2Landed = (value: number) => {
    d2Ref.current = value;
    d2Done.current = true;
    setDice2Value(value);
    if (d1Done.current && d1Ref.current !== undefined) {
      showSumAnimation(d1Ref.current + value);
    }
  };

  return (
    <ProceduralWoodFloor>
      <View style={styles.header}>
        <TouchableOpacity style={styles.settingsButton}>
          <Ionicons name="settings-outline" size={32} color="#5c9ead" />
        </TouchableOpacity>
      </View>

      <View style={styles.canvasContainer}>
        <Canvas
          shadows
          camera={{
            // Straight down — top-down view like looking at a table from above
            position: [0, CAM_HEIGHT, 0],
            rotation: [-Math.PI / 2, 0, 0],
            fov: CAM_FOV,
            near: 0.1,
            far: 100,
          }}
        >
          <Physics gravity={[0, -20, 0]}>
            <ScreenWalls />

            {/* Two dice spawn in center, thrown in random directions */}
            <Dice
              trigger={rollCounter}
              position={[-0.8, 3, 0]}
              onLanded={handleDice1Landed}
            />
            <Dice
              trigger={rollCounter}
              position={[0.8, 3, 0]}
              onLanded={handleDice2Landed}
            />
          </Physics>
        </Canvas>

        {showSum && (
          <Animated.View
            style={[
              styles.sumContainer,
              { opacity: sumOpacity, transform: [{ scale: sumScale }] },
            ]}
          >
            <Text style={styles.sumText}>{totalSum}</Text>
          </Animated.View>
        )}
      </View>

      <TouchableOpacity
        onPress={triggerRoll}
        style={styles.rollButton}
        activeOpacity={0.8}
      >
        <Text style={styles.rollButtonText}>ROLL</Text>
      </TouchableOpacity>
    </ProceduralWoodFloor>
  );
}

const styles = StyleSheet.create({
  header: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
  },
  settingsButton: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 28,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  canvasContainer: {
    flex: 1,
  },
  sumContainer: {
    position: "absolute",
    top: "40%",
    alignSelf: "center",
  },
  sumText: {
    fontSize: 140,
    fontWeight: "900",
    color: "#2c3e50",
    textShadowColor: "#f4d03f",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 25,
  },
  rollButton: {
    position: "absolute",
    bottom: 50,
    alignSelf: "center",
    backgroundColor: "#3498db",
    paddingHorizontal: 110,
    paddingVertical: 22,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
  },
  rollButtonText: {
    color: "white",
    fontSize: 36,
    fontWeight: "bold",
    letterSpacing: 10,
    textTransform: "uppercase",
  },
});
