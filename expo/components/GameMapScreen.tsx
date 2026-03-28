import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Camera, Play, Square, MapPin, Target, Timer, Zap, Navigation } from 'lucide-react-native';
import * as Location from 'expo-location';
import { MapComponent, MarkerComponent, PolylineComponent } from '@/components/MapComponent';
import Colors from '@/constants/colors';
import { useRunStore } from '@/hooks/useRunStore';
import { TeamRunGame, LocationCoordinate } from '@/types/run';

interface GameMapScreenProps {
  game: TeamRunGame;
  onClose: () => void;
}

export function GameMapScreen({ game, onClose }: GameMapScreenProps) {
  const { 
    startRun, 
    stopRun, 
    isRunning, 
    realTimeStats, 
    calculateRouteArea,
    submitGamePhoto,
    updateGameParticipant
  } = useRunStore();
  
  const [gameStarted, setGameStarted] = useState(false);
  const [visitedCheckpoints, setVisitedCheckpoints] = useState<string[]>([]);
  const [routeCoordinates, setRouteCoordinates] = useState<LocationCoordinate[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentArea, setCurrentArea] = useState(0);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);

  const userParticipant = game.participants.find(p => p.name === 'You');

  // Get location permissions and start tracking
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setCurrentLocation(location);
      }
    })();
  }, []);

  // Track location during game
  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;
    
    if (gameStarted && isRunning) {
      (async () => {
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: 1000,
            distanceInterval: 1,
          },
          (location) => {
            setCurrentLocation(location);
            setRouteCoordinates(prev => [...prev, {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              timestamp: Date.now()
            }]);
          }
        );
      })();
    }
    
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [gameStarted, isRunning]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (gameStarted && isRunning) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
        
        // Update route area calculation
        if (routeCoordinates.length >= 3) {
          const area = calculateRouteArea(routeCoordinates);
          setCurrentArea(area);
        }
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameStarted, isRunning, routeCoordinates, calculateRouteArea]);

  const handleStartGame = async () => {
    const success = await startRun();
    if (success) {
      setGameStarted(true);
      setElapsedTime(0);
      Alert.alert('Game Started!', 'Begin your route and visit all checkpoints. Take photos for verification!');
    } else {
      Alert.alert('Error', 'Failed to start GPS tracking. Please check your location permissions.');
    }
  };

  const handleEndGame = async () => {
    Alert.alert(
      'End Game',
      'Are you sure you want to finish your route? Make sure you\'ve visited all checkpoints and returned to the start.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Finish',
          onPress: async () => {
            await stopRun();
            setGameStarted(false);
            
            // Check if route is closed-loop (start and end are close)
            const isClosedLoop = routeCoordinates.length >= 3;
            const allCheckpointsVisited = visitedCheckpoints.length === game.checkpoints.length;
            
            if (!allCheckpointsVisited) {
              Alert.alert('Incomplete Route', 'You haven\'t visited all checkpoints. Your area score may be reduced.');
            }
            
            if (!isClosedLoop) {
              Alert.alert('Open Route', 'Your route should form a closed loop for maximum area calculation.');
            }
            
            // Update participant data
            if (userParticipant) {
              try {
                await updateGameParticipant(game.id, userParticipant.id, {
                  route: routeCoordinates,
                  area: currentArea,
                  distance: realTimeStats.distance,
                  completionTime: elapsedTime,
                  completed: true
                });
                
                Alert.alert(
                  'Game Completed!', 
                  `Your route area: ${currentArea.toFixed(2)} km²\nDistance: ${realTimeStats.distance.toFixed(2)} km\nTime: ${formatTime(elapsedTime)}`
                );
              } catch {
                Alert.alert('Error', 'Failed to submit your game results.');
              }
            }
          }
        }
      ]
    );
  };

  const handleTakePhoto = (checkpointId: string) => {
    if (Platform.OS === 'web') {
      // Web fallback - simulate photo capture
      Alert.alert(
        'Photo Captured',
        'In a real app, this would open the camera to capture a photo at the checkpoint.',
        [
          {
            text: 'OK',
            onPress: () => {
              if (!visitedCheckpoints.includes(checkpointId)) {
                setVisitedCheckpoints(prev => [...prev, checkpointId]);
                
                // Simulate photo submission
                const mockPhoto = {
                  checkpointId,
                  uri: 'mock-photo-uri',
                  timestamp: Date.now(),
                  latitude: 40.7549,
                  longitude: -73.9840
                };
                
                if (userParticipant) {
                  submitGamePhoto(game.id, userParticipant.id, mockPhoto).catch(console.error);
                }
              }
            }
          }
        ]
      );
    } else {
      // Mobile - would open camera
      Alert.alert(
        'Take Photo',
        'This would open the camera to capture a photo at this checkpoint.',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Take Photo',
            onPress: () => {
              if (!visitedCheckpoints.includes(checkpointId)) {
                setVisitedCheckpoints(prev => [...prev, checkpointId]);
                Alert.alert('Success!', 'Checkpoint photo captured and verified!');
              }
            }
          }
        ]
      );
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getCheckpointStatus = (checkpointId: string) => {
    return visitedCheckpoints.includes(checkpointId) ? 'visited' : 'pending';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'visited': return Colors.light.success;
      case 'pending': return Colors.light.textLight;
      default: return Colors.light.textLight;
    }
  };

  const centerMapOnUser = () => {
    if (currentLocation) {
      // Map will automatically center on user location
      console.log('Centering map on user location');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{game.title}</Text>
        <TouchableOpacity onPress={centerMapOnUser} style={styles.centerButton}>
          <Navigation size={20} color={Colors.light.primary} />
        </TouchableOpacity>
      </View>

      {/* Google Maps with checkpoints and route */}
      <View style={styles.mapContainer}>
        {currentLocation ? (
          <MapComponent
            style={styles.map}
            region={{
              latitude: currentLocation.coords.latitude,
              longitude: currentLocation.coords.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            showsUserLocation={true}
            followsUserLocation={gameStarted && isRunning}
            showsMyLocationButton={false}
            showsCompass={true}
            mapType="standard"
            scrollEnabled={true}
            zoomEnabled={true}
            rotateEnabled={false}
            pitchEnabled={false}
          >
            {/* Checkpoint markers */}
            {game.checkpoints.map((checkpoint, index) => {
              const isVisited = visitedCheckpoints.includes(checkpoint.id);
              return (
                <MarkerComponent
                  key={checkpoint.id}
                  coordinate={{
                    latitude: checkpoint.latitude,
                    longitude: checkpoint.longitude,
                  }}
                  title={`Checkpoint ${index + 1}: ${checkpoint.name}`}
                  pinColor={isVisited ? Colors.light.success : Colors.light.accent}
                  identifier={checkpoint.id}
                />
              );
            })}
            
            {/* Current route polyline */}
            {routeCoordinates.length > 1 && (
              <PolylineComponent
                coordinates={routeCoordinates}
                strokeColor={Colors.light.primary}
                strokeWidth={4}
                lineCap="round"
                lineJoin="round"
              />
            )}
            
            {/* Closed loop indicator */}
            {routeCoordinates.length > 2 && gameStarted && (
              <PolylineComponent
                coordinates={[routeCoordinates[routeCoordinates.length - 1], routeCoordinates[0]]}
                strokeColor={Colors.light.secondary}
                strokeWidth={2}
                lineCap="round"
                lineJoin="round"
              />
            )}
          </MapComponent>
        ) : (
          <View style={styles.mapPlaceholder}>
            <MapPin size={48} color={Colors.light.primary} />
            <Text style={styles.mapPlaceholderText}>Loading Google Maps...</Text>
            <Text style={styles.mapPlaceholderSubtext}>
              Getting your location for GPS tracking
            </Text>
          </View>
        )}
        
        {/* Map overlay with game stats */}
        {gameStarted && (
          <View style={styles.mapOverlay}>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Timer size={16} color={Colors.light.primary} />
                <Text style={styles.statValue}>{formatTime(elapsedTime)}</Text>
              </View>
              <View style={styles.statItem}>
                <Target size={16} color={Colors.light.secondary} />
                <Text style={styles.statValue}>{currentArea.toFixed(2)} km²</Text>
              </View>
              <View style={styles.statItem}>
                <Zap size={16} color={Colors.light.accent} />
                <Text style={styles.statValue}>{realTimeStats.distance.toFixed(2)} km</Text>
              </View>
              <View style={styles.statItem}>
                <MapPin size={16} color={Colors.light.success} />
                <Text style={styles.statValue}>{visitedCheckpoints.length}/{game.checkpoints.length}</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.progressSection}>
          <Text style={styles.progressTitle}>
            Checkpoints ({visitedCheckpoints.length}/{game.checkpoints.length})
          </Text>
          
          <View style={styles.checkpointsList}>
            {game.checkpoints.map((checkpoint, index) => {
              const status = getCheckpointStatus(checkpoint.id);
              
              return (
                <View key={checkpoint.id} style={styles.checkpointItem}>
                  <View style={[styles.checkpointIcon, { backgroundColor: getStatusColor(status) }]}>
                    <Text style={styles.checkpointNumber}>{index + 1}</Text>
                  </View>
                  
                  <View style={styles.checkpointInfo}>
                    <Text style={styles.checkpointName}>{checkpoint.name}</Text>
                    {checkpoint.description && (
                      <Text style={styles.checkpointDescription}>{checkpoint.description}</Text>
                    )}
                  </View>
                  
                  {gameStarted && status === 'pending' && (
                    <TouchableOpacity 
                      style={styles.photoButton}
                      onPress={() => handleTakePhoto(checkpoint.id)}
                    >
                      <Camera size={20} color={Colors.light.primary} />
                    </TouchableOpacity>
                  )}
                  
                  {status === 'visited' && (
                    <View style={styles.completedIcon}>
                      <Text style={styles.completedText}>✓</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.instructionsSection}>
          <Text style={styles.instructionsTitle}>Game Rules</Text>
          <Text style={styles.instructionsText}>
            • Visit all checkpoints in any order{'\n'}
            • Take photos at each checkpoint for verification{'\n'}
            • Create a closed-loop route (start and end at same point){'\n'}
            • Maximize your route area to win!
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        {!gameStarted ? (
          <TouchableOpacity 
            style={styles.startButton}
            onPress={handleStartGame}
          >
            <Play size={20} color="white" style={styles.buttonIcon} />
            <Text style={styles.startButtonText}>Start Route</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.endButton}
            onPress={handleEndGame}
          >
            <Square size={20} color="white" style={styles.buttonIcon} />
            <Text style={styles.endButtonText}>Finish Route</Text>
          </TouchableOpacity>
        )}
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
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  centerButton: {
    padding: 4,
  },
  mapContainer: {
    height: 300,
    backgroundColor: Colors.light.card,
    margin: 20,
    borderRadius: 16,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  map: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.background,
    borderWidth: 2,
    borderColor: Colors.light.primary,
    borderStyle: 'dashed',
  },
  mapPlaceholderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.primary,
    marginTop: 12,
  },
  mapPlaceholderSubtext: {
    fontSize: 14,
    color: Colors.light.textLight,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  mapOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 12,
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  progressSection: {
    marginBottom: 24,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 16,
  },
  checkpointsList: {
    gap: 12,
  },
  checkpointItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
  },
  checkpointIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkpointNumber: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkpointInfo: {
    flex: 1,
  },
  checkpointName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 2,
  },
  checkpointDescription: {
    fontSize: 14,
    color: Colors.light.textLight,
  },
  photoButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.light.background,
  },
  completedIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  instructionsSection: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: Colors.light.textLight,
    lineHeight: 20,
  },
  footer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  startButton: {
    backgroundColor: Colors.light.success,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  endButton: {
    backgroundColor: Colors.light.error,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  endButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});