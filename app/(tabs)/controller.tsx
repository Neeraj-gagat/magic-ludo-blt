import { db } from "@/firebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import { get, ref, set } from "firebase/database";
import React, { useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function Controller() {
  const [selectedSum, setSelectedSum] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Possible dice sums (2-12)
  const possibleSums = Array.from({ length: 11 }, (_, i) => i + 2);

  // Send roll command to display app
  const sendRollCommand = async (sum: number) => {
    try {
      const diceControlRef = ref(db, "/diceControl");

      await set(diceControlRef, {
        roll: true,
        sum: sum,
        timestamp: Date.now(),
      });

      Alert.alert("Success", `Sent command to roll ${sum}!`);
      setSelectedSum(sum);
    } catch (error) {
      Alert.alert("Error", "Failed to send command. Check connection.");
      console.error(error);
    }
  };

  // Test connection
  const testConnection = async () => {
    try {
      const testRef = ref(db, "/diceControl/test");
      await set(testRef, true);

      // Try to read it back
      const snapshot = await get(testRef);
      if (snapshot.exists()) {
        setIsConnected(true);
        Alert.alert("Connected", "Firebase connection successful!");
      }
    } catch (error) {
      setIsConnected(false);
      Alert.alert("Connection Failed", "Cannot connect to Firebase.");
      console.error(error);
    }
  };

  // Get combinations for a sum
  const getCombinations = (sum: number): string => {
    const combinations: string[] = [];
    for (let i = 1; i <= 6; i++) {
      for (let j = 1; j <= 6; j++) {
        if (i + j === sum) {
          combinations.push(`${i}+${j}`);
        }
      }
    }
    return combinations.join(", ");
  };

  // Calculate probability
  const getProbability = (sum: number): string => {
    const combos = getCombinations(sum).split(",").length;
    return ((combos / 36) * 100).toFixed(1);
  };

  return (
    <View style={styles.container}>
      <View style={styles.overlay}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🎮 Dice Controller</Text>
          <TouchableOpacity
            style={[
              styles.connectionButton,
              { backgroundColor: isConnected ? "#2ecc71" : "#e74c3c" },
            ]}
            onPress={testConnection}
          >
            <Ionicons
              name={isConnected ? "checkmark-circle" : "close-circle"}
              size={24}
              color="white"
            />
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            Select a sum (2-12) to control the dice result on the display device
          </Text>
        </View>

        {/* Sum Selection Grid */}
        <ScrollView
          contentContainerStyle={styles.gridContainer}
          showsVerticalScrollIndicator={false}
        >
          {possibleSums.map((sum) => {
            const probability = getProbability(sum);

            return (
              <TouchableOpacity
                key={sum}
                style={[
                  styles.sumButton,
                  selectedSum === sum && styles.sumButtonSelected,
                ]}
                onPress={() => sendRollCommand(sum)}
              >
                <Text style={styles.sumNumber}>{sum}</Text>
                <Text style={styles.combinations}>{getCombinations(sum)}</Text>
                <Text style={styles.probability}>{probability}%</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.quickButton, { backgroundColor: "#e74c3c" }]}
            onPress={() => sendRollCommand(2)}
          >
            <Text style={styles.quickButtonText}>Snake Eyes (2)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickButton, { backgroundColor: "#2ecc71" }]}
            onPress={() => sendRollCommand(7)}
          >
            <Text style={styles.quickButtonText}>Lucky 7</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickButton, { backgroundColor: "#f39c12" }]}
            onPress={() => sendRollCommand(12)}
          >
            <Text style={styles.quickButtonText}>Boxcars (12)</Text>
          </TouchableOpacity>
        </View>

        {/* Random Roll */}
        <TouchableOpacity
          style={styles.randomButton}
          onPress={() => {
            const randomSum =
              possibleSums[Math.floor(Math.random() * possibleSums.length)];
            sendRollCommand(randomSum);
          }}
        >
          <Ionicons name="shuffle" size={24} color="white" />
          <Text style={styles.randomButtonText}>Random</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 40,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
  },
  connectionButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  instructions: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  instructionText: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingBottom: 20,
  },
  sumButton: {
    width: "30%",
    aspectRatio: 1,
    backgroundColor: "rgba(52, 152, 219, 0.8)",
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    padding: 10,
    borderWidth: 3,
    borderColor: "transparent",
  },
  sumButtonSelected: {
    borderColor: "#f4d03f",
    backgroundColor: "rgba(52, 152, 219, 1)",
  },
  sumNumber: {
    fontSize: 36,
    fontWeight: "bold",
    color: "white",
  },
  combinations: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 5,
    textAlign: "center",
  },
  probability: {
    fontSize: 12,
    color: "#f4d03f",
    fontWeight: "bold",
    marginTop: 5,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  quickButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 5,
    alignItems: "center",
  },
  quickButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  randomButton: {
    backgroundColor: "#9b59b6",
    flexDirection: "row",
    padding: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  randomButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
  },
});
