export interface Run {
  id: string;
  date: string;
  duration: number; // in seconds
  distance: number; // in km
  pace: number; // in min/km
  calories: number;
  type: 'solo' | 'group' | 'task';
  route?: string;
  coordinates?: LocationCoordinate[];
  cadence?: number;
  avgSpeed?: number;
}

export interface LocationCoordinate {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy?: number;
}

export interface GroupRun {
  id: string;
  title: string;
  date: string;
  time: string;
  distance: number;
  pace: string;
  participants: number;
  maxParticipants: number;
  location: string;
  organizer: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface Task {
  id: string;
  title: string;
  description: string;
  location: string;
  distance: number;
  reward: number;
  difficulty: 'easy' | 'medium' | 'hard';
  completed: boolean;
  type: 'exploration' | 'challenge' | 'social';
}

export interface GaitTest {
  id: string;
  date: string;
  score: number;
  feedback: string;
  improvements: string[];
}

export interface GameCheckpoint {
  id: string;
  latitude: number;
  longitude: number;
  name: string;
  description?: string;
}

export interface GamePhoto {
  id: string;
  checkpointId: string;
  uri: string;
  timestamp: number;
  latitude: number;
  longitude: number;
}

export interface GameParticipant {
  id: string;
  name: string;
  route: LocationCoordinate[];
  photos: GamePhoto[];
  area: number;
  distance: number;
  completionTime: number;
  completed: boolean;
}

export interface TeamRunGame {
  id: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  createdBy: string;
  status: 'pending' | 'active' | 'completed';
  checkpoints: GameCheckpoint[];
  participants: GameParticipant[];
  gameArea: {
    center: { latitude: number; longitude: number };
    radius: number; // in meters
  };
  startTime?: number;
  endTime?: number;
}