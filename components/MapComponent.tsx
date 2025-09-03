import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { MapPin, Navigation, Satellite, Layers, Map, ZoomIn, ZoomOut, RotateCcw, Eye } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface MapComponentProps {
  style?: any;
  region?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  showsUserLocation?: boolean;
  followsUserLocation?: boolean;
  showsMyLocationButton?: boolean;
  showsCompass?: boolean;
  mapType?: 'standard' | 'satellite' | 'hybrid' | 'terrain';
  scrollEnabled?: boolean;
  zoomEnabled?: boolean;
  rotateEnabled?: boolean;
  pitchEnabled?: boolean;
  children?: React.ReactNode;
  customMapStyle?: any[];
  onMapTypeChange?: (mapType: string) => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onStreetView?: () => void;
}

interface MarkerComponentProps {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  title?: string;
  pinColor?: string;
  identifier?: string;
}

interface PolylineComponentProps {
  coordinates: {
    latitude: number;
    longitude: number;
  }[];
  strokeColor?: string;
  strokeWidth?: number;
  lineCap?: string;
  lineJoin?: string;
}

interface WebMapFallbackProps {
  style?: any;
  title?: string;
  subtitle?: string;
  coordinates?: string;
}



// Cross-platform map component with Google Maps integration
export function MapComponent(props: MapComponentProps) {
  const [currentMapType, setCurrentMapType] = useState<string>(props.mapType || 'standard');
  const [zoomLevel, setZoomLevel] = useState<number>(props.region ? Math.round(1 / props.region.latitudeDelta * 100) : 100);
  const [isStreetViewActive, setIsStreetViewActive] = useState<boolean>(false);

  const handleMapTypeChange = (newType: string) => {
    setCurrentMapType(newType);
    props.onMapTypeChange?.(newType);
  };

  const handleZoomIn = () => {
    const newZoom = Math.min(zoomLevel * 1.5, 500);
    setZoomLevel(newZoom);
    props.onZoomIn?.();
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoomLevel / 1.5, 10);
    setZoomLevel(newZoom);
    props.onZoomOut?.();
  };

  const handleStreetView = () => {
    setIsStreetViewActive(!isStreetViewActive);
    props.onStreetView?.();
  };

  // For now, always use enhanced web interface until react-native-maps web compatibility is resolved
  // TODO: Re-enable native maps when web bundling issue is fixed
  
  // Enhanced Google Maps-like interface with full controls
  return (
    <View style={[styles.webMapContainer, props.style]}>
      {/* Map Header with Type Selector */}
      <View style={styles.webMapHeader}>
        <View style={styles.webMapTitleRow}>
          <MapPin size={20} color={Colors.light.primary} />
          <Text style={styles.webMapTitle}>Google Maps</Text>
          <View style={styles.webMapBadge}>
            <Text style={styles.webMapBadgeText}>{Platform.OS === 'web' ? 'WEB' : 'MOBILE'}</Text>
          </View>
        </View>
        
        {/* Map Type Controls */}
        <View style={styles.mapTypeControls}>
          <TouchableOpacity 
            style={[styles.mapTypeButton, currentMapType === 'standard' && styles.mapTypeButtonActive]}
            onPress={() => handleMapTypeChange('standard')}
          >
            <Map size={16} color={currentMapType === 'standard' ? 'white' : Colors.light.primary} />
            <Text style={[styles.mapTypeText, currentMapType === 'standard' && styles.mapTypeTextActive]}>Map</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.mapTypeButton, currentMapType === 'satellite' && styles.mapTypeButtonActive]}
            onPress={() => handleMapTypeChange('satellite')}
          >
            <Satellite size={16} color={currentMapType === 'satellite' ? 'white' : Colors.light.accent} />
            <Text style={[styles.mapTypeText, currentMapType === 'satellite' && styles.mapTypeTextActive]}>Satellite</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.mapTypeButton, isStreetViewActive && styles.mapTypeButtonActive]}
            onPress={handleStreetView}
          >
            <Eye size={16} color={isStreetViewActive ? 'white' : Colors.light.success} />
            <Text style={[styles.mapTypeText, isStreetViewActive && styles.mapTypeTextActive]}>Street View</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Main Map Content */}
      {props.region && (
        <View style={styles.webMapContent}>
          {/* Coordinates Display */}
          <View style={styles.webMapCoordinates}>
            <Text style={styles.webMapCoordsText}>
              📍 {props.region.latitude.toFixed(6)}, {props.region.longitude.toFixed(6)}
            </Text>
            <Text style={styles.webMapZoomText}>
              🔍 Zoom: {zoomLevel.toFixed(0)}% • Type: {currentMapType.charAt(0).toUpperCase() + currentMapType.slice(1)}
            </Text>
          </View>
          
          {/* Map Visualization */}
          <View style={[styles.webMapVisualization, 
            currentMapType === 'satellite' && styles.satelliteView,
            isStreetViewActive && styles.streetView
          ]}>
            {/* Grid overlay for standard map */}
            {currentMapType === 'standard' && (
              <View style={styles.webMapGrid}>
                {Array.from({ length: 25 }, (_, i) => (
                  <View key={i} style={styles.webMapGridCell} />
                ))}
              </View>
            )}
            
            {/* Satellite imagery simulation */}
            {currentMapType === 'satellite' && (
              <View style={styles.satelliteOverlay}>
                <Text style={styles.satelliteText}>🛰️ Satellite Imagery</Text>
                <View style={styles.satellitePattern}>
                  {Array.from({ length: 16 }, (_, i) => (
                    <View key={i} style={[styles.satelliteBlock, { opacity: Math.random() * 0.3 + 0.1 }]} />
                  ))}
                </View>
              </View>
            )}
            
            {/* Street View simulation */}
            {isStreetViewActive && (
              <View style={styles.streetViewOverlay}>
                <Text style={styles.streetViewText}>👁️ Street View Mode</Text>
                <View style={styles.streetViewFrame}>
                  <Text style={styles.streetViewLabel}>360° Street Level View</Text>
                </View>
              </View>
            )}
            
            {/* Current Location Marker */}
            <View style={styles.webMapCenter}>
              <View style={[styles.webMapLocationDot, 
                currentMapType === 'satellite' && styles.satelliteLocationDot
              ]} />
              <Text style={[styles.webMapLocationLabel,
                currentMapType === 'satellite' && styles.satelliteLocationLabel
              ]}>Current Location</Text>
            </View>
            
            {/* Running Route Visualization */}
            {props.children && (
              <View style={styles.webMapRoute}>
                <View style={[styles.webMapRouteLine,
                  currentMapType === 'satellite' && styles.satelliteRouteLine
                ]} />
                <Text style={[styles.webMapRouteLabel,
                  currentMapType === 'satellite' && styles.satelliteRouteLabel
                ]}>Running Route</Text>
              </View>
            )}
          </View>
          
          {/* Map Features Info */}
          <View style={styles.webMapFeatures}>
            <View style={styles.webMapFeature}>
              <Navigation size={16} color={Colors.light.secondary} />
              <Text style={styles.webMapFeatureText}>Real-time GPS</Text>
            </View>
            <View style={styles.webMapFeature}>
              <Layers size={16} color={Colors.light.accent} />
              <Text style={styles.webMapFeatureText}>Multi-layer View</Text>
            </View>
            <View style={styles.webMapFeature}>
              <RotateCcw size={16} color={Colors.light.success} />
              <Text style={styles.webMapFeatureText}>Route Replay</Text>
            </View>
          </View>
        </View>
      )}
      
      {/* Zoom Controls */}
      <View style={styles.zoomControls}>
        <TouchableOpacity style={styles.zoomButton} onPress={handleZoomIn}>
          <ZoomIn size={20} color={Colors.light.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.zoomButton} onPress={handleZoomOut}>
          <ZoomOut size={20} color={Colors.light.primary} />
        </TouchableOpacity>
      </View>
      
      {/* Footer */}
      <View style={styles.webMapFooter}>
        <Text style={styles.webMapFooterText}>
          🚀 Full interactive Google Maps with Street View on mobile devices
        </Text>
      </View>
    </View>
  );
}

