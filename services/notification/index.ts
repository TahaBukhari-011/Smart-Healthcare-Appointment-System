import connectDB from '@/shared/db/connection';
import Notification, { INotification } from './models/Notification';
import eventBus, { EventMessage } from '@/shared/events/eventBus';
import { NotificationType } from '@/shared/types';

export interface NotificationResult {
  success: boolean;
  message: string;
  notification?: INotification;
  notifications?: INotification[];
  unreadCount?: number;
}

/**
 * NOTIFICATION MICROSERVICE
 * Subscribes to appointment events and creates notifications
 * This is the event-driven consumer
 */
class NotificationService {
  private initialized = false;

  /**
   * Initialize event subscriptions
   * Must be called to start listening for events
   */
  initialize(): void {
    if (this.initialized) return;

    console.log('[NotificationService] Initializing event subscriptions...');

    // Subscribe to all appointment events
    eventBus.subscribe('APPOINTMENT_BOOKED', this.handleAppointmentBooked.bind(this));
    eventBus.subscribe('APPOINTMENT_APPROVED', this.handleAppointmentApproved.bind(this));
    eventBus.subscribe('APPOINTMENT_REJECTED', this.handleAppointmentRejected.bind(this));
    eventBus.subscribe('APPOINTMENT_CANCELLED', this.handleAppointmentCancelled.bind(this));
    eventBus.subscribe('APPOINTMENT_COMPLETED', this.handleAppointmentCompleted.bind(this));

    this.initialized = true;
    console.log('[NotificationService] Event subscriptions active');
  }

  /**
   * Handle APPOINTMENT_BOOKED event
   * Creates notification for the doctor
   */
  private async handleAppointmentBooked(event: EventMessage): Promise<void> {
    console.log('[NotificationService] Processing APPOINTMENT_BOOKED');
    const { payload } = event;

    await this.createNotification({
      userId: payload.doctorId,
      type: 'appointment_booked',
      title: 'New Appointment Request',
      message: `${payload.patientName} has requested an appointment on ${this.formatDate(payload.date)} at ${payload.timeSlot}`,
      metadata: {
        appointmentId: payload.appointmentId,
        patientName: payload.patientName,
        date: payload.date,
        timeSlot: payload.timeSlot,
      },
    });
  }

  /**
   * Handle APPOINTMENT_APPROVED event
   * Creates notification for the patient
   */
  private async handleAppointmentApproved(event: EventMessage): Promise<void> {
    console.log('[NotificationService] Processing APPOINTMENT_APPROVED');
    const { payload } = event;

    await this.createNotification({
      userId: payload.patientId,
      type: 'appointment_approved',
      title: 'Appointment Approved!',
      message: `Your appointment with Dr. ${payload.doctorName} on ${this.formatDate(payload.date)} at ${payload.timeSlot} has been approved`,
      metadata: {
        appointmentId: payload.appointmentId,
        doctorName: payload.doctorName,
        date: payload.date,
        timeSlot: payload.timeSlot,
      },
    });
  }

  /**
   * Handle APPOINTMENT_REJECTED event
   * Creates notification for the patient
   */
  private async handleAppointmentRejected(event: EventMessage): Promise<void> {
    console.log('[NotificationService] Processing APPOINTMENT_REJECTED');
    const { payload } = event;

    await this.createNotification({
      userId: payload.patientId,
      type: 'appointment_rejected',
      title: 'Appointment Rejected',
      message: `Your appointment request with Dr. ${payload.doctorName} on ${this.formatDate(payload.date)} at ${payload.timeSlot} was not approved`,
      metadata: {
        appointmentId: payload.appointmentId,
        doctorName: payload.doctorName,
        date: payload.date,
        timeSlot: payload.timeSlot,
      },
    });
  }

  /**
   * Handle APPOINTMENT_CANCELLED event
   * Creates notifications for both patient and doctor
   */
  private async handleAppointmentCancelled(event: EventMessage): Promise<void> {
    console.log('[NotificationService] Processing APPOINTMENT_CANCELLED');
    const { payload } = event;

    // Notify patient
    await this.createNotification({
      userId: payload.patientId,
      type: 'appointment_cancelled',
      title: 'Appointment Cancelled',
      message: `Your appointment with Dr. ${payload.doctorName} on ${this.formatDate(payload.date)} at ${payload.timeSlot} has been cancelled`,
      metadata: {
        appointmentId: payload.appointmentId,
        doctorName: payload.doctorName,
        date: payload.date,
        timeSlot: payload.timeSlot,
      },
    });

    // Notify doctor
    await this.createNotification({
      userId: payload.doctorId,
      type: 'appointment_cancelled',
      title: 'Appointment Cancelled',
      message: `Appointment with ${payload.patientName} on ${this.formatDate(payload.date)} at ${payload.timeSlot} was cancelled`,
      metadata: {
        appointmentId: payload.appointmentId,
        patientName: payload.patientName,
        date: payload.date,
        timeSlot: payload.timeSlot,
      },
    });
  }

  /**
   * Handle APPOINTMENT_COMPLETED event
   * Creates notification for the patient
   */
  private async handleAppointmentCompleted(event: EventMessage): Promise<void> {
    console.log('[NotificationService] Processing APPOINTMENT_COMPLETED');
    const { payload } = event;

    await this.createNotification({
      userId: payload.patientId,
      type: 'appointment_completed',
      title: 'Appointment Completed',
      message: `Your appointment with Dr. ${payload.doctorName} has been completed. Thank you!`,
      metadata: {
        appointmentId: payload.appointmentId,
        doctorName: payload.doctorName,
        date: payload.date,
        timeSlot: payload.timeSlot,
      },
    });
  }

  /**
   * Create a notification in the database
   */
  private async createNotification(data: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    metadata?: INotification['metadata'];
  }): Promise<INotification | null> {
    try {
      await connectDB();

      const notification = await Notification.create({
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        metadata: data.metadata,
        read: false,
      });

      console.log(`[NotificationService] Notification created for user: ${data.userId}`);
      return notification;
    } catch (error) {
      console.error('[NotificationService] Create notification error:', error);
      return null;
    }
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(userId: string, limit = 20): Promise<NotificationResult> {
    try {
      await connectDB();

      const notifications = await Notification.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit);

      const unreadCount = await Notification.countDocuments({ userId, read: false });

      return {
        success: true,
        message: 'Success',
        notifications,
        unreadCount,
      };
    } catch (error: any) {
      console.error('[NotificationService] Get notifications error:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<NotificationResult> {
    try {
      await connectDB();

      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, userId },
        { read: true },
        { new: true }
      );

      if (!notification) {
        return { success: false, message: 'Notification not found' };
      }

      return { success: true, message: 'Marked as read', notification };
    } catch (error: any) {
      console.error('[NotificationService] Mark as read error:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<NotificationResult> {
    try {
      await connectDB();

      await Notification.updateMany({ userId, read: false }, { read: true });

      return { success: true, message: 'All notifications marked as read' };
    } catch (error: any) {
      console.error('[NotificationService] Mark all as read error:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Format date for display
   */
  private formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }
}

// Export singleton instance
const notificationService = new NotificationService();

// Initialize on import - start listening for events
notificationService.initialize();

export default notificationService;
