import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, TrendingUp, Award, Clock, MapPin, Share2, Camera, Music, Navigation } from 'lucide-react-native';
import { MapComponent, MarkerComponent, PolylineComponent, WebMapFallback } from '@/components/MapComponent';
import Colors from '@/constants/colors';
import StatCard from '@/components/StatCard';
import { useRunStore } from '@/hooks/useRunStore';

const { width: screenWidth } = Dimensions.get('window');

export default function RecapScreen() {
  const { runs, gaitTests } = useRunStore();
  const [isCreatingStory, setIsCreatingStory] = useState(false);
  const [showFullMap, setShowFullMap] = useState(false);
  const [mapType, setMapType] = useState<'standard' | 'satellite' | 'hybrid' | 'terrain'>('standard');
  const [mapZoom, setMapZoom] = useState(100);
  const [isStreetViewActive, setIsStreetViewActive] = useState(false);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const totalDistance = runs.reduce((sum, run) => sum + run.distance, 0);
  const totalTime = runs.reduce((sum, run) => sum + run.duration, 0);
  const avgPace = runs.length > 0 ? runs.reduce((sum, run) => sum + run.pace, 0) / runs.length : 0;
  const totalCalories = runs.reduce((sum, run) => sum + run.calories, 0);

  const latestRun = runs[0];
  const latestGaitTest = gaitTests[0];

  const createStoryCard = () => {
    setIsCreatingStory(true);
    
    // Simulate story card creation
    setTimeout(() => {
      setIsCreatingStory(false);
      Alert.alert(
        'Story Card Created! 🎉',
        'Your 10-second animated story card is ready to share with friends!',
        [
          { text: 'Share Now', onPress: () => console.log('Sharing story card...') },
          { text: 'Save to Gallery', style: 'cancel' }
        ]
      );
    }, 2000);
  };

  const generatePaceData = () => {
    // Generate mock pace data for the latest run
    if (!latestRun) return [];
    
    const points = 20;
    const basePace = latestRun.pace;
    const data = [];
    
    for (let i = 0; i < points; i++) {
      const variation = (Math.sin(i * 0.5) * 0.5) + (Math.random() * 0.3 - 0.15);
      data.push({
        x: i,
        y: Math.max(3, basePace + variation)
      });
    }
    
    return data;
  };

  const paceData = generatePaceData();
  const maxPace = Math.max(...paceData.map(p => p.y));
  const minPace = Math.min(...paceData.map(p => p.y));

  // Generate mock route coordinates for the latest run
  const generateRouteCoordinates = () => {
    if (!latestRun) return [];
    
    // Mock campus route coordinates (simulated)
    const baseCoords = {
      latitude: 37.7749,
      longitude: -122.4194
    };
    
    const routePoints = [];
    const numPoints = Math.floor(latestRun.distance * 10); // 10 points per km
    
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      const radius = 0.005 * (latestRun.distance / 5); // Adjust radius based on distance
      
      routePoints.push({
        latitude: baseCoords.latitude + Math.cos(angle) * radius + (Math.random() - 0.5) * 0.001,
        longitude: baseCoords.longitude + Math.sin(angle) * radius + (Math.random() - 0.5) * 0.001
      });
    }
    
    return routePoints;
  };

  const routeCoordinates = generateRouteCoordinates();
  const mapCenter = routeCoordinates.length > 0 ? routeCoordinates[Math.floor(routeCoordinates.length / 2)] : null;

  return (
    <SafeAreaView style={styles.container}>
      {/* App Title Header */}
      <View style={styles.appHeader}>
        <Text style={styles.appTitle}>CampusRun</Text>
        <Text style={styles.appSubtitle}>Run recap & achievements</Text>
      </View>
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Run Recap</Text>
          <Text style={styles.subtitle}>Your latest performance</Text>
        </View>

        {/* Latest Run Summary */}
        {latestRun && (
          <View style={styles.latestRunSection}>
            {/* Interactive Map */}
            <View style={styles.mapContainer}>
              <TouchableOpacity 
                style={styles.mapToggleButton} 
                onPress={() => setShowFullMap(!showFullMap)}
              >
                <MapPin size={16} color={Colors.light.primary} />
                <Text style={styles.mapToggleText}>
                  {showFullMap ? 'Hide Full Map' : 'Show Full Map'}
                </Text>
                <Navigation size={16} color={Colors.light.primary} />
              </TouchableOpacity>
              
              {mapCenter && (
                <View style={[styles.mapView, showFullMap && styles.mapViewExpanded]}>
                  <MapComponent
                    style={styles.map}
                    region={{
                      latitude: mapCenter.latitude,
                      longitude: mapCenter.longitude,
                      latitudeDelta: (showFullMap ? 0.015 : 0.025) / (mapZoom / 100),
                      longitudeDelta: (showFullMap ? 0.015 : 0.025) / (mapZoom / 100),
                    }}
                    scrollEnabled={showFullMap}
                    zoomEnabled={showFullMap}
                    rotateEnabled={false}
                    pitchEnabled={false}
                    mapType={mapType}
                    showsUserLocation={false}
                    showsCompass={showFullMap}
                    onMapTypeChange={(newType) => {
                      setMapType(newType as 'standard' | 'satellite' | 'hybrid' | 'terrain');
                      console.log('Recap map type changed to:', newType);
                    }}
                    onZoomIn={() => {
                      const newZoom = Math.min(mapZoom * 1.5, 500);
                      setMapZoom(newZoom);
                      console.log('Recap map zoomed in to:', newZoom + '%');
                    }}
                    onZoomOut={() => {
                      const newZoom = Math.max(mapZoom / 1.5, 10);
                      setMapZoom(newZoom);
                      console.log('Recap map zoomed out to:', newZoom + '%');
                    }}
                    onStreetView={() => {
                      setIsStreetViewActive(!isStreetViewActive);
                      console.log('Recap Street View toggled:', !isStreetViewActive);
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
                    
                    {/* End marker */}
                    {routeCoordinates.length > 1 && (
                      <MarkerComponent
                        coordinate={routeCoordinates[routeCoordinates.length - 1]}
                        title="Finish"
                        pinColor={Colors.light.error}
                        identifier="finish"
                      />
                    )}
                    
                    {/* Route polyline with enhanced styling */}
                    {routeCoordinates.length > 1 && (
                      <PolylineComponent
                        coordinates={routeCoordinates}
                        strokeColor={Colors.light.primary}
                        strokeWidth={5}
                        lineCap="round"
                        lineJoin="round"
                      />
                    )}
                  </MapComponent>
                  
                  {/* Map overlay with run stats */}
                  {!showFullMap && (
                    <View style={styles.mapOverlayLabel}>
                      <Text style={styles.mapLabel}>🗺️ Google Maps Route</Text>
                      <Text style={styles.mapSubLabel}>
                        Tap to expand • {latestRun.distance.toFixed(1)} km • {mapType.charAt(0).toUpperCase() + mapType.slice(1)}
                      </Text>
                    </View>
                  )}
                  
                  {/* Full map controls and status */}
                  {showFullMap && (
                    <View style={styles.mapControls}>
                      <View style={styles.mapStatsOverlay}>
                        <Text style={styles.mapStatsText}>
                          📍 {latestRun.distance.toFixed(1)} km • ⏱️ {formatDuration(latestRun.duration)}
                        </Text>
                        <Text style={styles.mapTypeIndicator}>
                          {mapType.charAt(0).toUpperCase() + mapType.slice(1)} • {mapZoom.toFixed(0)}%
                          {isStreetViewActive ? ' • Street View' : ''}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Three Main Stats */}
            <View style={styles.mainStats}>
              <View style={styles.mainStatCard}>
                <Text style={styles.mainStatValue}>{latestRun.distance.toFixed(1)}</Text>
                <Text style={styles.mainStatLabel}>Distance (km)</Text>
              </View>
              <View style={styles.mainStatCard}>
                <Text style={styles.mainStatValue}>{formatDuration(latestRun.duration)}</Text>
                <Text style={styles.mainStatLabel}>Time</Text>
              </View>
              <View style={styles.mainStatCard}>
                <Text style={styles.mainStatValue}>{latestRun.pace.toFixed(1)}</Text>
                <Text style={styles.mainStatLabel}>Avg Pace (min/km)</Text>
              </View>
            </View>

            {/* Pace Line Chart */}
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Pace Analysis</Text>
              <View style={styles.chart}>
                <View style={styles.chartGrid}>
                  {[0, 1, 2, 3, 4].map(i => (
                    <View key={i} style={styles.gridLine} />
                  ))}
                </View>
                <View style={styles.paceLineContainer}>
                  {paceData.map((point, index) => {
                    const x = (point.x / (paceData.length - 1)) * (screenWidth - 80);
                    const y = ((maxPace - point.y) / (maxPace - minPace)) * 100;
                    
                    return (
                      <View
                        key={index}
                        style={[
                          styles.pacePoint,
                          {
                            left: x,
                            top: y,
                          }
                        ]}
                      />
                    );
                  })}
                </View>
                <View style={styles.chartLabels}>
                  <Text style={styles.chartLabel}>Start</Text>
                  <Text style={styles.chartLabel}>Finish</Text>
                </View>
              </View>
            </View>

            {/* Create Story Card Button */}
            <TouchableOpacity 
              style={styles.storyButton} 
              onPress={createStoryCard}
              disabled={isCreatingStory}
            >
              <View style={styles.storyButtonContent}>
                {isCreatingStory ? (
                  <>
                    <View style={styles.loadingSpinner} />
                    <Text style={styles.storyButtonText}>Creating Story...</Text>
                  </>
                ) : (
                  <>
                    <Camera size={24} color="white" />
                    <Text style={styles.storyButtonText}>Create Story Card</Text>
                    <Text style={styles.storyButtonSubtext}>10s animated summary</Text>
                  </>
                )}
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Overall Stats Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overall Stats</Text>
          <View style={styles.statsGrid}>
            <StatCard 
              title="Total Distance" 
              value={totalDistance.toFixed(1)} 
              unit="km"
              color={Colors.light.primary}
            />
            <StatCard 
              title="Total Time" 
              value={formatDuration(totalTime)} 
              color={Colors.light.secondary}
            />
            <StatCard 
              title="Avg Pace" 
              value={avgPace.toFixed(1)} 
              unit="min/km"
              color={Colors.light.accent}
            />
            <StatCard 
              title="Calories" 
              value={totalCalories.toString()} 
              unit="kcal"
              color={Colors.light.success}
            />
          </View>
        </View>

        {latestGaitTest && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Latest Gait Test</Text>
            <View style={styles.gaitCard}>
              <View style={styles.gaitHeader}>
                <View style={styles.gaitScore}>
                  <Text style={styles.gaitScoreText}>{latestGaitTest.score}</Text>
                  <Text style={styles.gaitScoreLabel}>/100</Text>
                </View>
                <Text style={styles.gaitDate}>{formatDate(latestGaitTest.date)}</Text>
              </View>
              <Text style={styles.gaitFeedback}>{latestGaitTest.feedback}</Text>
              <View style={styles.improvements}>
                {latestGaitTest.improvements.map((improvement, index) => (
                  <Text key={index} style={styles.improvementItem}>• {improvement}</Text>
                ))}
              </View>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Runs</Text>
          {runs.slice(0, 5).map((run) => (
            <View key={run.id} style={styles.runCard}>
              <View style={styles.runHeader}>
                <View style={styles.runType}>
                  <Calendar size={16} color={Colors.light.textLight} />
                  <Text style={styles.runDate}>{formatDate(run.date)}</Text>
                </View>
                <View style={styles.runBadge}>
                  <Text style={styles.runBadgeText}>{run.type}</Text>
                </View>
              </View>
              
              <View style={styles.runStats}>
                <View style={styles.runStat}>
                  <Text style={styles.runStatValue}>{run.distance.toFixed(1)}</Text>
                  <Text style={styles.runStatLabel}>km</Text>
                </View>
                <View style={styles.runStat}>
                  <Text style={styles.runStatValue}>{formatDuration(run.duration)}</Text>
                  <Text style={styles.runStatLabel}>time</Text>
                </View>
                <View style={styles.runStat}>
                  <Text style={styles.runStatValue}>{run.pace.toFixed(1)}</Text>
                  <Text style={styles.runStatLabel}>min/km</Text>
                </View>
                <View style={styles.runStat}>
                  <Text style={styles.runStatValue}>{run.calories}</Text>
                  <Text style={styles.runStatLabel}>kcal</Text>
                </View>
              </View>
              
              {run.route && (
                <Text style={styles.runRoute}>{run.route}</Text>
              )}
            </View>
          ))}
        </View>

        <View style={styles.achievements}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <View style={styles.achievementGrid}>
            <TouchableOpacity style={styles.achievementCard}>
              <Award size={24} color={Colors.light.accent} />
              <Text style={styles.achievementTitle}>First Run</Text>
              <Text style={styles.achievementDesc}>Completed your first campus run</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.achievementCard}>
              <TrendingUp size={24} color={Colors.light.secondary} />
              <Text style={styles.achievementTitle}>5K Club</Text>
              <Text style={styles.achievementDesc}>Ran 5 kilometers in one session</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.achievementCard}>
              <Clock size={24} color={Colors.light.primary} />
              <Text style={styles.achievementTitle}>Consistent</Text>
              <Text style={styles.achievementDesc}>3 runs this week</Text>
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
  },
  latestRunSection: {
    margin: 20,
    backgroundColor: Colors.light.card,
    borderRadius: 20,
    padding: 20,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  mapContainer: {
    marginBottom: 20,
  },
  mapToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.background,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  mapToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  mapView: {
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  mapViewExpanded: {
    height: 400,
  },
  map: {
    flex: 1,
  },
  mapOverlayLabel: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mapLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  mapSubLabel: {
    fontSize: 12,
    color: Colors.light.textLight,
    marginTop: 2,
  },
  mapControls: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
  },
  mapStatsOverlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mapStatsText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  mapTypeIndicator: {
    fontSize: 12,
    color: Colors.light.textLight,
    marginTop: 4,
    textAlign: 'center',
  },
  mainStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  mainStatCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
  },
  mainStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.primary,
    marginBottom: 4,
  },
  mainStatLabel: {
    fontSize: 12,
    color: Colors.light.textLight,
    textAlign: 'center',
  },
  chartContainer: {
    marginBottom: 24,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  chart: {
    height: 120,
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    padding: 16,
    position: 'relative',
  },
  chartGrid: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    bottom: 32,
  },
  gridLine: {
    height: 1,
    backgroundColor: Colors.light.textLight,
    opacity: 0.2,
    marginBottom: 20,
  },
  paceLineContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    height: 88,
  },
  pacePoint: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.secondary,
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    bottom: 8,
    left: 16,
    right: 16,
  },
  chartLabel: {
    fontSize: 12,
    color: Colors.light.textLight,
  },
  storyButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  storyButtonContent: {
    alignItems: 'center',
  },
  storyButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
  },
  storyButtonSubtext: {
    color: 'white',
    fontSize: 14,
    opacity: 0.9,
    marginTop: 4,
  },
  loadingSpinner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderTopColor: 'white',
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  gaitCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 20,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 20,
  },
  gaitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  gaitScore: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  gaitScoreText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
  gaitScoreLabel: {
    fontSize: 16,
    color: Colors.light.textLight,
    marginLeft: 4,
  },
  gaitDate: {
    fontSize: 14,
    color: Colors.light.textLight,
  },
  gaitFeedback: {
    fontSize: 16,
    color: Colors.light.text,
    marginBottom: 12,
  },
  improvements: {
    marginTop: 8,
  },
  improvementItem: {
    fontSize: 14,
    color: Colors.light.textLight,
    marginBottom: 4,
  },
  runCard: {
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
  runHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  runType: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  runDate: {
    fontSize: 14,
    color: Colors.light.textLight,
    marginLeft: 8,
  },
  runBadge: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  runBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  runStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  runStat: {
    alignItems: 'center',
  },
  runStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  runStatLabel: {
    fontSize: 12,
    color: Colors.light.textLight,
    marginTop: 2,
  },
  runRoute: {
    fontSize: 14,
    color: Colors.light.textLight,
    fontStyle: 'italic',
  },
  achievements: {
    padding: 20,
    paddingTop: 0,
  },
  achievementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  achievementCard: {
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
  achievementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  achievementDesc: {
    fontSize: 12,
    color: Colors.light.textLight,
    textAlign: 'center',
  },

});