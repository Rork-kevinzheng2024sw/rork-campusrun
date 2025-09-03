import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, Users, Clock, Play, Map as MapIcon, Target, X } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useRunStore } from '@/hooks/useRunStore';
import { TeamRunGame } from '@/types/run';
import { GameMapScreen } from './GameMapScreen';
import { CreateGameScreen } from './CreateGameScreen';

interface TeamRunGameScreenProps {
  onClose: () => void;
}

export function TeamRunGameScreen({ onClose }: TeamRunGameScreenProps) {
  const { 
    teamRunGames, 
    isLoadingTeamRunGames,
    joinTeamRunGame,
    startTeamRunGame,
    refreshTeamRunGames
  } = useRunStore();
  
  const [showCreateGame, setShowCreateGame] = useState(false);
  const [showGameMap, setShowGameMap] = useState(false);
  const [selectedGame, setSelectedGame] = useState<TeamRunGame | null>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinGameData, setJoinGameData] = useState<{gameId: string, gameTitle: string} | null>(null);
  const [participantName, setParticipantName] = useState('');

  const handleJoinGame = (gameId: string, gameTitle: string) => {
    setJoinGameData({ gameId, gameTitle });
    setParticipantName('');
    setShowJoinModal(true);
  };

  const confirmJoinGame = async () => {
    if (participantName.trim() && joinGameData) {
      try {
        await joinTeamRunGame(joinGameData.gameId, participantName.trim());
        setShowJoinModal(false);
        setJoinGameData(null);
        setParticipantName('');
        Alert.alert('Success!', 'You\'ve joined the team run game!');
      } catch {
        Alert.alert('Error', 'Failed to join team run game. Please try again.');
      }
    }
  };

  const cancelJoinGame = () => {
    setShowJoinModal(false);
    setJoinGameData(null);
    setParticipantName('');
  };

  const handleStartGame = async (gameId: string, gameTitle: string) => {
    Alert.alert(
      'Start Game',
      `Are you sure you want to start "${gameTitle}"? All participants will be notified.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Game',
          onPress: async () => {
            try {
              await startTeamRunGame(gameId);
              Alert.alert('Game Started!', 'All participants can now begin their routes.');
            } catch {
              Alert.alert('Error', 'Failed to start game. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handlePlayGame = (game: TeamRunGame) => {
    setSelectedGame(game);
    setShowGameMap(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return Colors.light.accent;
      case 'active': return Colors.light.success;
      case 'completed': return Colors.light.textLight;
      default: return Colors.light.textLight;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Waiting to Start';
      case 'active': return 'In Progress';
      case 'completed': return 'Completed';
      default: return status;
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

  const getLeaderboard = (game: TeamRunGame) => {
    return [...game.participants]
      .filter(p => p.completed)
      .sort((a, b) => b.area - a.area)
      .slice(0, 3);
  };

  if (showCreateGame) {
    return (
      <CreateGameScreen 
        onClose={() => setShowCreateGame(false)}
        onGameCreated={() => {
          setShowCreateGame(false);
          refreshTeamRunGames();
        }}
      />
    );
  }

  if (showGameMap && selectedGame) {
    return (
      <GameMapScreen 
        game={selectedGame}
        onClose={() => {
          setShowGameMap(false);
          setSelectedGame(null);
        }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Modal
        visible={showJoinModal}
        transparent
        animationType="fade"
        onRequestClose={cancelJoinGame}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Join Team Run Game</Text>
              <TouchableOpacity onPress={cancelJoinGame} style={styles.modalCloseButton}>
                <X size={20} color={Colors.light.textLight} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSubtitle}>
              Enter your name to join &ldquo;{joinGameData?.gameTitle}&rdquo;:
            </Text>
            
            <TextInput
              style={styles.modalInput}
              value={participantName}
              onChangeText={setParticipantName}
              placeholder="Your Name"
              placeholderTextColor={Colors.light.textLight}
              autoFocus={Platform.OS !== 'web'}
              returnKeyType="done"
              onSubmitEditing={confirmJoinGame}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={cancelJoinGame}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalJoinButton, !participantName.trim() && styles.modalJoinButtonDisabled]}
                onPress={confirmJoinGame}
                disabled={!participantName.trim()}
              >
                <Text style={styles.modalJoinText}>Join Game</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Team Run Games</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Area Challenge</Text>
          <Text style={styles.heroSubtitle}>
            Design your route, visit checkpoints, and create the largest closed-loop area to win!
          </Text>
        </View>

        <View style={styles.createSection}>
          <TouchableOpacity 
            style={styles.createButton}
            onPress={() => setShowCreateGame(true)}
          >
            <Plus size={20} color="white" style={styles.createButtonIcon} />
            <Text style={styles.createButtonText}>Create New Game</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Available Games</Text>
            {isLoadingTeamRunGames && (
              <Text style={styles.loadingText}>Loading...</Text>
            )}
          </View>

          {teamRunGames.map((game) => {
            const leaderboard = getLeaderboard(game);
            const userParticipant = game.participants.find(p => p.name === 'You');
            const isCreator = game.createdBy === 'You';
            
            return (
              <View key={game.id} style={styles.gameCard}>
                <View style={styles.gameHeader}>
                  <View style={styles.gameTitleContainer}>
                    <Text style={styles.gameTitle}>{game.title}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(game.status) }]}>
                      <Text style={styles.statusText}>{getStatusText(game.status)}</Text>
                    </View>
                  </View>
                  <Text style={styles.gameCreator}>by {game.createdBy}</Text>
                </View>

                {game.description && (
                  <Text style={styles.gameDescription}>{game.description}</Text>
                )}

                <View style={styles.gameDetails}>
                  <View style={styles.detailRow}>
                    <Clock size={16} color={Colors.light.textLight} />
                    <Text style={styles.detailText}>{formatDate(game.date)} at {game.time}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Target size={16} color={Colors.light.textLight} />
                    <Text style={styles.detailText}>{game.checkpoints.length} checkpoints</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Users size={16} color={Colors.light.textLight} />
                    <Text style={styles.detailText}>{game.participants.length} participants</Text>
                  </View>
                </View>

                {game.status === 'active' && leaderboard.length > 0 && (
                  <View style={styles.leaderboardSection}>
                    <Text style={styles.leaderboardTitle}>Current Leaders</Text>
                    {leaderboard.map((participant, index) => (
                      <View key={participant.id} style={styles.leaderboardItem}>
                        <Text style={styles.leaderboardRank}>#{index + 1}</Text>
                        <Text style={styles.leaderboardName}>{participant.name}</Text>
                        <Text style={styles.leaderboardArea}>{participant.area.toFixed(2)} km²</Text>
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.gameFooter}>
                  {game.status === 'pending' && !userParticipant && (
                    <TouchableOpacity 
                      style={styles.joinButton}
                      onPress={() => handleJoinGame(game.id, game.title)}
                    >
                      <Text style={styles.joinButtonText}>Join Game</Text>
                    </TouchableOpacity>
                  )}
                  
                  {game.status === 'pending' && isCreator && (
                    <TouchableOpacity 
                      style={styles.startButton}
                      onPress={() => handleStartGame(game.id, game.title)}
                    >
                      <Play size={16} color="white" style={styles.startButtonIcon} />
                      <Text style={styles.startButtonText}>Start Game</Text>
                    </TouchableOpacity>
                  )}
                  
                  {game.status === 'active' && userParticipant && (
                    <TouchableOpacity 
                      style={styles.playButton}
                      onPress={() => handlePlayGame(game)}
                    >
                      <MapIcon size={16} color="white" style={styles.playButtonIcon} />
                      <Text style={styles.playButtonText}>Play Game</Text>
                    </TouchableOpacity>
                  )}
                  
                  {game.status === 'pending' && userParticipant && (
                    <View style={styles.waitingContainer}>
                      <Text style={styles.waitingText}>Waiting for game to start...</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How to Play</Text>
          
          <View style={styles.instructionCard}>
            <View style={styles.instructionStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Join a Game</Text>
                <Text style={styles.stepDescription}>Enter your name and join an available game</Text>
              </View>
            </View>
            
            <View style={styles.instructionStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Design Your Route</Text>
                <Text style={styles.stepDescription}>Create a closed-loop path visiting all checkpoints</Text>
              </View>
            </View>
            
            <View style={styles.instructionStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Take Photos</Text>
                <Text style={styles.stepDescription}>Capture photos at each checkpoint for verification</Text>
              </View>
            </View>
            
            <View style={styles.instructionStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>4</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Maximize Area</Text>
                <Text style={styles.stepDescription}>The largest route area wins the challenge!</Text>
              </View>
            </View>
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
  heroSection: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: Colors.light.primary,
    margin: 20,
    borderRadius: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 22,
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
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.light.secondary,
    fontStyle: 'italic',
  },
  gameCard: {
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
  gameHeader: {
    marginBottom: 12,
  },
  gameTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  gameTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  gameCreator: {
    fontSize: 14,
    color: Colors.light.textLight,
  },
  gameDescription: {
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: 12,
    lineHeight: 20,
  },
  gameDetails: {
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
  leaderboardSection: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  leaderboardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 8,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  leaderboardRank: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.light.primary,
    width: 30,
  },
  leaderboardName: {
    fontSize: 14,
    color: Colors.light.text,
    flex: 1,
  },
  leaderboardArea: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.secondary,
  },
  gameFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  joinButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  joinButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  startButton: {
    backgroundColor: Colors.light.success,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  startButtonIcon: {
    marginRight: 6,
  },
  startButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  playButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  playButtonIcon: {
    marginRight: 6,
  },
  playButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  waitingContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  waitingText: {
    fontSize: 14,
    color: Colors.light.textLight,
    fontStyle: 'italic',
  },
  instructionCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  instructionStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: Colors.light.textLight,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: 16,
    lineHeight: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: Colors.light.text,
    backgroundColor: Colors.light.background,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalCancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  modalCancelText: {
    color: Colors.light.text,
    fontSize: 14,
    fontWeight: '600',
  },
  modalJoinButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  modalJoinButtonDisabled: {
    backgroundColor: Colors.light.textLight,
  },
  modalJoinText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});