import { Platform } from 'react-native';

// Conditionally import expo-location only on mobile platforms
let Location: any = null;
if (Platform.OS !== 'web') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Location = require('expo-location');
}

export interface GPSCoordinate {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy?: number;
  altitude?: number;
  speed?: number;
}

export interface RunMetrics {
  distance: number; // in kilometers
  pace: number; // minutes per kilometer
  cadence: number; // steps per minute
  elevation: number; // meters
  calories: number;
}

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface RouteAnalysis {
  totalDistance: number;
  averageSpeed: number;
  maxSpeed: number;
  elevationGain: number;
  elevationLoss: number;
  routeType: 'loop' | 'out-and-back' | 'point-to-point';
  difficulty: 'easy' | 'moderate' | 'hard';
}

export class GPSService {
  private static instance: GPSService;
  private watchId: any | null = null;
  private webWatchId: number | null = null;
  private coordinates: GPSCoordinate[] = [];
  private isTracking = false;
  private onLocationUpdate?: (coordinate: GPSCoordinate) => void;
  private startTime: number = 0;
  private totalDistance = 0;
  private stepCount = 0;
  private lastStepTime = 0;
  private elevationPoints: number[] = [];

  static getInstance(): GPSService {
    if (!GPSService.instance) {
      GPSService.instance = new GPSService();
    }
    return GPSService.instance;
  }

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') {
      // Web geolocation API
      return new Promise((resolve) => {
        if ('geolocation' in navigator) {
          navigator.permissions.query({ name: 'geolocation' }).then((result) => {
            resolve(result.state === 'granted' || result.state === 'prompt');
          }).catch(() => resolve(false));
        } else {
          resolve(false);
        }
      });
    }

    try {
      if (Location) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        return status === 'granted';
      }
      return false;
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  async getCurrentPosition(): Promise<GPSCoordinate | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      if (Platform.OS === 'web') {
        return new Promise((resolve) => {
          if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                resolve({
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                  timestamp: Date.now(),
                  accuracy: position.coords.accuracy,
                  altitude: position.coords.altitude || undefined,
                  speed: position.coords.speed || undefined,
                });
              },
              () => resolve(null),
              { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
            );
          } else {
            resolve(null);
          }
        });
      }

      try {
        if (Location) {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.BestForNavigation,
          });

          return {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            timestamp: location.timestamp,
            accuracy: location.coords.accuracy || undefined,
            altitude: location.coords.altitude || undefined,
            speed: location.coords.speed || undefined,
          };
        }
        return null;
      } catch (error) {
        console.error('Error getting mobile location:', error);
        return null;
      }
    } catch (error) {
      console.error('Error getting current position:', error);
      return null;
    }
  }

  async startTracking(onUpdate?: (coordinate: GPSCoordinate) => void): Promise<boolean> {
    if (this.isTracking) return true;

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      console.log('GPS permission denied');
      return false;
    }

    this.onLocationUpdate = onUpdate;
    this.coordinates = [];
    this.totalDistance = 0;
    this.stepCount = 0;
    this.elevationPoints = [];
    this.startTime = Date.now();
    this.isTracking = true;

    if (Platform.OS === 'web') {
      this.startWebTracking();
    } else {
      this.startMobileTracking();
    }

    return true;
  }

  private startWebTracking() {
    if ('geolocation' in navigator) {
      this.webWatchId = navigator.geolocation.watchPosition(
        (position) => {
          const coordinate: GPSCoordinate = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: Date.now(),
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude || undefined,
            speed: position.coords.speed || undefined,
          };
          this.addCoordinate(coordinate);
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
  }

  private async startMobileTracking() {
    try {
      if (Location) {
        this.watchId = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: 1000,
            distanceInterval: 1,
          },
          (location: any) => {
            const coordinate: GPSCoordinate = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              timestamp: Date.now(),
              accuracy: location.coords.accuracy || undefined,
              altitude: location.coords.altitude || undefined,
              speed: location.coords.speed || undefined,
            };
            this.addCoordinate(coordinate);
          }
        );
      } else {
        console.error('Location module not available on this platform');
        this.isTracking = false;
      }
    } catch (error) {
      console.error('Mobile GPS tracking error:', error);
      this.isTracking = false;
    }
  }

  private addCoordinate(coordinate: GPSCoordinate) {
    this.coordinates.push(coordinate);

    // Track elevation
    if (coordinate.altitude) {
      this.elevationPoints.push(coordinate.altitude);
    }

    // Calculate distance from previous point
    if (this.coordinates.length > 1) {
      const prevCoord = this.coordinates[this.coordinates.length - 2];
      const distance = this.haversineDistance(prevCoord, coordinate);
      this.totalDistance += distance;
    }

    // Simulate step counting based on movement
    if (coordinate.speed && coordinate.speed > 0.5) { // Moving faster than 0.5 m/s
      const now = Date.now();
      if (now - this.lastStepTime > 400) { // Minimum 400ms between steps
        this.stepCount++;
        this.lastStepTime = now;
      }
    }

    this.onLocationUpdate?.(coordinate);
  }

  stopTracking(): GPSCoordinate[] {
    this.isTracking = false;

    if (Platform.OS === 'web') {
      if (this.webWatchId !== null) {
        navigator.geolocation.clearWatch(this.webWatchId);
        this.webWatchId = null;
      }
    } else {
      if (this.watchId) {
        try {
          this.watchId.remove();
        } catch (error) {
          console.error('Error removing location subscription:', error);
        }
        this.watchId = null;
      }
    }

    const result = [...this.coordinates];
    return result;
  }

  getCoordinates(): GPSCoordinate[] {
    return [...this.coordinates];
  }

  getCurrentMetrics(): RunMetrics {
    const elapsedTime = (Date.now() - this.startTime) / 1000 / 60; // minutes
    const pace = this.totalDistance > 0 ? elapsedTime / this.totalDistance : 0;
    const cadence = elapsedTime > 0 ? (this.stepCount / elapsedTime) : 0;
    
    // Calculate elevation gain
    let elevation = 0;
    if (this.elevationPoints.length > 1) {
      let gain = 0;
      for (let i = 1; i < this.elevationPoints.length; i++) {
        const diff = this.elevationPoints[i] - this.elevationPoints[i - 1];
        if (diff > 0) gain += diff;
      }
      elevation = gain;
    }

    // Estimate calories (rough calculation based on distance and elevation)
    const baseCalories = this.totalDistance * 65; // ~65 calories per km
    const elevationCalories = elevation * 0.1; // Additional calories for elevation
    const calories = Math.round(baseCalories + elevationCalories);

    return {
      distance: this.totalDistance,
      pace,
      cadence,
      elevation,
      calories,
    };
  }

  calculateDistance(coordinates: GPSCoordinate[]): number {
    if (coordinates.length < 2) return 0;

    let totalDistance = 0;
    for (let i = 1; i < coordinates.length; i++) {
      const prev = coordinates[i - 1];
      const curr = coordinates[i];
      totalDistance += this.haversineDistance(prev, curr);
    }

    return totalDistance;
  }

  private haversineDistance(coord1: GPSCoordinate, coord2: GPSCoordinate): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(coord2.latitude - coord1.latitude);
    const dLon = this.toRadians(coord2.longitude - coord1.longitude);
    const lat1 = this.toRadians(coord1.latitude);
    const lat2 = this.toRadians(coord2.latitude);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  calculatePace(distance: number, duration: number): number {
    if (distance === 0) return 0;
    return (duration / 60) / distance; // minutes per km
  }

  calculateCadence(coordinates: GPSCoordinate[], duration: number): number {
    // Simplified cadence calculation based on movement patterns
    // In a real app, this would use accelerometer data
    if (coordinates.length < 10 || duration === 0) return 0;
    
    const avgSpeed = this.calculateDistance(coordinates) / (duration / 3600); // km/h
    // Estimate cadence based on speed (rough approximation)
    return Math.floor(avgSpeed * 25 + 140); // steps per minute
  }

  // Calculate optimal map region to show the entire route
  getRouteMapRegion(padding: number = 0.01): MapRegion | null {
    if (this.coordinates.length === 0) return null;

    let minLat = this.coordinates[0].latitude;
    let maxLat = this.coordinates[0].latitude;
    let minLng = this.coordinates[0].longitude;
    let maxLng = this.coordinates[0].longitude;

    this.coordinates.forEach(coord => {
      minLat = Math.min(minLat, coord.latitude);
      maxLat = Math.max(maxLat, coord.latitude);
      minLng = Math.min(minLng, coord.longitude);
      maxLng = Math.max(maxLng, coord.longitude);
    });

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    const deltaLat = Math.max(maxLat - minLat + padding, 0.01);
    const deltaLng = Math.max(maxLng - minLng + padding, 0.01);

    return {
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: deltaLat,
      longitudeDelta: deltaLng,
    };
  }

  // Analyze the route characteristics
  analyzeRoute(): RouteAnalysis | null {
    if (this.coordinates.length < 2) return null;

    const start = this.coordinates[0];
    const end = this.coordinates[this.coordinates.length - 1];
    const distanceFromStartToEnd = this.haversineDistance(start, end);

    // Determine route type
    let routeType: 'loop' | 'out-and-back' | 'point-to-point' = 'point-to-point';
    if (distanceFromStartToEnd < 0.1) { // Within 100m
      routeType = 'loop';
    } else if (distanceFromStartToEnd < this.totalDistance * 0.3) {
      routeType = 'out-and-back';
    }

    // Calculate speeds
    const elapsedTime = (Date.now() - this.startTime) / 1000 / 3600; // hours
    const averageSpeed = elapsedTime > 0 ? this.totalDistance / elapsedTime : 0;
    
    let maxSpeed = 0;
    this.coordinates.forEach(coord => {
      if (coord.speed && coord.speed > maxSpeed) {
        maxSpeed = coord.speed * 3.6; // Convert m/s to km/h
      }
    });

    // Calculate elevation changes
    let elevationGain = 0;
    let elevationLoss = 0;
    for (let i = 1; i < this.elevationPoints.length; i++) {
      const diff = this.elevationPoints[i] - this.elevationPoints[i - 1];
      if (diff > 0) {
        elevationGain += diff;
      } else {
        elevationLoss += Math.abs(diff);
      }
    }

    // Determine difficulty
    let difficulty: 'easy' | 'moderate' | 'hard' = 'easy';
    if (this.totalDistance > 10 || elevationGain > 200) {
      difficulty = 'hard';
    } else if (this.totalDistance > 5 || elevationGain > 100) {
      difficulty = 'moderate';
    }

    return {
      totalDistance: this.totalDistance,
      averageSpeed,
      maxSpeed,
      elevationGain,
      elevationLoss,
      routeType,
      difficulty,
    };
  }

  // Calculate the area enclosed by a closed-loop route (for team games)
  calculateRouteArea(): number {
    if (this.coordinates.length < 3) return 0;

    // Use the shoelace formula to calculate polygon area
    let area = 0;
    const coords = this.coordinates;
    
    for (let i = 0; i < coords.length; i++) {
      const j = (i + 1) % coords.length;
      area += coords[i].latitude * coords[j].longitude;
      area -= coords[j].latitude * coords[i].longitude;
    }
    
    area = Math.abs(area) / 2;
    
    // Convert to square meters (approximate)
    const earthRadius = 6371000; // meters
    const areaInSquareMeters = area * Math.pow(earthRadius * Math.PI / 180, 2);
    
    return areaInSquareMeters;
  }

  // Get a simplified route for display (reduce points for performance)
  getSimplifiedRoute(maxPoints: number = 100): GPSCoordinate[] {
    if (this.coordinates.length <= maxPoints) {
      return [...this.coordinates];
    }

    const step = Math.floor(this.coordinates.length / maxPoints);
    const simplified: GPSCoordinate[] = [];
    
    for (let i = 0; i < this.coordinates.length; i += step) {
      simplified.push(this.coordinates[i]);
    }
    
    // Always include the last point
    if (simplified[simplified.length - 1] !== this.coordinates[this.coordinates.length - 1]) {
      simplified.push(this.coordinates[this.coordinates.length - 1]);
    }
    
    return simplified;
  }

  // Generate waypoints for navigation
  generateWaypoints(targetDistance: number): GPSCoordinate[] {
    const waypoints: GPSCoordinate[] = [];
    let accumulatedDistance = 0;
    let lastWaypointIndex = 0;

    for (let i = 1; i < this.coordinates.length; i++) {
      const distance = this.haversineDistance(
        this.coordinates[i - 1],
        this.coordinates[i]
      );
      
      accumulatedDistance += distance;
      
      if (accumulatedDistance >= targetDistance) {
        waypoints.push(this.coordinates[i]);
        accumulatedDistance = 0;
        lastWaypointIndex = i;
      }
    }
    
    // Add the final point if it's not already included
    if (lastWaypointIndex < this.coordinates.length - 1) {
      waypoints.push(this.coordinates[this.coordinates.length - 1]);
    }
    
    return waypoints;
  }

  isCurrentlyTracking(): boolean {
    return this.isTracking;
  }

  // Reset all tracking data
  reset(): void {
    this.stopTracking();
    this.coordinates = [];
    this.totalDistance = 0;
    this.stepCount = 0;
    this.elevationPoints = [];
    this.startTime = 0;
  }
}