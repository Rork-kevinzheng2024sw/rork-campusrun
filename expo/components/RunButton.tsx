import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Play, Square } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface RunButtonProps {
  isRunning: boolean;
  onPress: () => void;
}

export default function RunButton({ isRunning, onPress }: RunButtonProps) {
  return (
    <TouchableOpacity 
      style={[styles.button, { backgroundColor: isRunning ? Colors.light.error : Colors.light.primary }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.iconContainer}>
        {isRunning ? (
          <Square size={32} color="white" fill="white" />
        ) : (
          <Play size={32} color="white" fill="white" />
        )}
      </View>
      <Text style={styles.buttonText}>
        {isRunning ? 'Stop Run' : 'Start Run'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 50,
    paddingVertical: 20,
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
    minWidth: 200,
  },
  iconContainer: {
    marginBottom: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});