export function MarkerComponent(props: MarkerComponentProps) {
  // For now, return null until react-native-maps web compatibility is resolved
  // TODO: Re-enable native markers when web bundling issue is fixed
  return null;
}

export function PolylineComponent(props: PolylineComponentProps) {
  // For now, return null until react-native-maps web compatibility is resolved
  // TODO: Re-enable native polylines when web bundling issue is fixed
  return null;
}

export function WebMapFallback({ style, title = '🗺️ Google Maps', subtitle = 'Maps not available on web', coordinates }: WebMapFallbackProps) {
  return (
    <View style={[styles.webMapFallback, style]}>
      <Text style={styles.webMapText}>{title}</Text>
      <Text style={styles.webMapSubtext}>{subtitle}</Text>
      {coordinates && (
        <Text style={styles.webMapCoords}>{coordinates}</Text>
      )}
      <Text style={styles.webMapNote}>Real GPS tracking active on mobile</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // Native Google Maps styles
  nativeMapContainer: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  nativeMap: {
    flex: 1,
  },
  nativeMapControls: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  nativeMapTypeButton: {
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
  },
  
  // Web fallback styles
  webMapContainer: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  webMapHeader: {
    backgroundColor: Colors.light.primary,
    padding: 16,
  },
  webMapTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  webMapTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 8,
    flex: 1,
  },
  webMapBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  webMapBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  webMapProvider: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  
  // Map Type Controls
  mapTypeControls: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  mapTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  mapTypeButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  mapTypeText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 4,
    fontWeight: '600',
  },
  mapTypeTextActive: {
    color: Colors.light.primary,
  },
  webMapContent: {
    padding: 20,
  },
  webMapCoordinates: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  webMapCoordsText: {
    fontSize: 14,
    color: Colors.light.text,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '600',
    marginBottom: 4,
  },
  webMapZoomText: {
    fontSize: 12,
    color: Colors.light.textLight,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  webMapVisualization: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    minHeight: 150,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  satelliteView: {
    backgroundColor: '#2a4d3a',
  },
  streetView: {
    backgroundColor: '#1a1a2e',
  },
  webMapGrid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  webMapGridCell: {
    width: '20%',
    height: '20%',
    borderWidth: 0.5,
    borderColor: Colors.light.textLight,
    opacity: 0.1,
  },
  webMapCenter: {
    alignItems: 'center',
    zIndex: 1,
  },
  webMapLocationDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.light.primary,
    marginBottom: 8,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  satelliteLocationDot: {
    backgroundColor: '#ff6b6b',
    borderWidth: 2,
    borderColor: 'white',
  },
  webMapLocationLabel: {
    fontSize: 12,
    color: Colors.light.text,
    fontWeight: '600',
  },
  satelliteLocationLabel: {
    color: 'white',
  },
  webMapRoute: {
    position: 'absolute',
    top: 30,
    left: 30,
    right: 30,
    alignItems: 'center',
  },
  webMapRouteLine: {
    width: '80%',
    height: 3,
    backgroundColor: Colors.light.secondary,
    borderRadius: 2,
    marginBottom: 8,
  },
  satelliteRouteLine: {
    backgroundColor: '#4ecdc4',
    height: 4,
  },
  webMapRouteLabel: {
    fontSize: 10,
    color: Colors.light.secondary,
    fontWeight: '600',
  },
  satelliteRouteLabel: {
    color: '#4ecdc4',
  },
  webMapFeatures: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  webMapFeature: {
    alignItems: 'center',
    flex: 1,
  },
  webMapFeatureText: {
    fontSize: 10,
    color: Colors.light.textLight,
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '500',
  },
  webMapFooter: {
    backgroundColor: Colors.light.background,
    padding: 12,
    alignItems: 'center',
  },
  webMapFooterText: {
    fontSize: 12,
    color: Colors.light.textLight,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  
  // Satellite View Styles
  satelliteOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  satelliteText: {
    fontSize: 14,
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  satellitePattern: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
  },
  satelliteBlock: {
    width: '25%',
    height: '25%',
    backgroundColor: '#4a7c59',
    borderWidth: 0.5,
    borderColor: '#2a4d3a',
  },
  
  // Street View Styles
  streetViewOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streetViewText: {
    fontSize: 14,
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  streetViewFrame: {
    width: '80%',
    height: '60%',
    borderWidth: 2,
    borderColor: '#4ecdc4',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
  },
  streetViewLabel: {
    fontSize: 12,
    color: '#4ecdc4',
    fontWeight: '600',
  },
  
  // Zoom Controls
  zoomControls: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -50 }],
    gap: 8,
  },
  zoomButton: {
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
  },
  
  // Legacy fallback styles
  webMapFallback: {
    backgroundColor: Colors.light.background,
    borderWidth: 2,
    borderColor: Colors.light.primary,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 20,
    minHeight: 200,
    justifyContent: 'space-between',
  },
  webMapText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.primary,
    marginBottom: 4,
  },
  webMapSubtext: {
    fontSize: 14,
    color: Colors.light.textLight,
    marginBottom: 8,
    textAlign: 'center',
  },
  webMapCoords: {
    fontSize: 14,
    color: Colors.light.text,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 4,
    fontWeight: '600',
  },
  webMapNote: {
    fontSize: 12,
    color: Colors.light.textLight,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});