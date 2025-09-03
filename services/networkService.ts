import { GroupRun, Task, TeamRunGame, GameCheckpoint, GamePhoto, GameParticipant } from '@/types/run';

const API_BASE_URL = 'https://api.campusrun.demo'; // Mock API endpoint

export class NetworkService {
  private static instance: NetworkService;

  static getInstance(): NetworkService {
    if (!NetworkService.instance) {
      NetworkService.instance = new NetworkService();
    }
    return NetworkService.instance;
  }

  // Group Runs API
  async fetchGroupRuns(): Promise<GroupRun[]> {
    try {
      console.log('Fetching group runs from cloud...');
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, this would be:
      // const response = await fetch(`${API_BASE_URL}/group-runs`);
      // return await response.json();
      
      // For demo, return mock data with some dynamic updates
      return this.getMockGroupRuns();
    } catch (error) {
      console.error('Failed to fetch group runs:', error);
      throw error;
    }
  }

  async createGroupRun(groupRun: Omit<GroupRun, 'id' | 'participants' | 'organizer'>): Promise<GroupRun> {
    try {
      console.log('Creating group run in cloud...', groupRun);
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // In a real app, this would be:
      // const response = await fetch(`${API_BASE_URL}/group-runs`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(groupRun)
      // });
      // return await response.json();
      
      const newGroupRun: GroupRun = {
        ...groupRun,
        id: Date.now().toString(),
        participants: 1,
        organizer: 'You'
      };
      
      return newGroupRun;
    } catch (error) {
      console.error('Failed to create group run:', error);
      throw error;
    }
  }

  async updateGroupRun(id: string, updates: Partial<GroupRun>): Promise<GroupRun> {
    try {
      console.log('Updating group run in cloud...', id, updates);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // In a real app, this would be:
      // const response = await fetch(`${API_BASE_URL}/group-runs/${id}`, {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(updates)
      // });
      // return await response.json();
      
      // For demo, return updated mock data
      const mockRuns = this.getMockGroupRuns();
      const existingRun = mockRuns.find(run => run.id === id);
      if (!existingRun) throw new Error('Group run not found');
      
      return { ...existingRun, ...updates };
    } catch (error) {
      console.error('Failed to update group run:', error);
      throw error;
    }
  }

  async deleteGroupRun(id: string): Promise<void> {
    try {
      console.log('Deleting group run from cloud...', id);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // In a real app, this would be:
      // await fetch(`${API_BASE_URL}/group-runs/${id}`, {
      //   method: 'DELETE'
      // });
      
      console.log('Group run deleted successfully');
    } catch (error) {
      console.error('Failed to delete group run:', error);
      throw error;
    }
  }

  async joinGroupRun(id: string): Promise<GroupRun> {
    try {
      console.log('Joining group run...', id);
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // In a real app, this would be:
      // const response = await fetch(`${API_BASE_URL}/group-runs/${id}/join`, {
      //   method: 'POST'
      // });
      // return await response.json();
      
      const mockRuns = this.getMockGroupRuns();
      const run = mockRuns.find(r => r.id === id);
      if (!run) throw new Error('Group run not found');
      
      return { ...run, participants: run.participants + 1 };
    } catch (error) {
      console.error('Failed to join group run:', error);
      throw error;
    }
  }

  // Tasks API
  async fetchTasks(): Promise<Task[]> {
    try {
      console.log('Fetching tasks from cloud...');
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // In a real app, this would be:
      // const response = await fetch(`${API_BASE_URL}/tasks`);
      // return await response.json();
      
      return this.getMockTasks();
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      throw error;
    }
  }

  async updateTaskCompletion(id: string, completed: boolean): Promise<Task> {
    try {
      console.log('Updating task completion in cloud...', id, completed);
      await new Promise(resolve => setTimeout(resolve, 700));
      
      // In a real app, this would be:
      // const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ completed })
      // });
      // return await response.json();
      
      const mockTasks = this.getMockTasks();
      const task = mockTasks.find(t => t.id === id);
      if (!task) throw new Error('Task not found');
      
      return { ...task, completed };
    } catch (error) {
      console.error('Failed to update task completion:', error);
      throw error;
    }
  }

