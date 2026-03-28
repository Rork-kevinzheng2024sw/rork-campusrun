import { Run, GroupRun, Task, GaitTest } from '@/types/run';

export const mockRuns: Run[] = [
  {
    id: '1',
    date: '2024-01-15',
    duration: 1800, // 30 minutes
    distance: 5.2,
    pace: 5.8,
    calories: 320,
    type: 'solo',
    route: 'Campus Loop'
  },
  {
    id: '2', 
    date: '2024-01-13',
    duration: 2400, // 40 minutes
    distance: 6.8,
    pace: 5.9,
    calories: 420,
    type: 'group',
    route: 'River Trail'
  },
  {
    id: '3',
    date: '2024-01-11',
    duration: 1200, // 20 minutes
    distance: 3.5,
    pace: 5.7,
    calories: 210,
    type: 'task',
    route: 'Library Quest'
  }
];

export const mockGroupRuns: GroupRun[] = [
  {
    id: '1',
    title: 'Morning Campus Loop',
    date: '2024-01-16',
    time: '07:00',
    distance: 5,
    pace: '6:00',
    participants: 8,
    maxParticipants: 12,
    location: 'Student Center',
    organizer: 'Sarah M.',
    difficulty: 'easy'
  },
  {
    id: '2',
    title: 'Hill Training Session',
    date: '2024-01-16',
    time: '18:30',
    distance: 4,
    pace: '5:30',
    participants: 5,
    maxParticipants: 8,
    location: 'Athletic Center',
    organizer: 'Mike R.',
    difficulty: 'hard'
  },
  {
    id: '3',
    title: 'Social Evening Jog',
    date: '2024-01-17',
    time: '19:00',
    distance: 6,
    pace: '6:30',
    participants: 12,
    maxParticipants: 15,
    location: 'Main Gate',
    organizer: 'Emma L.',
    difficulty: 'medium'
  }
];

export const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Library Explorer',
    description: 'Run to all 3 campus libraries and take a selfie',
    location: 'Main Library',
    distance: 2.5,
    reward: 50,
    difficulty: 'easy',
    completed: false,
    type: 'exploration'
  },
  {
    id: '2',
    title: 'Coffee Shop Circuit',
    description: 'Visit 5 different coffee shops around campus',
    location: 'Campus Center',
    distance: 4.2,
    reward: 75,
    difficulty: 'medium',
    completed: true,
    type: 'exploration'
  },
  {
    id: '3',
    title: 'Speed Challenge',
    description: 'Complete a 1km run under 4 minutes',
    location: 'Track Field',
    distance: 1,
    reward: 100,
    difficulty: 'hard',
    completed: false,
    type: 'challenge'
  }
];

export const mockGaitTests: GaitTest[] = [
  {
    id: '1',
    date: '2024-01-10',
    score: 85,
    feedback: 'Good form! Your cadence is excellent.',
    improvements: ['Slightly increase stride length', 'Focus on arm swing']
  },
  {
    id: '2',
    date: '2024-01-05',
    score: 78,
    feedback: 'Room for improvement in foot strike.',
    improvements: ['Land more on midfoot', 'Reduce overstriding']
  }
];