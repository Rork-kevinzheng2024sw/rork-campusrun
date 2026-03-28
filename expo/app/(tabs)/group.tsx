import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Users, MapPin, Clock, Zap, X, Plus, Edit3, Trash2, RefreshCw, Trophy, Target } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useRunStore } from '@/hooks/useRunStore';
import { GroupRun } from '@/types/run';
import { TeamRunGameScreen } from '@/components/TeamRunGameScreen';

interface CreateGroupRunForm {
  title: string;
  date: string;
  time: string;
  distance: string;
  location: string;
  maxParticipants: string;
  difficulty: 'easy' | 'medium' | 'hard';
  pace: string;
}

export default function GroupScreen() {
  const { 
    groupRuns, 
    isLoadingGroupRuns,
    joinGroupRun, 
    createGroupRun, 
    updateGroupRun,
    deleteGroupRun,
    refreshGroupRuns
  } = useRunStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGameScreen, setShowGameScreen] = useState(false);
  const [formData, setFormData] = useState<CreateGroupRunForm>({
    title: '',
    date: '',
    time: '',
    distance: '',
    location: '',
    maxParticipants: '8',
    difficulty: 'medium',
    pace: '5:30'
  });
  const [formErrors, setFormErrors] = useState<Partial<CreateGroupRunForm>>({});

  const handleJoinRun = async (groupRunId: string, title: string) => {
    Alert.alert(
      'Join Group Run',
      `Are you sure you want to join "${title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Join', 
          onPress: async () => {
            try {
              await joinGroupRun(groupRunId);
              Alert.alert('Success!', 'You\'ve joined the group run. See you there!');
            } catch (error) {
              Alert.alert('Error', 'Failed to join group run. Please try again.');
            }
          }
        }
      ]
    );
  };
  
  const handleEditRun = (run: GroupRun) => {
    // For demo, we'll just show an alert. In a real app, this would open an edit form
    Alert.alert(
      'Edit Group Run',
      `Edit "${run.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Edit Title', 
          onPress: () => {
            Alert.prompt(
              'Edit Title',
              'Enter new title:',
              async (newTitle) => {
                if (newTitle && newTitle.trim()) {
                  try {
                    await updateGroupRun(run.id, { title: newTitle.trim() });
                    Alert.alert('Success!', 'Group run updated successfully.');
                  } catch (error) {
                    Alert.alert('Error', 'Failed to update group run.');
                  }
                }
              },
              'plain-text',
              run.title
            );
          }
        }
      ]
    );
  };
  
  const handleDeleteRun = (run: GroupRun) => {
    Alert.alert(
      'Delete Group Run',
      `Are you sure you want to delete "${run.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteGroupRun(run.id);
              Alert.alert('Success!', 'Group run deleted successfully.');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete group run.');
            }
          }
        }
      ]
    );
  };

  const validateForm = (): boolean => {
    const errors: Partial<CreateGroupRunForm> = {};
    
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }
    
    if (!formData.date.trim()) {
      errors.date = 'Date is required';
    }
    
    if (!formData.time.trim()) {
      errors.time = 'Time is required';
    }
    
    if (!formData.distance.trim()) {
      errors.distance = 'Distance is required';
    } else if (isNaN(Number(formData.distance)) || Number(formData.distance) <= 0) {
      errors.distance = 'Distance must be a positive number';
    }
    
    if (!formData.location.trim()) {
      errors.location = 'Location is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateRun = async () => {
    if (!validateForm()) {
      return;
    }
    
    const newGroupRun: Omit<GroupRun, 'id' | 'participants' | 'organizer'> = {
      title: formData.title.trim(),
      date: formData.date.trim(),
      time: formData.time.trim(),
      distance: Number(formData.distance),
      location: formData.location.trim(),
      maxParticipants: Number(formData.maxParticipants),
      difficulty: formData.difficulty,
      pace: formData.pace
    };
    
    try {
      await createGroupRun(newGroupRun);
      setShowCreateModal(false);
      setFormData({
        title: '',
        date: '',
        time: '',
        distance: '',
        location: '',
        maxParticipants: '8',
        difficulty: 'medium',
        pace: '5:30'
      });
      setFormErrors({});
      Alert.alert('Success!', 'Your group run has been created!');
    } catch (error) {
      Alert.alert('Error', 'Failed to create group run. Please try again.');
    }
  };

  const updateFormData = (field: keyof CreateGroupRunForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return Colors.light.success;
      case 'medium': return Colors.light.accent;
      case 'hard': return Colors.light.error;
      default: return Colors.light.textLight;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* App Title Header */}
      <View style={styles.appHeader}>
        <Text style={styles.appTitle}>CampusRun</Text>
        <Text style={styles.appSubtitle}>Connect with campus runners</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Group Runs</Text>
          <Text style={styles.subtitle}>Find your running crew on campus</Text>
        </View>

        <View style={styles.quickStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{groupRuns.length}</Text>
            <Text style={styles.statLabel}>Active Groups</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>47</Text>
            <Text style={styles.statLabel}>Runners Online</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>3</Text>
            <Text style={styles.statLabel}>Runs Today</Text>
          </View>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={refreshGroupRuns}
            disabled={isLoadingGroupRuns}
          >
            <RefreshCw 
              size={20} 
              color={Colors.light.primary} 
              style={[styles.refreshIcon, isLoadingGroupRuns && styles.refreshIconLoading]} 
            />
          </TouchableOpacity>
        </View>

        <View style={styles.gameSection}>
          <TouchableOpacity 
            style={styles.gameButton}
            onPress={() => setShowGameScreen(true)}
          >
            <Trophy size={24} color="white" style={styles.gameButtonIcon} />
            <View style={styles.gameButtonContent}>
              <Text style={styles.gameButtonTitle}>Team Run Games</Text>
              <Text style={styles.gameButtonSubtitle}>Compete in area challenges</Text>
            </View>
            <Target size={20} color="white" style={styles.gameButtonArrow} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Runs</Text>
            {isLoadingGroupRuns && (
              <Text style={styles.loadingText}>Syncing...</Text>
            )}
          </View>
          
          {groupRuns.map((run) => (
            <View key={run.id} style={styles.runCard}>
              <View style={styles.runHeader}>
                <View style={styles.runTitleContainer}>
                  <Text style={styles.runTitle}>{run.title}</Text>
                  <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(run.difficulty) }]}>
                    <Text style={styles.difficultyText}>{run.difficulty}</Text>
                  </View>
                </View>
                <View style={styles.runActions}>
                  <Text style={styles.organizer}>by {run.organizer}</Text>
                  {run.organizer === 'You' && (
                    <View style={styles.actionButtons}>
                      <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => handleEditRun(run)}
                      >
                        <Edit3 size={16} color={Colors.light.secondary} />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => handleDeleteRun(run)}
                      >
                        <Trash2 size={16} color={Colors.light.error} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.runDetails}>
                <View style={styles.detailRow}>
                  <Clock size={16} color={Colors.light.textLight} />
                  <Text style={styles.detailText}>{formatDate(run.date)} at {run.time}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <MapPin size={16} color={Colors.light.textLight} />
                  <Text style={styles.detailText}>{run.location}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Zap size={16} color={Colors.light.textLight} />
                  <Text style={styles.detailText}>{run.distance}km • {run.pace} pace</Text>
                </View>
              </View>

              <View style={styles.runFooter}>
                <View style={styles.participantsContainer}>
                  <Users size={16} color={Colors.light.textLight} />
                  <Text style={styles.participantsText}>
                    {run.participants}/{run.maxParticipants} runners
                  </Text>
                </View>
                
                <TouchableOpacity 
                  style={[
                    styles.joinButton,
                    run.participants >= run.maxParticipants && styles.joinButtonDisabled
                  ]}
                  onPress={() => handleJoinRun(run.id, run.title)}
                  disabled={run.participants >= run.maxParticipants}
                >
                  <Text style={[
                    styles.joinButtonText,
                    run.participants >= run.maxParticipants && styles.joinButtonTextDisabled
                  ]}>
                    {run.participants >= run.maxParticipants ? 'Full' : 'Join'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.createSection}>
          <TouchableOpacity 
            style={styles.createButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Plus size={20} color="white" style={styles.createButtonIcon} />
            <Text style={styles.createButtonText}>Create New Group Run</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular Routes</Text>
          
          <View style={styles.routeCard}>
            <Text style={styles.routeTitle}>Campus Loop Classic</Text>
            <Text style={styles.routeDescription}>5.2km • Moderate hills • Great for beginners</Text>
            <View style={styles.routeStats}>
              <Text style={styles.routeStat}>⭐ 4.8</Text>
              <Text style={styles.routeStat}>🏃‍♂️ 156 runs</Text>
              <Text style={styles.routeStat}>⏱️ ~30min</Text>
            </View>
          </View>

          <View style={styles.routeCard}>
            <Text style={styles.routeTitle}>River Trail Adventure</Text>
            <Text style={styles.routeDescription}>7.1km • Flat terrain • Scenic views</Text>
            <View style={styles.routeStats}>
              <Text style={styles.routeStat}>⭐ 4.9</Text>
              <Text style={styles.routeStat}>🏃‍♂️ 203 runs</Text>
              <Text style={styles.routeStat}>⏱️ ~40min</Text>
            </View>
          </View>

          <View style={styles.routeCard}>
            <Text style={styles.routeTitle}>Hill Challenge Circuit</Text>
            <Text style={styles.routeDescription}>4.3km • Steep hills • Advanced runners</Text>
            <View style={styles.routeStats}>
              <Text style={styles.routeStat}>⭐ 4.6</Text>
              <Text style={styles.routeStat}>🏃‍♂️ 89 runs</Text>
              <Text style={styles.routeStat}>⏱️ ~35min</Text>
            </View>
          </View>
        </View>
      </ScrollView>
      
      <Modal
        visible={showGameScreen}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <TeamRunGameScreen onClose={() => setShowGameScreen(false)} />
      </Modal>
      
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Group Run</Text>
            <TouchableOpacity 
              onPress={() => setShowCreateModal(false)}
              style={styles.closeButton}
            >
              <X size={24} color={Colors.light.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Title *</Text>
              <TextInput
                style={[styles.formInput, formErrors.title && styles.formInputError]}
                value={formData.title}
                onChangeText={(value) => updateFormData('title', value)}
                placeholder="e.g., Morning Campus Loop"
                placeholderTextColor={Colors.light.textLight}
              />
              {formErrors.title && <Text style={styles.errorText}>{formErrors.title}</Text>}
            </View>
            
            <View style={styles.formRow}>
              <View style={[styles.formGroup, styles.formGroupHalf]}>
                <Text style={styles.formLabel}>Date *</Text>
                <TextInput
                  style={[styles.formInput, formErrors.date && styles.formInputError]}
                  value={formData.date}
                  onChangeText={(value) => updateFormData('date', value)}
                  placeholder="2024-01-15"
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
                  placeholder="7:00 AM"
                  placeholderTextColor={Colors.light.textLight}
                />
                {formErrors.time && <Text style={styles.errorText}>{formErrors.time}</Text>}
              </View>
            </View>
            
            <View style={styles.formRow}>
              <View style={[styles.formGroup, styles.formGroupHalf]}>
                <Text style={styles.formLabel}>Distance (km) *</Text>
                <TextInput
                  style={[styles.formInput, formErrors.distance && styles.formInputError]}
                  value={formData.distance}
                  onChangeText={(value) => updateFormData('distance', value)}
                  placeholder="5.0"
                  keyboardType="numeric"
                  placeholderTextColor={Colors.light.textLight}
                />
                {formErrors.distance && <Text style={styles.errorText}>{formErrors.distance}</Text>}
              </View>
              
              <View style={[styles.formGroup, styles.formGroupHalf]}>
                <Text style={styles.formLabel}>Max Participants</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.maxParticipants}
                  onChangeText={(value) => updateFormData('maxParticipants', value)}
                  placeholder="8"
                  keyboardType="numeric"
                  placeholderTextColor={Colors.light.textLight}
                />
              </View>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Location *</Text>
              <TextInput
                style={[styles.formInput, formErrors.location && styles.formInputError]}
                value={formData.location}
                onChangeText={(value) => updateFormData('location', value)}
                placeholder="e.g., Main Campus Entrance"
                placeholderTextColor={Colors.light.textLight}
              />
              {formErrors.location && <Text style={styles.errorText}>{formErrors.location}</Text>}
            </View>
            
            <View style={styles.formRow}>
              <View style={[styles.formGroup, styles.formGroupHalf]}>
                <Text style={styles.formLabel}>Difficulty</Text>
                <View style={styles.difficultySelector}>
                  {(['easy', 'medium', 'hard'] as const).map((level) => (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.difficultyOption,
                        formData.difficulty === level && styles.difficultyOptionSelected,
                        { backgroundColor: formData.difficulty === level ? getDifficultyColor(level) : Colors.light.card }
                      ]}
                      onPress={() => updateFormData('difficulty', level)}
                    >
                      <Text style={[
                        styles.difficultyOptionText,
                        formData.difficulty === level && styles.difficultyOptionTextSelected
                      ]}>
                        {level}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <View style={[styles.formGroup, styles.formGroupHalf]}>
                <Text style={styles.formLabel}>Target Pace</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.pace}
                  onChangeText={(value) => updateFormData('pace', value)}
                  placeholder="5:30"
                  placeholderTextColor={Colors.light.textLight}
                />
              </View>
            </View>
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.submitButton}
              onPress={handleCreateRun}
            >
              <Text style={styles.submitButtonText}>Create Group Run</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  appHeader: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: Colors.light.card,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.light.primary,
    marginBottom: 4,
  },
  appSubtitle: {
    fontSize: 14,
    color: Colors.light.textLight,
    fontWeight: '500',
  },
  header: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.textLight,
    textAlign: 'center',
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.textLight,
    marginTop: 4,
  },
  refreshButton: {
    position: 'absolute',
    top: -10,
    right: 10,
    padding: 8,
  },
  refreshIcon: {
    opacity: 0.7,
  },
  refreshIconLoading: {
    opacity: 0.3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.light.secondary,
    fontStyle: 'italic',
  },
  runActions: {
    alignItems: 'flex-end',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  actionButton: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: Colors.light.background,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 16,
  },
  runCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  runHeader: {
    marginBottom: 12,
  },
  runTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  runTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    flex: 1,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  organizer: {
    fontSize: 14,
    color: Colors.light.textLight,
    marginBottom: 2,
  },
  runDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: Colors.light.text,
    marginLeft: 8,
  },
  runFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  participantsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantsText: {
    fontSize: 14,
    color: Colors.light.textLight,
    marginLeft: 8,
  },
  joinButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  joinButtonDisabled: {
    backgroundColor: Colors.light.textLight,
  },
  joinButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  joinButtonTextDisabled: {
    color: 'white',
  },
  createSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  createButton: {
    backgroundColor: Colors.light.secondary,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  createButtonIcon: {
    marginRight: 8,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formGroupHalf: {
    flex: 1,
  },
  formRow: {
    flexDirection: 'row',
    gap: 16,
  },
  formLabel: {
    fontSize: 16,
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
  errorText: {
    color: Colors.light.error,
    fontSize: 14,
    marginTop: 4,
  },
  difficultySelector: {
    flexDirection: 'row',
    gap: 8,
  },
  difficultyOption: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  difficultyOptionSelected: {
    borderColor: 'transparent',
  },
  difficultyOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    textTransform: 'capitalize',
  },
  difficultyOptionTextSelected: {
    color: 'white',
  },
  modalFooter: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  submitButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  routeCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  routeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 4,
  },
  routeDescription: {
    fontSize: 14,
    color: Colors.light.textLight,
    marginBottom: 8,
  },
  routeStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  routeStat: {
    fontSize: 12,
    color: Colors.light.textLight,
  },
  gameSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  gameButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  gameButtonIcon: {
    marginRight: 16,
  },
  gameButtonContent: {
    flex: 1,
  },
  gameButtonTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  gameButtonSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  gameButtonArrow: {
    opacity: 0.8,
  },
});