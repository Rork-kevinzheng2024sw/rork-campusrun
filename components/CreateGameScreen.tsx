import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, X, Target } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useRunStore } from '@/hooks/useRunStore';
import { TeamRunGame, GameCheckpoint } from '@/types/run';

interface CreateGameScreenProps {
  onClose: () => void;
  onGameCreated: () => void;
}

interface CreateGameForm {
  title: string;
  description: string;
  date: string;
  time: string;
  centerLat: string;
  centerLng: string;
  radius: string;
}

export function CreateGameScreen({ onClose, onGameCreated }: CreateGameScreenProps) {
  const { createTeamRunGame } = useRunStore();
  
  const [formData, setFormData] = useState<CreateGameForm>({
    title: '',
    description: '',
    date: '',
    time: '',
    centerLat: '40.7549',
    centerLng: '-73.9840',
    radius: '1500'
  });
  
  const [checkpoints, setCheckpoints] = useState<Omit<GameCheckpoint, 'id'>[]>([
    {
      latitude: 40.7589,
      longitude: -73.9851,
      name: 'Library Entrance',
      description: 'Take a photo at the main library entrance'
    },
    {
      latitude: 40.7614,
      longitude: -73.9776,
      name: 'Student Center',
      description: 'Capture the student center plaza'
    }
  ]);
  
  const [formErrors, setFormErrors] = useState<Partial<CreateGameForm>>({});

  const validateForm = (): boolean => {
    const errors: Partial<CreateGameForm> = {};
    
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }
    
    if (!formData.date.trim()) {
      errors.date = 'Date is required';
    }
    
    if (!formData.time.trim()) {
      errors.time = 'Time is required';
    }
    
    if (!formData.centerLat.trim() || isNaN(Number(formData.centerLat))) {
      errors.centerLat = 'Valid latitude is required';
    }
    
    if (!formData.centerLng.trim() || isNaN(Number(formData.centerLng))) {
      errors.centerLng = 'Valid longitude is required';
    }
    
    if (!formData.radius.trim() || isNaN(Number(formData.radius)) || Number(formData.radius) <= 0) {
      errors.radius = 'Valid radius is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateGame = async () => {
    if (!validateForm()) {
      return;
    }
    
    if (checkpoints.length < 2) {
      Alert.alert('Error', 'At least 2 checkpoints are required');
      return;
    }
    
    const gameCheckpoints: GameCheckpoint[] = checkpoints.map((cp, index) => ({
      ...cp,
      id: `cp${index + 1}`
    }));
    
    const newGame: Omit<TeamRunGame, 'id' | 'participants' | 'status'> = {
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      date: formData.date.trim(),
      time: formData.time.trim(),
      createdBy: 'You',
      checkpoints: gameCheckpoints,
      gameArea: {
        center: {
          latitude: Number(formData.centerLat),
          longitude: Number(formData.centerLng)
        },
        radius: Number(formData.radius)
      }
    };
    
    try {
      await createTeamRunGame(newGame);
      Alert.alert('Success!', 'Your team run game has been created!');
      onGameCreated();
    } catch {
      Alert.alert('Error', 'Failed to create team run game. Please try again.');
    }
  };

  const updateFormData = (field: keyof CreateGameForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const addCheckpoint = () => {
    setCheckpoints(prev => [...prev, {
      latitude: Number(formData.centerLat),
      longitude: Number(formData.centerLng),
      name: `Checkpoint ${prev.length + 1}`,
      description: 'Add checkpoint description'
    }]);
  };

  const removeCheckpoint = (index: number) => {
    if (checkpoints.length > 2) {
      setCheckpoints(prev => prev.filter((_, i) => i !== index));
    } else {
      Alert.alert('Error', 'At least 2 checkpoints are required');
    }
  };

  const updateCheckpoint = (index: number, field: keyof Omit<GameCheckpoint, 'id'>, value: string | number) => {
    setCheckpoints(prev => prev.map((cp, i) => 
      i === index ? { ...cp, [field]: value } : cp
    ));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Create Team Game</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Game Details</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Title *</Text>
            <TextInput
              style={[styles.formInput, formErrors.title && styles.formInputError]}
              value={formData.title}
              onChangeText={(value) => updateFormData('title', value)}
              placeholder="e.g., Campus Explorer Challenge"
              placeholderTextColor={Colors.light.textLight}
            />
            {formErrors.title && <Text style={styles.errorText}>{formErrors.title}</Text>}
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Description</Text>
            <TextInput
              style={[styles.formInput, styles.textArea]}
              value={formData.description}
              onChangeText={(value) => updateFormData('description', value)}
              placeholder="Describe your game challenge..."
              placeholderTextColor={Colors.light.textLight}
              multiline
              numberOfLines={3}
            />
          </View>
          
          <View style={styles.formRow}>
            <View style={[styles.formGroup, styles.formGroupHalf]}>
              <Text style={styles.formLabel}>Date *</Text>
              <TextInput
                style={[styles.formInput, formErrors.date && styles.formInputError]}
                value={formData.date}
                onChangeText={(value) => updateFormData('date', value)}
                placeholder="2024-01-20"
                placeholderTextColor={Colors.light.textLight}
              />
              {formErrors.date && <Text style={styles.errorText}>{formErrors.date}</Text>}
            </View>
            
            <View style={[styles.formGroup, styles.formGroupHalf]}>
              <Text style={styles.formLabel}>Time *</Text>
              <TextInput
                style={[styles.formInput, formErrors.time && styles.formInputError]}
                value={formData.time}
                onChangeText={(value) => updateFormData('time', value)}
                placeholder="2:00 PM"
                placeholderTextColor={Colors.light.textLight}
              />
              {formErrors.time && <Text style={styles.errorText}>{formErrors.time}</Text>}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Game Area</Text>
          
          <View style={styles.formRow}>
            <View style={[styles.formGroup, styles.formGroupHalf]}>
              <Text style={styles.formLabel}>Center Latitude *</Text>
              <TextInput
                style={[styles.formInput, formErrors.centerLat && styles.formInputError]}
                value={formData.centerLat}
                onChangeText={(value) => updateFormData('centerLat', value)}
                placeholder="40.7549"
                keyboardType="numeric"
                placeholderTextColor={Colors.light.textLight}
              />
              {formErrors.centerLat && <Text style={styles.errorText}>{formErrors.centerLat}</Text>}
            </View>
            
            <View style={[styles.formGroup, styles.formGroupHalf]}>
              <Text style={styles.formLabel}>Center Longitude *</Text>
              <TextInput
                style={[styles.formInput, formErrors.centerLng && styles.formInputError]}
                value={formData.centerLng}
                onChangeText={(value) => updateFormData('centerLng', value)}
                placeholder="-73.9840"
                keyboardType="numeric"
                placeholderTextColor={Colors.light.textLight}
              />
              {formErrors.centerLng && <Text style={styles.errorText}>{formErrors.centerLng}</Text>}
            </View>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Radius (meters) *</Text>
            <TextInput
              style={[styles.formInput, formErrors.radius && styles.formInputError]}
              value={formData.radius}
              onChangeText={(value) => updateFormData('radius', value)}
              placeholder="1500"
              keyboardType="numeric"
              placeholderTextColor={Colors.light.textLight}
            />
            {formErrors.radius && <Text style={styles.errorText}>{formErrors.radius}</Text>}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Checkpoints ({checkpoints.length})</Text>
            <TouchableOpacity style={styles.addButton} onPress={addCheckpoint}>
              <Plus size={20} color={Colors.light.primary} />
            </TouchableOpacity>
          </View>
          
          {checkpoints.map((checkpoint, index) => (
            <View key={index} style={styles.checkpointCard}>
              <View style={styles.checkpointHeader}>
                <View style={styles.checkpointIcon}>
                  <Target size={16} color={Colors.light.primary} />
                </View>
                <Text style={styles.checkpointTitle}>Checkpoint {index + 1}</Text>
                {checkpoints.length > 2 && (
                  <TouchableOpacity 
                    style={styles.removeButton}
                    onPress={() => removeCheckpoint(index)}
                  >
                    <X size={16} color={Colors.light.error} />
                  </TouchableOpacity>
                )}
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Name</Text>
                <TextInput
                  style={styles.formInput}
                  value={checkpoint.name}
                  onChangeText={(value) => updateCheckpoint(index, 'name', value)}
                  placeholder="Checkpoint name"
                  placeholderTextColor={Colors.light.textLight}
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description</Text>
                <TextInput
                  style={styles.formInput}
                  value={checkpoint.description || ''}
                  onChangeText={(value) => updateCheckpoint(index, 'description', value)}
                  placeholder="Photo instructions..."
                  placeholderTextColor={Colors.light.textLight}
                />
              </View>
              
              <View style={styles.formRow}>
                <View style={[styles.formGroup, styles.formGroupHalf]}>
                  <Text style={styles.formLabel}>Latitude</Text>
                  <TextInput
                    style={styles.formInput}
                    value={checkpoint.latitude.toString()}
                    onChangeText={(value) => updateCheckpoint(index, 'latitude', Number(value) || 0)}
                    placeholder="40.7589"
                    keyboardType="numeric"
                    placeholderTextColor={Colors.light.textLight}
                  />
                </View>
                
                <View style={[styles.formGroup, styles.formGroupHalf]}>
                  <Text style={styles.formLabel}>Longitude</Text>
                  <TextInput
                    style={styles.formInput}
                    value={checkpoint.longitude.toString()}
                    onChangeText={(value) => updateCheckpoint(index, 'longitude', Number(value) || 0)}
                    placeholder="-73.9851"
                    keyboardType="numeric"
                    placeholderTextColor={Colors.light.textLight}
                  />
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={handleCreateGame}
        >
          <Text style={styles.createButtonText}>Create Team Game</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 16,
  },
  addButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.light.card,
  },
  formGroup: {
    marginBottom: 16,
  },
  formGroupHalf: {
    flex: 1,
  },
  formRow: {
    flexDirection: 'row',
    gap: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  formInputError: {
    borderColor: Colors.light.error,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    color: Colors.light.error,
    fontSize: 12,
    marginTop: 4,
  },
  checkpointCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  checkpointHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkpointIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkpointTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.text,
    flex: 1,
  },
  removeButton: {
    padding: 4,
  },
  footer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  createButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
  },
  createButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});