  // Mock data generators
  private getMockGroupRuns(): GroupRun[] {
    return [
      {
        id: '1',
        title: 'Morning Campus Loop',
        date: '2024-01-15',
        time: '7:00 AM',
        distance: 5.2,
        pace: '5:30',
        participants: 3,
        maxParticipants: 8,
        location: 'Main Campus Entrance',
        organizer: 'Sarah Chen',
        difficulty: 'medium'
      },
      {
        id: '2',
        title: 'Sunset River Trail',
        date: '2024-01-15',
        time: '6:30 PM',
        distance: 7.1,
        pace: '6:00',
        participants: 5,
        maxParticipants: 10,
        location: 'River Trail Start',
        organizer: 'Mike Johnson',
        difficulty: 'easy'
      },
      {
        id: '3',
        title: 'Hill Challenge Sprint',
        date: '2024-01-16',
        time: '8:00 AM',
        distance: 4.3,
        pace: '4:45',
        participants: 2,
        maxParticipants: 6,
        location: 'Hill Circuit',
        organizer: 'Emma Davis',
        difficulty: 'hard'
      }
    ];
  }

  // Team Run Games API
  async fetchTeamRunGames(): Promise<TeamRunGame[]> {
    try {
      console.log('Fetching team run games from cloud...');
      await new Promise(resolve => setTimeout(resolve, 900));
      
      return this.getMockTeamRunGames();
    } catch (error) {
      console.error('Failed to fetch team run games:', error);
      throw error;
    }
  }

  async createTeamRunGame(game: Omit<TeamRunGame, 'id' | 'participants' | 'status'>): Promise<TeamRunGame> {
    try {
      console.log('Creating team run game in cloud...', game);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newGame: TeamRunGame = {
        ...game,
        id: Date.now().toString(),
        participants: [],
        status: 'pending'
      };
      
      return newGame;
    } catch (error) {
      console.error('Failed to create team run game:', error);
      throw error;
    }
  }

  async joinTeamRunGame(gameId: string, participantName: string): Promise<TeamRunGame> {
    try {
      console.log('Joining team run game...', gameId, participantName);
      await new Promise(resolve => setTimeout(resolve, 700));
      
      const mockGames = this.getMockTeamRunGames();
      const game = mockGames.find(g => g.id === gameId);
      if (!game) throw new Error('Team run game not found');
      
      const newParticipant: GameParticipant = {
        id: Date.now().toString(),
        name: participantName,
        route: [],
        photos: [],
        area: 0,
        distance: 0,
        completionTime: 0,
        completed: false
      };
      
      return { ...game, participants: [...game.participants, newParticipant] };
    } catch (error) {
      console.error('Failed to join team run game:', error);
      throw error;
    }
  }

  async startTeamRunGame(gameId: string): Promise<TeamRunGame> {
    try {
      console.log('Starting team run game...', gameId);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockGames = this.getMockTeamRunGames();
      const game = mockGames.find(g => g.id === gameId);
      if (!game) throw new Error('Team run game not found');
      
      return { ...game, status: 'active', startTime: Date.now() };
    } catch (error) {
      console.error('Failed to start team run game:', error);
      throw error;
    }
  }

  async submitGamePhoto(gameId: string, participantId: string, photo: Omit<GamePhoto, 'id'>): Promise<void> {
    try {
      console.log('Submitting game photo...', gameId, participantId);
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // In a real app, this would upload the photo and update the game state
      console.log('Photo submitted successfully');
    } catch (error) {
      console.error('Failed to submit game photo:', error);
      throw error;
    }
  }

  async updateGameParticipant(gameId: string, participantId: string, updates: Partial<GameParticipant>): Promise<void> {
    try {
      console.log('Updating game participant...', gameId, participantId, updates);
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // In a real app, this would update the participant's progress
      console.log('Participant updated successfully');
    } catch (error) {
      console.error('Failed to update game participant:', error);
      throw error;
    }
  }

