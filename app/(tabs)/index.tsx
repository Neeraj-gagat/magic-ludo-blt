import Dice from "@/components/Dice";
import ProceduralWoodFloor from "@/components/ProceduralWoodFloor";
import { db } from "@/firebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import { Canvas } from "@react-three/fiber/native";
import { onValue, ref, update } from "firebase/database";
import { useEffect, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function Index() {
  const [rollCounter, setRollCounter] = useState(0); // FIXED: Use counter instead of boolean
  const [dice1Value, setDice1Value] = useState<number | undefined>(undefined);
  const [dice2Value, setDice2Value] = useState<number | undefined>(undefined);
  const [totalSum, setTotalSum] = useState(0);
  const [showSum, setShowSum] = useState(false);
  const [bothDiceLanded, setBothDiceLanded] = useState(false);
  const sumOpacity = useState(new Animated.Value(0))[0];
  const sumScale = useState(new Animated.Value(0.5))[0];

  // Track which dice have landed
  const [dice1Landed, setDice1Landed] = useState(false);
  const [dice2Landed, setDice2Landed] = useState(false);

  // Listen for remote control commands from Controller App
  useEffect(() => {
    const reference = ref(db, "/diceControl");

    const unsubscribe = onValue(reference, (snapshot) => {
      const data = snapshot.val();

      if (data?.roll && data?.sum) {
        const sum = data.sum;

        const combinations = generateDiceCombinations(sum);
        const selected =
          combinations[Math.floor(Math.random() * combinations.length)];

        setDice1Value(selected[0]);
        setDice2Value(selected[1]);

        // FIXED: Increment counter to trigger new roll
        setRollCounter((prev) => prev + 1);

        // Reset landing states
        setDice1Landed(false);
        setDice2Landed(false);
        setBothDiceLanded(false);
        setShowSum(false);

        // Clear command
        update(ref(db, "/diceControl"), { roll: false });
      }
    });

    return () => unsubscribe();
  }, []);

  // Generate all possible dice combinations for a target sum
  const generateDiceCombinations = (sum: number): [number, number][] => {
    const combinations: [number, number][] = [];
    for (let i = 1; i <= 6; i++) {
      for (let j = 1; j <= 6; j++) {
        if (i + j === sum) {
          combinations.push([i, j]);
        }
      }
    }
    return combinations.length > 0 ? combinations : [[1, 1]];
  };

  const handleLocalRoll = () => {
    // FIXED: Reset everything before rolling
    setDice1Value(undefined);
    setDice2Value(undefined);
    setShowSum(false);
    setDice1Landed(false);
    setDice2Landed(false);
    setBothDiceLanded(false);

    // Increment counter to trigger roll
    setRollCounter((prev) => prev + 1);
  };

  const handleDiceLanded = (diceNumber: 1 | 2, value: number) => {
    if (diceNumber === 1) {
      setDice1Value(value);
      setDice1Landed(true);
    } else {
      setDice2Value(value);
      setDice2Landed(true);
    }
  };

  // Check when both dice have landed
  useEffect(() => {
    if (dice1Landed && dice2Landed && !bothDiceLanded) {
      setBothDiceLanded(true);
    }
  }, [dice1Landed, dice2Landed]);

  // Show sum animation when both dice have landed
  useEffect(() => {
    if (bothDiceLanded && dice1Value && dice2Value) {
      const sum = dice1Value + dice2Value;
      setTotalSum(sum);
      setShowSum(true);

      // Animate sum display
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
        // Fade out after 2.5 seconds
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
          ]).start(() => {
            setShowSum(false);
          });
        }, 2500);
      });
    }
  }, [bothDiceLanded, dice1Value, dice2Value]);

  return (
    <ProceduralWoodFloor>
      <View style={styles.header}>
        <TouchableOpacity style={styles.settingsButton}>
          <Ionicons name="settings-outline" size={32} color="#5c9ead" />
        </TouchableOpacity>
      </View>

      <View style={styles.canvasContainer}>
        <Canvas camera={{ position: [0, 8, 8], fov: 50 }} shadows>
          {/* Ground plane with shadow */}
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, 0, 0]}
            receiveShadow
          >
            <planeGeometry args={[20, 20]} />
            <shadowMaterial opacity={0.4} />
          </mesh>

          {/* Lighting setup */}
          <ambientLight intensity={0.6} />
          <directionalLight
            position={[5, 10, 5]}
            intensity={1.2}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-far={50}
            shadow-camera-left={-10}
            shadow-camera-right={10}
            shadow-camera-top={10}
            shadow-camera-bottom={-10}
          />
          <pointLight position={[-5, 5, -5]} intensity={0.3} />

          {/* Two dice with controlled values */}
          <Dice
            rollTrigger={rollCounter}
            targetValue={dice1Value}
            position={[-1.3, 0.5, 0]}
            onLanded={(value) => handleDiceLanded(1, value)}
          />
          <Dice
            rollTrigger={rollCounter}
            targetValue={dice2Value}
            position={[1.3, 0.5, 0]}
            onLanded={(value) => handleDiceLanded(2, value)}
          />
        </Canvas>

        {/* Sum display - centered overlay */}
        {showSum && (
          <Animated.View
            style={[
              styles.sumContainer,
              {
                opacity: sumOpacity,
                transform: [{ scale: sumScale }],
              },
            ]}
          >
            <Text style={styles.sumText}>{totalSum}</Text>
          </Animated.View>
        )}
      </View>

      {/* Roll button */}
      <TouchableOpacity
        onPress={handleLocalRoll}
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
