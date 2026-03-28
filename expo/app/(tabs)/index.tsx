import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, Switch, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Activity, Timer, Zap, Music, Play, Pause, Square, RotateCcw, MapPin, Navigation } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { MapComponent, MarkerComponent, PolylineComponent } from '@/components/MapComponent';
import { GPSService } from '@/services/gpsService';
import Colors from '@/constants/colors';
import StatCard from '@/components/StatCard';
import { useRunStore } from '@/hooks/useRunStore';
import { router } from 'expo-router';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function RunScreen() {
  const { 
    runs, 
    isRunning, 
    currentRun, 
    realTimeStats,
    startRun, 
    stopRun, 
    addGaitTest 
  } = useRunStore();
  
  const [timer, setTimer] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [mockDataEnabled, setMockDataEnabled] = useState(false); // Default to real GPS
  const [demoMode, setDemoMode] = useState<'easy' | 'interval' | 'long' | null>(null);
  const [recommendedBPM, setRecommendedBPM] = useState(120);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<Array<{latitude: number, longitude: number}>>([]);
  const [showMap, setShowMap] = useState(false);
  const [mapType, setMapType] = useState<'standard' | 'satellite' | 'hybrid' | 'terrain'>('standard');
  const [mapZoom, setMapZoom] = useState(100);
  const [isStreetViewActive, setIsStreetViewActive] = useState(false);
  
  // Use real-time stats from GPS or mock data
  const distance = mockDataEnabled ? 0 : realTimeStats.distance;
  const pace = mockDataEnabled ? 0 : realTimeStats.pace;
  const cadence = mockDataEnabled ? 0 : realTimeStats.cadence;

  // Get location permissions and start tracking
  useEffect(() => {
    (async () => {
      if (Platform.OS === 'web') {
        // Use web geolocation API
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const location = {
                coords: {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                  accuracy: position.coords.accuracy,
                  altitude: position.coords.altitude,
                  speed: position.coords.speed,
                },
                timestamp: Date.now(),
              };
              setCurrentLocation(location as Location.LocationObject);
            },
            (error) => {
              console.error('Web geolocation error:', error);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
          );
        }
      } else {
        // Use expo-location for mobile
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            const location = await Location.getCurrentPositionAsync({});
            setCurrentLocation(location);
          }
        } catch (error) {
          console.error('Mobile location permission error:', error);
        }
      }
    })();
  }, []);

  // Track location during run
  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;
    let webWatchId: number | null = null;
    
    if (isRunning && !mockDataEnabled && !isPaused) {
      if (Platform.OS === 'web') {
        // Use web geolocation API
        if ('geolocation' in navigator) {
          webWatchId = navigator.geolocation.watchPosition(
            (position) => {
              const location = {
                coords: {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                  accuracy: position.coords.accuracy,
                  altitude: position.coords.altitude,
                  speed: position.coords.speed,
                },
                timestamp: Date.now(),
              };
              setCurrentLocation(location as Location.LocationObject);
              setRouteCoordinates(prev => [...prev, {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
              }]);
            },
            (error) => {
              console.error('Web geolocation error:', error);
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 1000
            }
          );
        }
      } else {
        // Use expo-location for mobile
        (async () => {
          try {
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
                  longitude: location.coords.longitude
                }]);
              }
            );
          } catch (error) {
            console.error('Mobile location tracking error:', error);
          }
        })();
      }
    }
    
    return () => {
      if (Platform.OS === 'web') {
        if (webWatchId !== null) {
          navigator.geolocation.clearWatch(webWatchId);
        }
      } else {
        if (locationSubscription) {
          locationSubscription.remove();
        }
      }
    };
  }, [isRunning, mockDataEnabled, isPaused]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRunning && currentRun && !isPaused) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - currentRun.startTime) / 1000);
        setTimer(elapsed);
        
        if (mockDataEnabled) {
          // Mock data simulation for demo mode
          const baseSpeed = demoMode === 'easy' ? 0.8 : demoMode === 'interval' ? 1.2 : demoMode === 'long' ? 0.6 : 1.0;
          const mockDistance = (elapsed / 3600) * baseSpeed * 60; // km
          const mockPace = elapsed > 0 ? (elapsed / 60) / mockDistance : 0; // min/km
          const mockCadence = demoMode === 'interval' ? 180 + Math.sin(elapsed / 30) * 20 : 160 + Math.sin(elapsed / 10) * 10;
          
          setRecommendedBPM(Math.floor(Math.max(140, mockCadence) * 0.7)); // BPM based on cadence
        } else {
          // Use real GPS data
          setRecommendedBPM(Math.floor(cadence * 0.7)); // BPM based on real cadence
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, currentRun, isPaused, mockDataEnabled, demoMode, cadence]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRunToggle = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    if (isRunning) {
      if (isPaused) {
        // Resume
        setIsPaused(false);
      } else {
        // Pause
        setIsPaused(true);
      }
    } else {
      // Start new run
      const success = await startRun();
      if (success) {
        setTimer(0);
        setIsPaused(false);
      } else {
        Alert.alert(
          'GPS Permission Required',
          'Please enable location permissions to track your run with GPS.',
          [
            { text: 'Use Mock Data', onPress: () => setMockDataEnabled(true) },
            { text: 'Try Again', onPress: () => handleRunToggle() }
          ]
        );
      }
    }
  };

  const handleEndRun = async () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    await stopRun();
    setTimer(0);
    setIsPaused(false);
    setRouteCoordinates([]);
    
    // Navigate to recap
    router.push('/recap');
  };

  const centerMapOnUser = () => {
    if (currentLocation && showMap) {
      // Reset zoom and center on user location
      setMapZoom(100);
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      console.log('Map centered on user location');
    }
  };

  const simulateScenario = (scenario: 'easy' | 'interval' | 'long') => {
    setDemoMode(scenario);
    setMockDataEnabled(true);
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    Alert.alert(
      'Demo Mode',
      `Starting ${scenario} run simulation`,
      [{ text: 'OK' }]
    );
  };

  const simulateEmergency = (type: 'fall' | 'stop') => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    
    Alert.alert(
      'Emergency Simulation',
      type === 'fall' ? 'Fall detected! Are you okay?' : 'Rapid stop detected!',
      [
        { text: 'I\'m fine', style: 'cancel' },
        { text: 'Need help', style: 'destructive' }
      ]
    );
  };

  const startGaitTest = () => {
    Alert.alert(
      'Gait Self-Test',
      'Run in place for 60 seconds while we analyze your form.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Start Test', 
          onPress: () => {
            // Simulate gait test
            setTimeout(() => {
              const score = Math.floor(Math.random() * 20) + 75;
              const feedback = score > 85 ? 'Excellent form!' : score > 75 ? 'Good form with room for improvement' : 'Focus on your technique';
              const improvements = ['Maintain consistent cadence', 'Keep shoulders relaxed'];
              
              addGaitTest({
                date: new Date().toISOString().split('T')[0],
                score,
                feedback,
                improvements
              });
              
              Alert.alert('Test Complete!', `Your gait score: ${score}/100\n${feedback}`);
            }, 3000);
          }
        }
      ]
    );
  };

  const sampleTracks = [
    { name: 'Campus Vibes', artist: 'Study Beats', bpm: recommendedBPM },
    { name: 'Morning Jog', artist: 'Fitness Mix', bpm: recommendedBPM + 5 },
    { name: 'Energy Boost', artist: 'Workout Hits', bpm: recommendedBPM - 5 }
  ];

  const progressPercentage = timer > 0 ? Math.min((timer / (30 * 60)) * 100, 100) : 0; // 30 min max

  return (
    <SafeAreaView style={styles.container}>
      {/* App Title Header */}
      <View style={styles.appHeader}>
        <Text style={styles.appTitle}>CampusRun</Text>
        <Text style={styles.appSubtitle}>Your campus running companion</Text>
      </View>
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* GPS/Demo Mode Toggle */}
        <View style={styles.demoControls}>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>{mockDataEnabled ? 'Demo Mode' : 'Real GPS'}</Text>
            <Switch
              value={mockDataEnabled}
              onValueChange={setMockDataEnabled}
              trackColor={{ false: Colors.light.primary, true: Colors.light.accent }}
              thumbColor={Colors.light.background}
            />
          </View>
          
          {mockDataEnabled && (
            <View style={styles.demoButtons}>
              <TouchableOpacity 
                style={[styles.demoButton, demoMode === 'easy' && styles.demoButtonActive]} 
                onPress={() => simulateScenario('easy')}
              >
                <Text style={[styles.demoButtonText, demoMode === 'easy' && styles.demoButtonTextActive]}>Easy Run</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.demoButton, demoMode === 'interval' && styles.demoButtonActive]} 
                onPress={() => simulateScenario('interval')}
              >
                <Text style={[styles.demoButtonText, demoMode === 'interval' && styles.demoButtonTextActive]}>Intervals</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.demoButton, demoMode === 'long' && styles.demoButtonActive]} 
                onPress={() => simulateScenario('long')}
              >
                <Text style={[styles.demoButtonText, demoMode === 'long' && styles.demoButtonTextActive]}>Long Run</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Map View Toggle */}
        {(isRunning || currentLocation) && (
          <View style={styles.mapToggleContainer}>
            <TouchableOpacity 
              style={[styles.mapToggleButton, showMap && styles.mapToggleButtonActive]} 
              onPress={() => setShowMap(!showMap)}
            >
              <MapPin size={20} color={showMap ? 'white' : Colors.light.primary} />
              <Text style={[styles.mapToggleText, showMap && styles.mapToggleTextActive]}>
                {showMap ? 'Hide Map' : 'Show Map'}
              </Text>
            </TouchableOpacity>
            {showMap && currentLocation && (
              <TouchableOpacity style={styles.centerButton} onPress={centerMapOnUser}>
                <Navigation size={20} color={Colors.light.primary} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Enhanced Google Map View with Controls */}
        {showMap && currentLocation && (
          <View style={styles.mapContainer}>
            <MapComponent
              style={styles.map}
              region={{
                latitude: currentLocation.coords.latitude,
                longitude: currentLocation.coords.longitude,
                latitudeDelta: 0.008 / (mapZoom / 100),
                longitudeDelta: 0.008 / (mapZoom / 100),
              }}
              showsUserLocation={true}
              followsUserLocation={isRunning && !isPaused}
              showsMyLocationButton={false}
              showsCompass={true}
              mapType={mapType}
              scrollEnabled={true}
              zoomEnabled={true}
              rotateEnabled={false}
              pitchEnabled={false}
              onMapTypeChange={(newType) => {
                setMapType(newType as 'standard' | 'satellite' | 'hybrid' | 'terrain');
                console.log('Map type changed to:', newType);
              }}
              onZoomIn={() => {
                const newZoom = Math.min(mapZoom * 1.5, 500);
                setMapZoom(newZoom);
                console.log('Zoomed in to:', newZoom + '%');
              }}
              onZoomOut={() => {
                const newZoom = Math.max(mapZoom / 1.5, 10);
                setMapZoom(newZoom);
                console.log('Zoomed out to:', newZoom + '%');
              }}
              onStreetView={() => {
                setIsStreetViewActive(!isStreetViewActive);
                console.log('Street View toggled:', !isStreetViewActive);
              }}
            >
              {/* Start marker */}
              {routeCoordinates.length > 0 && (
                <MarkerComponent
                  coordinate={routeCoordinates[0]}
                  title="Start"
                  pinColor={Colors.light.success}
                  identifier="start"
                />
              )}
              
              {/* Current location marker (only when running) */}
              {isRunning && (
                <MarkerComponent
                  coordinate={{
                    latitude: currentLocation.coords.latitude,
                    longitude: currentLocation.coords.longitude,
                  }}
                  title="Current Position"
                  pinColor={Colors.light.primary}
                  identifier="current"
                />
              )}
              
              {/* Route polyline with enhanced styling */}
              {routeCoordinates.length > 1 && (
                <PolylineComponent
                  coordinates={routeCoordinates}
                  strokeColor={Colors.light.primary}
                  strokeWidth={6}
                  lineCap="round"
                  lineJoin="round"
                />
              )}
            </MapComponent>
            
            {/* Enhanced map overlay stats with map info */}
            {isRunning && (
              <View style={styles.mapOverlay}>
                <View style={styles.mapStat}>
                  <Text style={styles.mapStatValue}>{distance.toFixed(2)}</Text>
                  <Text style={styles.mapStatLabel}>km</Text>
                </View>
                <View style={styles.mapStat}>
                  <Text style={styles.mapStatValue}>{pace > 0 ? pace.toFixed(1) : '--'}</Text>
                  <Text style={styles.mapStatLabel}>min/km</Text>
                </View>
                <View style={styles.mapStat}>
                  <Text style={styles.mapStatValue}>{formatTime(timer)}</Text>
                  <Text style={styles.mapStatLabel}>time</Text>
                </View>
                <View style={styles.mapStat}>
                  <Text style={styles.mapStatValue}>{Math.floor(cadence)}</Text>
                  <Text style={styles.mapStatLabel}>spm</Text>
                </View>
              </View>
            )}
            
            {/* Map Status Indicator */}
            <View style={styles.mapStatusOverlay}>
              <Text style={styles.mapStatusText}>
                {mapType.charAt(0).toUpperCase() + mapType.slice(1)} • {mapZoom.toFixed(0)}%
                {isStreetViewActive ? ' • Street View' : ''}
              </Text>
            </View>
            
            {/* Additional Map Controls */}
            <View style={styles.mapControls}>
              <TouchableOpacity style={styles.mapControlButton} onPress={centerMapOnUser}>
                <Navigation size={20} color={Colors.light.primary} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Main Timer Display */}
        <View style={styles.timerContainer}>
          <View style={[styles.progressRing, { borderColor: isRunning ? Colors.light.primary : Colors.light.textLight }]}>
            <View style={[styles.progressFill, { 
              borderColor: Colors.light.primary,
              transform: [{ rotate: `${(progressPercentage * 3.6)}deg` }],
              opacity: isRunning ? 1 : 0
            }]} />
            <View style={styles.timerInner}>
              <Text style={styles.mainTimer}>{formatTime(timer)}</Text>
              {isRunning && isPaused && (
                <Text style={styles.pausedLabel}>PAUSED</Text>
              )}
            </View>
          </View>
        </View>

        {/* Current Run Stats */}
        {isRunning && (
          <View style={styles.currentStats}>
            <View style={styles.statRow}>
              <View style={styles.currentStat}>
                <Text style={styles.currentStatValue}>{distance.toFixed(2)}</Text>
                <Text style={styles.currentStatLabel}>km</Text>
              </View>
              <View style={styles.currentStat}>
                <Text style={styles.currentStatValue}>{pace > 0 ? pace.toFixed(1) : '--'}</Text>
                <Text style={styles.currentStatLabel}>min/km</Text>
              </View>
            </View>
            
            {(cadence > 0 || mockDataEnabled) && (
              <View style={styles.cadenceContainer}>
                <Text style={styles.cadenceValue}>{Math.floor(cadence)}</Text>
                <Text style={styles.cadenceLabel}>steps/min</Text>
                <Text style={styles.gpsStatus}>
                  {mockDataEnabled ? '📍 Demo Mode' : '🛰️ GPS Active'}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Music Sync Widget */}
        {isRunning && (
          <View style={styles.musicWidget}>
            <View style={styles.musicHeader}>
              <Music size={20} color={Colors.light.secondary} />
              <Text style={styles.musicTitle}>Music Sync</Text>
              <Text style={styles.bpmText}>{recommendedBPM} BPM</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tracksList}>
              {sampleTracks.map((track, index) => (
                <TouchableOpacity key={index} style={styles.trackCard}>
                  <Text style={styles.trackName}>{track.name}</Text>
                  <Text style={styles.trackArtist}>{track.artist}</Text>
                  <Text style={styles.trackBpm}>{track.bpm} BPM</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Control Buttons */}
        <View style={styles.controlsContainer}>
          {isRunning ? (
            <View style={styles.runningControls}>
              <TouchableOpacity 
                style={[styles.controlButton, styles.pauseButton]} 
                onPress={handleRunToggle}
              >
                {isPaused ? (
                  <Play size={24} color="white" fill="white" />
                ) : (
                  <Pause size={24} color="white" />
                )}
                <Text style={styles.controlButtonText}>
                  {isPaused ? 'Resume' : 'Pause'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.controlButton, styles.endButton]} 
                onPress={handleEndRun}
              >
                <Square size={24} color="white" fill="white" />
                <Text style={styles.controlButtonText}>End</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.startButton} 
              onPress={handleRunToggle}
            >
              <Play size={32} color="white" fill="white" />
              <Text style={styles.startButtonText}>Start Run</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Emergency Simulation (Demo Mode) */}
        {mockDataEnabled && isRunning && (
          <View style={styles.emergencyControls}>
            <Text style={styles.emergencyTitle}>Emergency Simulation</Text>
            <View style={styles.emergencyButtons}>
              <TouchableOpacity 
                style={styles.emergencyButton} 
                onPress={() => simulateEmergency('fall')}
              >
                <Text style={styles.emergencyButtonText}>Simulate Fall</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.emergencyButton} 
                onPress={() => simulateEmergency('stop')}
              >
                <Text style={styles.emergencyButtonText}>Rapid Stop</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {!isRunning && (
          <View style={styles.quickActions}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            
            <TouchableOpacity style={styles.actionCard} onPress={startGaitTest}>
              <View style={styles.actionIcon}>
                <Activity size={24} color={Colors.light.primary} />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Gait Self-Test</Text>
                <Text style={styles.actionSubtitle}>1-minute form analysis</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <View style={styles.actionIcon}>
                <Timer size={24} color={Colors.light.secondary} />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Quick 15min Run</Text>
                <Text style={styles.actionSubtitle}>Perfect for busy days</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <View style={styles.actionIcon}>
                <Zap size={24} color={Colors.light.accent} />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Sprint Intervals</Text>
                <Text style={styles.actionSubtitle}>High intensity workout</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
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
  mapToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  mapToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.light.primary,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  mapToggleButtonActive: {
    backgroundColor: Colors.light.primary,
  },
  mapToggleText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  mapToggleTextActive: {
    color: 'white',
  },
  centerButton: {
    backgroundColor: Colors.light.card,
    padding: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.light.primary,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  mapContainer: {
    height: 300,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
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
  mapOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  mapStat: {
    alignItems: 'center',
    flex: 1,
  },
  mapStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  mapStatLabel: {
    fontSize: 10,
    color: Colors.light.textLight,
    marginTop: 2,
    textAlign: 'center',
  },
  mapControls: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
  mapStatusOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  mapStatusText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  mapControlButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 25,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 8,
  },
  demoControls: {
    padding: 20,
    backgroundColor: Colors.light.card,
    margin: 16,
    borderRadius: 16,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  demoButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  demoButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: Colors.light.background,
    alignItems: 'center',
  },
  demoButtonActive: {
    backgroundColor: Colors.light.primary,
  },
  demoButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.text,
  },
  demoButtonTextActive: {
    color: 'white',
  },
  timerContainer: {
    alignItems: 'center',
    marginVertical: 40,
  },
  progressRing: {
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  progressFill: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 8,
    borderColor: 'transparent',
    borderTopColor: Colors.light.primary,
    transform: [{ rotate: '-90deg' }],
  },
  timerInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainTimer: {
    fontSize: 48,
    fontWeight: 'bold',
    color: Colors.light.text,
    textAlign: 'center',
  },
  pausedLabel: {
    fontSize: 14,
    color: Colors.light.warning,
    fontWeight: '600',
    marginTop: 4,
  },
  currentStats: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  currentStat: {
    alignItems: 'center',
  },
  currentStatValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  currentStatLabel: {
    fontSize: 14,
    color: Colors.light.textLight,
    marginTop: 4,
  },
  cadenceContainer: {
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cadenceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.secondary,
  },
  cadenceLabel: {
    fontSize: 12,
    color: Colors.light.textLight,
    marginTop: 4,
  },
  gpsStatus: {
    fontSize: 10,
    color: Colors.light.textLight,
    marginTop: 8,
    fontWeight: '500',
  },
  musicWidget: {
    margin: 20,
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  musicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  musicTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginLeft: 8,
    flex: 1,
  },
  bpmText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.secondary,
  },
  tracksList: {
    marginTop: 8,
  },
  trackCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    minWidth: 120,
  },
  trackName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 2,
  },
  trackArtist: {
    fontSize: 12,
    color: Colors.light.textLight,
    marginBottom: 4,
  },
  trackBpm: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.secondary,
  },
  controlsContainer: {
    alignItems: 'center',
    marginVertical: 32,
  },
  startButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 80,
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
  },
  runningControls: {
    flexDirection: 'row',
    gap: 20,
  },
  controlButton: {
    borderRadius: 60,
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  pauseButton: {
    backgroundColor: Colors.light.accent,
  },
  endButton: {
    backgroundColor: Colors.light.error,
  },
  controlButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },
  emergencyControls: {
    margin: 20,
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  emergencyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  emergencyButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  emergencyButton: {
    flex: 1,
    backgroundColor: Colors.light.warning,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  emergencyButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  quickActions: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 16,
  },
  actionCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
    color: Colors.light.textLight,
  },

});