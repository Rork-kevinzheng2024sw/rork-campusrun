import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Run, GroupRun, GaitTest, LocationCoordinate, TeamRunGame, GamePhoto, GameParticipant } from '@/types/run';
import { mockRuns, mockGaitTests } from '@/mocks/runData';
import { GPSService, GPSCoordinate } from '@/services/gpsService';
import { NetworkService } from '@/services/networkService';

export const [RunStoreProvider, useRunStore] = createContextHook(() => {
  const [runs, setRuns] = useState<Run[]>([]);
  const [gaitTests, setGaitTests] = useState<GaitTest[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentRun, setCurrentRun] = useState<{
    startTime: number;
    duration: number;
    distance: number;
    coordinates: LocationCoordinate[];
    cadence: number;
  } | null>(null);
  const [realTimeStats, setRealTimeStats] = useState({
    distance: 0,
    pace: 0,
    cadence: 0
  });
  
  const queryClient = useQueryClient();
  const gpsService = useMemo(() => GPSService.getInstance(), []);
  const networkService = useMemo(() => NetworkService.getInstance(), []);
  
  // Network queries for Group Runs
  const groupRunsQuery = useQuery({
    queryKey: ['groupRuns'],
    queryFn: () => networkService.fetchGroupRuns(),
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
  
  // Network queries for Tasks
  const tasksQuery = useQuery({
    queryKey: ['tasks'],
    queryFn: () => networkService.fetchTasks(),
    staleTime: 60000, // 1 minute
    refetchInterval: 120000, // Refetch every 2 minutes
  });
  
  // Network queries for Team Run Games
  const teamRunGamesQuery = useQuery({
    queryKey: ['teamRunGames'],
    queryFn: () => networkService.fetchTeamRunGames(),
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
  
  // Mutations for Group Runs
  const createGroupRunMutation = useMutation({
    mutationFn: (newGroupRun: Omit<GroupRun, 'id' | 'participants' | 'organizer'>) => 
      networkService.createGroupRun(newGroupRun),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupRuns'] });
    },
  });
  
  const joinGroupRunMutation = useMutation({
    mutationFn: (groupRunId: string) => networkService.joinGroupRun(groupRunId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupRuns'] });
    },
  });
  
  const updateGroupRunMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<GroupRun> }) => 
      networkService.updateGroupRun(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupRuns'] });
    },
  });
  
  const deleteGroupRunMutation = useMutation({
    mutationFn: (id: string) => networkService.deleteGroupRun(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupRuns'] });
    },
  });
  
  // Mutations for Tasks
  const updateTaskMutation = useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) => 
      networkService.updateTaskCompletion(id, completed),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
  
  // Mutations for Team Run Games
  const createTeamRunGameMutation = useMutation({
    mutationFn: (newGame: Omit<TeamRunGame, 'id' | 'participants' | 'status'>) => 
      networkService.createTeamRunGame(newGame),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamRunGames'] });
    },
  });
  
  const joinTeamRunGameMutation = useMutation({
    mutationFn: ({ gameId, participantName }: { gameId: string; participantName: string }) => 
      networkService.joinTeamRunGame(gameId, participantName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamRunGames'] });
    },
  });
  
  const startTeamRunGameMutation = useMutation({
    mutationFn: (gameId: string) => networkService.startTeamRunGame(gameId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamRunGames'] });
    },
  });
  
  const submitGamePhotoMutation = useMutation({
    mutationFn: ({ gameId, participantId, photo }: { gameId: string; participantId: string; photo: Omit<GamePhoto, 'id'> }) => 
      networkService.submitGamePhoto(gameId, participantId, photo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamRunGames'] });
    },
  });
  
  const updateGameParticipantMutation = useMutation({
    mutationFn: ({ gameId, participantId, updates }: { gameId: string; participantId: string; updates: Partial<GameParticipant> }) => 
      networkService.updateGameParticipant(gameId, participantId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamRunGames'] });
    },
  });



  useEffect(() => {
    const loadData = async () => {
      try {
        const storedRuns = await AsyncStorage.getItem('runs');
        const storedGaitTests = await AsyncStorage.getItem('gaitTests');
        
        setRuns(storedRuns ? JSON.parse(storedRuns) : mockRuns);
        setGaitTests(storedGaitTests ? JSON.parse(storedGaitTests) : mockGaitTests);
      } catch (error) {
        console.error('Error loading local data:', error);
        setRuns(mockRuns);
        setGaitTests(mockGaitTests);
      }
    };
    loadData();
  }, []);
  
  // Real-time GPS tracking effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (isRunning && currentRun) {
      interval = setInterval(() => {
        const coordinates = gpsService.getCoordinates();
        const distance = gpsService.calculateDistance(coordinates);
        const elapsed = Math.floor((Date.now() - currentRun.startTime) / 1000);
        const pace = gpsService.calculatePace(distance, elapsed);
        const cadence = gpsService.calculateCadence(coordinates, elapsed);
        
        setRealTimeStats({ distance, pace, cadence });
        setCurrentRun(prev => prev ? {
          ...prev,
          duration: elapsed,
          distance,
          coordinates,
          cadence
        } : null);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, currentRun, gpsService]);



  const startRun = useCallback(async () => {
    console.log('Starting GPS tracking...');
    const gpsStarted = await gpsService.startTracking((coordinate) => {
      console.log('GPS update:', coordinate);
    });
    
    if (!gpsStarted) {
      console.error('Failed to start GPS tracking');
      return false;
    }
    
    const startTime = Date.now();
    setCurrentRun({
      startTime,
      duration: 0,
      distance: 0,
      coordinates: [],
      cadence: 0
    });
    setIsRunning(true);
    setRealTimeStats({ distance: 0, pace: 0, cadence: 0 });
    return true;
  }, [gpsService]);

  const stopRun = useCallback(async () => {
    if (!currentRun) return;
    
    console.log('Stopping GPS tracking...');
    const coordinates = gpsService.stopTracking();
    
    const endTime = Date.now();
    const duration = Math.floor((endTime - currentRun.startTime) / 1000);
    const distance = gpsService.calculateDistance(coordinates);
    const pace = gpsService.calculatePace(distance, duration);
    const cadence = gpsService.calculateCadence(coordinates, duration);
    const avgSpeed = distance / (duration / 3600); // km/h
    const calories = Math.floor(distance * 65); // Rough calorie calculation

    const newRun: Run = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      duration,
      distance: Number(distance.toFixed(2)),
      pace: Number(pace.toFixed(1)),
      calories,
      type: 'solo',
      route: 'GPS Tracked Run',
      coordinates,
      cadence,
      avgSpeed: Number(avgSpeed.toFixed(1))
    };

    const updatedRuns = [newRun, ...runs];
    setRuns(updatedRuns);
    await AsyncStorage.setItem('runs', JSON.stringify(updatedRuns));
    
    setIsRunning(false);
    setCurrentRun(null);
    setRealTimeStats({ distance: 0, pace: 0, cadence: 0 });
    
    console.log('Run completed:', newRun);
  }, [currentRun, gpsService, runs]);



  const addGaitTest = useCallback(async (test: Omit<GaitTest, 'id'>) => {
    const newTest: GaitTest = {
      ...test,
      id: Date.now().toString()
    };
    const updatedTests = [newTest, ...gaitTests];
    setGaitTests(updatedTests);
    await AsyncStorage.setItem('gaitTests', JSON.stringify(updatedTests));
  }, [gaitTests]);

  const refreshGroupRuns = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['groupRuns'] });
  }, [queryClient]);

  const refreshTasks = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
  }, [queryClient]);
  
  const refreshTeamRunGames = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['teamRunGames'] });
  }, [queryClient]);
  
  // Game area calculation using shoelace formula
  const calculateRouteArea = useCallback((coordinates: LocationCoordinate[]): number => {
    if (coordinates.length < 3) return 0;
    
    // Convert to meters using approximate conversion
    const toMeters = (lat: number, lng: number) => ({
      x: lng * 111320 * Math.cos(lat * Math.PI / 180),
      y: lat * 111320
    });
    
    const points = coordinates.map(coord => toMeters(coord.latitude, coord.longitude));
    
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }
    
    return Math.abs(area) / 2 / 1000000; // Convert to km²
  }, []);

  return useMemo(() => {
    const joinGroupRun = async (groupRunId: string) => {
      try {
        await joinGroupRunMutation.mutateAsync(groupRunId);
      } catch (error) {
        console.error('Failed to join group run:', error);
        throw error;
      }
    };

    const createGroupRun = async (newGroupRun: Omit<GroupRun, 'id' | 'participants' | 'organizer'>) => {
      try {
        await createGroupRunMutation.mutateAsync(newGroupRun);
      } catch (error) {
        console.error('Failed to create group run:', error);
        throw error;
      }
    };
    
    const updateGroupRun = async (id: string, updates: Partial<GroupRun>) => {
      try {
        await updateGroupRunMutation.mutateAsync({ id, updates });
      } catch (error) {
        console.error('Failed to update group run:', error);
        throw error;
      }
    };
    
    const deleteGroupRun = async (id: string) => {
      try {
        await deleteGroupRunMutation.mutateAsync(id);
      } catch (error) {
        console.error('Failed to delete group run:', error);
        throw error;
      }
    };

    const completeTask = async (taskId: string) => {
      try {
        // Start GPS tracking for task completion
        const gpsStarted = await gpsService.startTracking();
        if (gpsStarted) {
          console.log('GPS tracking started for task:', taskId);
          // In a real app, you would track the user's movement to the task location
          // For demo, we'll simulate completion after a short delay
          setTimeout(() => {
            gpsService.stopTracking();
            updateTaskMutation.mutateAsync({ id: taskId, completed: true }).catch(console.error);
          }, 2000);
        } else {
          // Fallback without GPS
          await updateTaskMutation.mutateAsync({ id: taskId, completed: true });
        }
      } catch (error) {
        console.error('Failed to complete task:', error);
        throw error;
      }
    };
    
    const createTeamRunGame = async (newGame: Omit<TeamRunGame, 'id' | 'participants' | 'status'>) => {
      try {
        await createTeamRunGameMutation.mutateAsync(newGame);
      } catch (error) {
        console.error('Failed to create team run game:', error);
        throw error;
      }
    };
    
    const joinTeamRunGame = async (gameId: string, participantName: string) => {
      try {
        await joinTeamRunGameMutation.mutateAsync({ gameId, participantName });
      } catch (error) {
        console.error('Failed to join team run game:', error);
        throw error;
      }
    };
    
    const startTeamRunGame = async (gameId: string) => {
      try {
        await startTeamRunGameMutation.mutateAsync(gameId);
      } catch (error) {
        console.error('Failed to start team run game:', error);
        throw error;
      }
    };
    
    const submitGamePhoto = async (gameId: string, participantId: string, photo: Omit<GamePhoto, 'id'>) => {
      try {
        await submitGamePhotoMutation.mutateAsync({ gameId, participantId, photo });
      } catch (error) {
        console.error('Failed to submit game photo:', error);
        throw error;
      }
    };
    
    const updateGameParticipant = async (gameId: string, participantId: string, updates: Partial<GameParticipant>) => {
      try {
        await updateGameParticipantMutation.mutateAsync({ gameId, participantId, updates });
      } catch (error) {
        console.error('Failed to update game participant:', error);
        throw error;
      }
    };

    return {
      // Local data
      runs,
      gaitTests,
      isRunning,
      currentRun,
      realTimeStats,
      
      // Network data
      groupRuns: groupRunsQuery.data || [],
      tasks: tasksQuery.data || [],
      teamRunGames: teamRunGamesQuery.data || [],
      
      // Loading states
      isLoadingGroupRuns: groupRunsQuery.isLoading,
      isLoadingTasks: tasksQuery.isLoading,
      isLoadingTeamRunGames: teamRunGamesQuery.isLoading,
      
      // Actions
      startRun,
      stopRun,
      joinGroupRun,
      createGroupRun,
      updateGroupRun,
      deleteGroupRun,
      completeTask,
      addGaitTest,
      
      // Team Run Game actions
      createTeamRunGame,
      joinTeamRunGame,
      startTeamRunGame,
      submitGamePhoto,
      updateGameParticipant,
      calculateRouteArea,
      
      // Refresh functions
      refreshGroupRuns,
      refreshTasks,
      refreshTeamRunGames
    };
  }, [
    runs,
    gaitTests,
    isRunning,
    currentRun,
    realTimeStats,
    groupRunsQuery.data,
    tasksQuery.data,
    teamRunGamesQuery.data,
    groupRunsQuery.isLoading,
    tasksQuery.isLoading,
    teamRunGamesQuery.isLoading,
    startRun,
    stopRun,
    addGaitTest,
    refreshGroupRuns,
    refreshTasks,
    refreshTeamRunGames,
    calculateRouteArea,
    gpsService
  ]);
});