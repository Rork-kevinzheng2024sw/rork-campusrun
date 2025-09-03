import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Trophy, Zap, CheckCircle, Circle, RefreshCw } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useRunStore } from '@/hooks/useRunStore';

export default function TasksScreen() {
  const { 
    tasks, 
    isLoadingTasks,
    completeTask, 
    refreshTasks 
  } = useRunStore();
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);

  const handleCompleteTask = (taskId: string, title: string) => {
    Alert.alert(
      'Start Task with GPS',
      `Start "${title}" with real GPS tracking?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Start Task', 
          onPress: async () => {
            setCompletingTaskId(taskId);
            try {
              await completeTask(taskId);
              Alert.alert('Congratulations!', 'Task completed! You earned reward points.');
            } catch (error) {
              Alert.alert('Error', 'Failed to complete task. Please try again.');
            } finally {
              setCompletingTaskId(null);
            }
          }
        }
      ]
    );
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return Colors.light.success;
      case 'medium': return Colors.light.accent;
      case 'hard': return Colors.light.error;
      default: return Colors.light.textLight;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'exploration': return MapPin;
      case 'challenge': return Zap;
      case 'social': return Trophy;
      default: return MapPin;
    }
  };

  const completedTasks = tasks.filter(task => task.completed);
  const availableTasks = tasks.filter(task => !task.completed);
  const totalRewards = completedTasks.reduce((sum, task) => sum + task.reward, 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* App Title Header */}
      <View style={styles.appHeader}>
        <Text style={styles.appTitle}>CampusRun</Text>
        <Text style={styles.appSubtitle}>Explore & complete challenges</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Campus Tasks</Text>
          <Text style={styles.subtitle}>Explore, challenge, and earn rewards!</Text>
        </View>

        <View style={styles.rewardsContainer}>
          <View style={styles.rewardCard}>
            <Trophy size={24} color={Colors.light.accent} />
            <Text style={styles.rewardPoints}>{totalRewards}</Text>
            <Text style={styles.rewardLabel}>Points Earned</Text>
          </View>
          <View style={styles.rewardCard}>
            <CheckCircle size={24} color={Colors.light.success} />
            <Text style={styles.rewardPoints}>{completedTasks.length}</Text>
            <Text style={styles.rewardLabel}>Tasks Done</Text>
          </View>
          <View style={styles.rewardCard}>
            <Circle size={24} color={Colors.light.primary} />
            <Text style={styles.rewardPoints}>{availableTasks.length}</Text>
            <Text style={styles.rewardLabel}>Available</Text>
          </View>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={refreshTasks}
            disabled={isLoadingTasks}
          >
            <RefreshCw 
              size={20} 
              color={Colors.light.primary} 
              style={[styles.refreshIcon, isLoadingTasks && styles.refreshIconLoading]} 
            />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Available Tasks</Text>
            {isLoadingTasks && (
              <Text style={styles.loadingText}>Syncing...</Text>
            )}
          </View>
          
          {availableTasks.map((task) => {
            const IconComponent = getTypeIcon(task.type);
            return (
              <View key={task.id} style={styles.taskCard}>
                <View style={styles.taskHeader}>
                  <View style={styles.taskTitleContainer}>
                    <IconComponent size={20} color={Colors.light.primary} />
                    <Text style={styles.taskTitle}>{task.title}</Text>
                  </View>
                  <View style={styles.taskReward}>
                    <Text style={styles.rewardText}>{task.reward} pts</Text>
                  </View>
                </View>

                <Text style={styles.taskDescription}>{task.description}</Text>

                <View style={styles.taskDetails}>
                  <View style={styles.detailRow}>
                    <MapPin size={14} color={Colors.light.textLight} />
                    <Text style={styles.detailText}>{task.location}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.distanceText}>{task.distance}km</Text>
                    <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(task.difficulty) }]}>
                      <Text style={styles.difficultyText}>{task.difficulty}</Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity 
                  style={[styles.startButton, completingTaskId === task.id && styles.startButtonLoading]}
                  onPress={() => handleCompleteTask(task.id, task.title)}
                  disabled={completingTaskId === task.id}
                >
                  {completingTaskId === task.id ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.startButtonText}>Start Task</Text>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {completedTasks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Completed Tasks</Text>
            
            {completedTasks.map((task) => {
              const IconComponent = getTypeIcon(task.type);
              return (
                <View key={task.id} style={[styles.taskCard, styles.completedTaskCard]}>
                  <View style={styles.taskHeader}>
                    <View style={styles.taskTitleContainer}>
                      <IconComponent size={20} color={Colors.light.success} />
                      <Text style={[styles.taskTitle, styles.completedTaskTitle]}>{task.title}</Text>
                    </View>
                    <CheckCircle size={20} color={Colors.light.success} />
                  </View>

                  <Text style={[styles.taskDescription, styles.completedTaskDescription]}>
                    {task.description}
                  </Text>

                  <View style={styles.completedReward}>
                    <Text style={styles.completedRewardText}>+{task.reward} points earned!</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Task Categories</Text>
          
          <View style={styles.categoryGrid}>
            <TouchableOpacity style={styles.categoryCard}>
              <MapPin size={24} color={Colors.light.primary} />
              <Text style={styles.categoryTitle}>Exploration</Text>
              <Text style={styles.categoryDescription}>Discover hidden campus gems</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.categoryCard}>
              <Zap size={24} color={Colors.light.accent} />
              <Text style={styles.categoryTitle}>Challenges</Text>
              <Text style={styles.categoryDescription}>Test your running skills</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.categoryCard}>
              <Trophy size={24} color={Colors.light.secondary} />
              <Text style={styles.categoryTitle}>Social</Text>
              <Text style={styles.categoryDescription}>Connect with other runners</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
  rewardsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  rewardCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  rewardPoints: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginTop: 8,
  },
  rewardLabel: {
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
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 16,
  },
  taskCard: {
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
  completedTaskCard: {
    opacity: 0.8,
    borderWidth: 1,
    borderColor: Colors.light.success,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginLeft: 8,
  },
  completedTaskTitle: {
    color: Colors.light.success,
  },
  taskReward: {
    backgroundColor: Colors.light.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rewardText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  taskDescription: {
    fontSize: 14,
    color: Colors.light.textLight,
    marginBottom: 12,
    lineHeight: 20,
  },
  completedTaskDescription: {
    color: Colors.light.textLight,
  },
  taskDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: Colors.light.text,
    marginLeft: 8,
    flex: 1,
  },
  distanceText: {
    fontSize: 14,
    color: Colors.light.textLight,
    fontWeight: '600',
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
  startButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  startButtonLoading: {
    backgroundColor: Colors.light.textLight,
  },
  startButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  completedReward: {
    backgroundColor: Colors.light.success,
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  completedRewardText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    minWidth: 100,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginTop: 8,
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 12,
    color: Colors.light.textLight,
    textAlign: 'center',
  },
});