  private getMockTeamRunGames(): TeamRunGame[] {
    return [
      {
        id: '1',
        title: 'Campus Explorer Challenge',
        description: 'Explore the campus and visit all checkpoints to create the largest route area!',
        date: '2024-01-16',
        time: '2:00 PM',
        createdBy: 'Alex Runner',
        status: 'pending',
        checkpoints: [
          {
            id: 'cp1',
            latitude: 40.7589,
            longitude: -73.9851,
            name: 'Library Entrance',
            description: 'Take a photo at the main library entrance'
          },
          {
            id: 'cp2',
            latitude: 40.7614,
            longitude: -73.9776,
            name: 'Student Center',
            description: 'Capture the student center plaza'
          },
          {
            id: 'cp3',
            latitude: 40.7505,
            longitude: -73.9934,
            name: 'Athletic Complex',
            description: 'Photo at the main gym entrance'
          },
          {
            id: 'cp4',
            latitude: 40.7549,
            longitude: -73.9840,
            name: 'Campus Garden',
            description: 'Beautiful garden photo opportunity'
          }
        ],
        participants: [
          {
            id: 'p1',
            name: 'Sarah Chen',
            route: [],
            photos: [],
            area: 0,
            distance: 0,
            completionTime: 0,
            completed: false
          },
          {
            id: 'p2',
            name: 'Mike Johnson',
            route: [],
            photos: [],
            area: 0,
            distance: 0,
            completionTime: 0,
            completed: false
          }
        ],
        gameArea: {
          center: { latitude: 40.7549, longitude: -73.9840 },
          radius: 2000
        }
      },
      {
        id: '2',
        title: 'Weekend Warriors Route Race',
        description: 'Saturday morning challenge - design your route and maximize your area!',
        date: '2024-01-20',
        time: '9:00 AM',
        createdBy: 'Emma Davis',
        status: 'active',
        startTime: Date.now() - 1800000, // Started 30 minutes ago
        checkpoints: [
          {
            id: 'cp5',
            latitude: 40.7580,
            longitude: -73.9855,
            name: 'Clock Tower',
            description: 'Historic campus clock tower'
          },
          {
            id: 'cp6',
            latitude: 40.7520,
            longitude: -73.9800,
            name: 'Science Building',
            description: 'Modern science complex'
          },
          {
            id: 'cp7',
            latitude: 40.7600,
            longitude: -73.9780,
            name: 'Art Gallery',
            description: 'Campus art gallery entrance'
          }
        ],
        participants: [
          {
            id: 'p3',
            name: 'You',
            route: [],
            photos: [],
            area: 0,
            distance: 0,
            completionTime: 0,
            completed: false
          },
          {
            id: 'p4',
            name: 'Jordan Smith',
            route: [],
            photos: [],
            area: 1.2,
            distance: 3.4,
            completionTime: 0,
            completed: false
          },
          {
            id: 'p5',
            name: 'Taylor Brown',
            route: [],
            photos: [],
            area: 0.8,
            distance: 2.1,
            completionTime: 0,
            completed: false
          }
        ],
        gameArea: {
          center: { latitude: 40.7560, longitude: -73.9820 },
          radius: 1500
        }
      }
    ];
  }

  private getMockTasks(): Task[] {
    return [
      {
        id: '1',
        title: 'Find the Hidden Garden',
        description: 'Discover the secret botanical garden behind the library. Take a photo of the rare orchid collection.',
        location: 'University Library Area',
        distance: 2.1,
        reward: 50,
        difficulty: 'easy',
        completed: false,
        type: 'exploration'
      },
      {
        id: '2',
        title: 'Sprint Challenge',
        description: 'Complete 5 x 100m sprints with 30-second rest intervals. Maintain consistent pace throughout.',
        location: 'Athletic Track',
        distance: 0.5,
        reward: 75,
        difficulty: 'hard',
        completed: false,
        type: 'challenge'
      },
      {
        id: '3',
        title: 'Campus Art Hunt',
        description: 'Visit all 7 outdoor sculptures on campus. Share your favorite with the community.',
        location: 'Various Campus Locations',
        distance: 3.8,
        reward: 60,
        difficulty: 'medium',
        completed: false,
        type: 'exploration'
      },
      {
        id: '4',
        title: 'Group Photo Challenge',
        description: 'Organize a group run with at least 3 people and take a photo at the campus landmark.',
        location: 'Campus Landmark',
        distance: 2.5,
        reward: 80,
        difficulty: 'medium',
        completed: true,
        type: 'social'
      }
    ];
  }
}