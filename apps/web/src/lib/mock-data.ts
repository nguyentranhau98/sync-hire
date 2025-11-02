/**
 * Mock Data Layer for SyncHire
 *
 * Provides static data for testing interview flow without database
 */

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'EMPLOYER' | 'CANDIDATE';
  createdAt: Date;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  description: string;
  employerId: string;
  questions: string[];
  createdAt: Date;
}

export interface Interview {
  id: string;
  jobId: string;
  candidateId: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  callId?: string;
  transcript?: string;
  score?: number;
  createdAt: Date;
}

// Mock Users
export const mockUsers: Record<string, User> = {
  'employer-1': {
    id: 'employer-1',
    name: 'Sarah Chen',
    email: 'sarah@techcorp.com',
    role: 'EMPLOYER',
    createdAt: new Date('2025-01-01'),
  },
  'candidate-1': {
    id: 'candidate-1',
    name: 'John Smith',
    email: 'john.smith@example.com',
    role: 'CANDIDATE',
    createdAt: new Date('2025-01-05'),
  },
  'candidate-2': {
    id: 'candidate-2',
    name: 'Jamie Rodriguez',
    email: 'jamie@example.com',
    role: 'CANDIDATE',
    createdAt: new Date('2025-01-06'),
  },
  'candidate-3': {
    id: 'candidate-3',
    name: 'Alex Thompson',
    email: 'alex@example.com',
    role: 'CANDIDATE',
    createdAt: new Date('2025-01-07'),
  },
  'candidate-4': {
    id: 'candidate-4',
    name: 'Maria Garcia',
    email: 'maria@example.com',
    role: 'CANDIDATE',
    createdAt: new Date('2025-01-08'),
  },
  'candidate-5': {
    id: 'candidate-5',
    name: 'David Kim',
    email: 'david@example.com',
    role: 'CANDIDATE',
    createdAt: new Date('2025-01-09'),
  },
};

// Mock Jobs
export const mockJobs: Record<string, Job> = {
  'job-1': {
    id: 'job-1',
    title: 'Senior Full Stack Developer',
    company: 'Stripe',
    description: 'We are seeking an experienced Full Stack Developer to join our team...',
    employerId: 'employer-1',
    questions: [
      'Tell me about your experience with React and Next.js',
      'How do you approach state management in large applications?',
      'Describe a challenging bug you solved recently',
      'What is your experience with TypeScript?',
      'How do you ensure code quality in your projects?',
      'Tell me about your experience with REST APIs',
      'How do you handle authentication and authorization?',
      'Describe your testing strategy for frontend applications',
    ],
    createdAt: new Date('2025-01-03'),
  },
  'job-2': {
    id: 'job-2',
    title: 'Python Backend Engineer',
    company: 'Databricks',
    description: 'Looking for a Python expert to work on our backend services...',
    employerId: 'employer-1',
    questions: [
      'What is your experience with Python and FastAPI?',
      'How do you design RESTful APIs?',
      'Tell me about your database experience',
      'How do you handle asynchronous programming in Python?',
      'Describe your approach to error handling',
      'What testing frameworks do you use?',
    ],
    createdAt: new Date('2025-01-04'),
  },
  'job-3': {
    id: 'job-3',
    title: 'DevOps Engineer',
    company: 'Vercel',
    description: 'Seeking a DevOps engineer to manage our cloud infrastructure...',
    employerId: 'employer-1',
    questions: [
      'What is your experience with AWS or other cloud platforms?',
      'How do you approach CI/CD pipeline design?',
      'Tell me about your experience with containerization',
      'How do you handle infrastructure as code?',
      'Describe a challenging production issue you resolved',
    ],
    createdAt: new Date('2025-01-05'),
  },
};

// Mock Interviews (in-memory store)
export const mockInterviews: Record<string, Interview> = {
  'interview-1': {
    id: 'interview-1',
    jobId: 'job-1',
    candidateId: 'candidate-1',
    status: 'PENDING',
    createdAt: new Date('2025-01-08'),
  },
  'interview-2': {
    id: 'interview-2',
    jobId: 'job-2',
    candidateId: 'candidate-2',
    status: 'PENDING',
    createdAt: new Date('2025-01-08'),
  },
  'interview-3': {
    id: 'interview-3',
    jobId: 'job-3',
    candidateId: 'candidate-3',
    status: 'PENDING',
    createdAt: new Date('2025-01-08'),
  },
  'interview-4': {
    id: 'interview-4',
    jobId: 'job-1',
    candidateId: 'candidate-4',
    status: 'PENDING',
    createdAt: new Date('2025-01-08'),
  },
  'interview-5': {
    id: 'interview-5',
    jobId: 'job-2',
    candidateId: 'candidate-5',
    status: 'PENDING',
    createdAt: new Date('2025-01-09'),
  },
  'interview-6': {
    id: 'interview-6',
    jobId: 'job-1',
    candidateId: 'candidate-2',
    status: 'COMPLETED',
    callId: 'call-completed-1',
    score: 85,
    createdAt: new Date('2025-01-07'),
  },
  'interview-7': {
    id: 'interview-7',
    jobId: 'job-3',
    candidateId: 'candidate-1',
    status: 'IN_PROGRESS',
    callId: 'call-in-progress-1',
    createdAt: new Date('2025-01-09'),
  },
};

// Helper functions
export function getUserById(id: string): User | undefined {
  return mockUsers[id];
}

export function getJobById(id: string): Job | undefined {
  return mockJobs[id];
}

export function getInterviewById(id: string): Interview | undefined {
  return mockInterviews[id];
}

export function createInterview(jobId: string, candidateId: string): Interview {
  const id = `interview-${Date.now()}`;
  const interview: Interview = {
    id,
    jobId,
    candidateId,
    status: 'PENDING',
    createdAt: new Date(),
  };
  mockInterviews[id] = interview;
  return interview;
}

export function updateInterview(id: string, updates: Partial<Interview>): Interview | undefined {
  const interview = mockInterviews[id];
  if (interview === undefined) {
    return undefined;
  }
  mockInterviews[id] = { ...interview, ...updates };
  return mockInterviews[id];
}

export function getAllJobs(): Job[] {
  return Object.values(mockJobs);
}

export function getAllInterviews(): Interview[] {
  return Object.values(mockInterviews);
}
