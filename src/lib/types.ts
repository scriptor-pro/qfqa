// Comprehensive type definitions for the QFQA application

export interface User {
  id: number;
  username: string;
  email: string;
  password_hash?: string; // Optional for frontend
  neurotype: 'TDAH' | 'Autiste' | 'Les deux';
  subscription_status: 'trial' | 'active' | 'inactive' | 'expired';
  subscription_plan: 'free' | 'basic' | 'premium';
  subscription_start?: string;
  subscription_end?: string;
  trial_end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface ScheduleElement {
  id: number;
  user_id: number;
  title: string;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  location?: string;
  is_external: boolean;
  travel_energy_cost: number; // 0-12
  energy_cost: number; // 1-12
  description?: string;
  created_at: string;
}

export interface FloatingTask {
  id: number;
  user_id: number;
  title: string;
  estimated_duration: number; // minutes
  energy_cost: number; // 1-12
  priority: number; // 1-10
  completed: boolean;
  scheduled_date?: string; // YYYY-MM-DD
  scheduled_time?: string; // HH:MM
  description?: string;
  created_at: string;
}

export interface EnergyLevel {
  id: number;
  user_id: number;
  date: string; // YYYY-MM-DD
  morning_energy?: number; // 1-12
  current_energy?: number; // 1-12
  notes?: string;
  created_at: string;
}

export interface SubscriptionPlan {
  id: number;
  name: string;
  price: number;
  billing_cycle: 'monthly' | 'yearly';
  max_tasks: number; // -1 for unlimited
  max_schedules: number; // -1 for unlimited
  features_json: string;
  created_at: string;
}

export interface Payment {
  id: number;
  user_id: number;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_date: string;
  stripe_payment_id?: string;
}

// Frontend-specific types
export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
}

export interface FormErrors {
  [key: string]: string[];
}

export interface APIResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
}

// Component prop types
export interface EnergyIndicatorProps {
  energy: number;
  interactive?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export interface TaskFormData {
  title: string;
  estimated_duration: number;
  energy_cost: number;
  priority: number;
  description?: string;
}

export interface ScheduleFormData {
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  location?: string;
  is_external: boolean;
  travel_energy_cost: number;
  energy_cost: number;
  description?: string;
}

export interface UserProfileFormData {
  username: string;
  email: string;
  neurotype: 'TDAH' | 'Autiste' | 'Les deux';
}

export interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  neurotype: 'TDAH' | 'Autiste' | 'Les deux';
}

export interface LoginFormData {
  username: string;
  password: string;
}

// Store types
export interface AppStore {
  user: User | null;
  tasks: FloatingTask[];
  scheduleElements: ScheduleElement[];
  energyLevels: EnergyLevel[];
  loading: boolean;
  error: string | null;
}

// Event types for custom dispatchers
export interface CustomEvents {
  energyChange: { energy: number };
  taskComplete: { taskId: number };
  scheduleUpdate: { element: ScheduleElement };
  taskScheduled: { task: FloatingTask; date: string; time: string };
}