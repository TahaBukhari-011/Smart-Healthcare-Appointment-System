// Shared types for the healthcare system

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'patient' | 'doctor';
  specialization?: string;
  phone?: string;
  createdAt: Date;
}

export interface UserPayload {
  id: string;
  email: string;
  name: string;
  role: 'patient' | 'doctor';
  specialization?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  patientName: string;
  doctorName: string;
  date: Date;
  timeSlot: string;
  status: AppointmentStatus;
  reason: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type AppointmentStatus = 
  | 'pending' 
  | 'approved' 
  | 'rejected' 
  | 'completed' 
  | 'cancelled';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  metadata?: Record<string, string>;
  createdAt: Date;
}

export type NotificationType = 
  | 'appointment_booked'
  | 'appointment_approved'
  | 'appointment_rejected'
  | 'appointment_cancelled'
  | 'appointment_completed';

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

export interface AuthResponse extends ApiResponse<UserPayload> {
  token?: string;
}

export interface AppointmentsResponse extends ApiResponse<Appointment[]> {}

export interface NotificationsResponse extends ApiResponse<{
  notifications: Notification[];
  unreadCount: number;
}> {}
