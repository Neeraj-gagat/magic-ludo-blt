import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, View } from "react-native";

/**
 * ProceduralWoodFloor - Creates a wood plank texture using gradients
 * Use this if you don't have a wood-floor.jpg image
 */
export default function ProceduralWoodFloor({
  children,
}: {
  children: React.ReactNode;
}) {
  // Wood plank colors (light wood like in reference)
  const plankColors: [string, string, string][] = [
    ["#d4a574", "#c49563", "#b88552"],
    ["#c99862", "#b88752", "#a77641"],
    ["#d8ad7a", "#c79d6a", "#b68d5a"],
    ["#cfa068", "#be9058", "#ad8048"],
    ["#d2a46e", "#c1945e", "#b0844e"],
  ];

  return (
    <View style={styles.container}>
      {/* Create wood planks */}
      <View style={styles.planksContainer}>
        {Array.from({ length: 20 }).map((_, rowIndex) => (
          <View key={rowIndex} style={styles.plankRow}>
            {Array.from({ length: 6 }).map((_, colIndex) => {
              const colorSet =
                plankColors[(rowIndex + colIndex) % plankColors.length];
              return (
                <LinearGradient
                  key={colIndex}
                  colors={colorSet}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.plank,
                    { width: 60 + Math.random() * 120 }, // Random plank widths
                  ]}
                />
              );
            })}
          </View>
        ))}
      </View>

      {/* Content overlay */}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  planksContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "column",
  },
  plankRow: {
    flexDirection: "row",
    height: 80, // Each plank height
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  plank: {
    height: "100%",
    borderRightWidth: 2,
    borderRightColor: "rgba(0,0,0,0.15)",
  },
  content: {
    flex: 1,
  },
});
