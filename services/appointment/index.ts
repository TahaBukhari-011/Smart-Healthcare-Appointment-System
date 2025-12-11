import connectDB from '@/shared/db/connection';
import Appointment, { IAppointment } from './models/Appointment';
import eventBus, { AppointmentEventPayload, EventType } from '@/shared/events/eventBus';

// Available time slots
const TIME_SLOTS = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
  '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
  '04:00 PM', '04:30 PM', '05:00 PM',
];

export interface CreateAppointmentInput {
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  timeSlot: string;
  reason: string;
}

export interface UpdateAppointmentInput {
  status?: 'approved' | 'rejected' | 'completed' | 'cancelled';
  notes?: string;
}

export interface AppointmentResult {
  success: boolean;
  message: string;
  appointment?: IAppointment;
  appointments?: IAppointment[];
}

/**
 * APPOINTMENT MICROSERVICE
 * Handles appointment booking, management, and emits events
 */
class AppointmentService {
  /**
   * Create a new appointment
   * Emits: APPOINTMENT_BOOKED event
   */
  async createAppointment(input: CreateAppointmentInput): Promise<AppointmentResult> {
    try {
      await connectDB();

      // Check for conflicts
      const conflict = await Appointment.findOne({
        doctorId: input.doctorId,
        date: new Date(input.date),
        timeSlot: input.timeSlot,
        status: { $in: ['pending', 'approved'] },
      });

      if (conflict) {
        return { success: false, message: 'Time slot already booked' };
      }

      // Create appointment
      const appointment = await Appointment.create({
        patientId: input.patientId,
        patientName: input.patientName,
        doctorId: input.doctorId,
        doctorName: input.doctorName,
        date: new Date(input.date),
        timeSlot: input.timeSlot,
        reason: input.reason,
        status: 'pending',
      });

      console.log(`[AppointmentService] Appointment created: ${appointment._id}`);

      // EMIT EVENT: Appointment Booked
      await this.emitEvent('APPOINTMENT_BOOKED', appointment);

      return {
        success: true,
        message: 'Appointment booked successfully',
        appointment,
      };
    } catch (error: any) {
      console.error('[AppointmentService] Create error:', error);
      return { success: false, message: error.message || 'Failed to book appointment' };
    }
  }

  /**
   * Update appointment status
   * Emits: APPOINTMENT_APPROVED, APPOINTMENT_REJECTED, APPOINTMENT_CANCELLED, APPOINTMENT_COMPLETED
   */
  async updateAppointment(
    appointmentId: string,
    input: UpdateAppointmentInput,
    userId: string
  ): Promise<AppointmentResult> {
    try {
      await connectDB();

      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) {
        return { success: false, message: 'Appointment not found' };
      }

      // Update fields
      if (input.status) {
        appointment.status = input.status;
      }
      if (input.notes !== undefined) {
        appointment.notes = input.notes;
      }

      await appointment.save();

      console.log(`[AppointmentService] Appointment updated: ${appointmentId} -> ${input.status}`);

      // EMIT EVENTS based on status change
      if (input.status) {
        const eventMap: Record<string, EventType> = {
          approved: 'APPOINTMENT_APPROVED',
          rejected: 'APPOINTMENT_REJECTED',
          cancelled: 'APPOINTMENT_CANCELLED',
          completed: 'APPOINTMENT_COMPLETED',
        };
        const eventType = eventMap[input.status];
        if (eventType) {
          await this.emitEvent(eventType, appointment);
        }
      }

      return {
        success: true,
        message: 'Appointment updated successfully',
        appointment,
      };
    } catch (error: any) {
      console.error('[AppointmentService] Update error:', error);
      return { success: false, message: error.message || 'Failed to update appointment' };
    }
  }

  /**
   * Get appointments for a patient
   */
  async getPatientAppointments(patientId: string): Promise<AppointmentResult> {
    try {
      await connectDB();
      const appointments = await Appointment.find({ patientId }).sort({ date: -1 });
      return { success: true, message: 'Success', appointments };
    } catch (error: any) {
      console.error('[AppointmentService] Get patient appointments error:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get appointments for a doctor
   */
  async getDoctorAppointments(doctorId: string): Promise<AppointmentResult> {
    try {
      await connectDB();
      const appointments = await Appointment.find({ doctorId }).sort({ date: -1 });
      return { success: true, message: 'Success', appointments };
    } catch (error: any) {
      console.error('[AppointmentService] Get doctor appointments error:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get single appointment by ID
   */
  async getAppointmentById(appointmentId: string): Promise<AppointmentResult> {
    try {
      await connectDB();
      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) {
        return { success: false, message: 'Appointment not found' };
      }
      return { success: true, message: 'Success', appointment };
    } catch (error: any) {
      console.error('[AppointmentService] Get appointment error:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get available time slots for a doctor on a specific date
   */
  async getAvailableSlots(doctorId: string, date: string): Promise<string[]> {
    try {
      await connectDB();

      const bookedAppointments = await Appointment.find({
        doctorId,
        date: new Date(date),
        status: { $in: ['pending', 'approved'] },
      }).select('timeSlot');

      const bookedSlots = bookedAppointments.map((a: IAppointment) => a.timeSlot);
      return TIME_SLOTS.filter((slot) => !bookedSlots.includes(slot));
    } catch (error) {
      console.error('[AppointmentService] Get slots error:', error);
      return TIME_SLOTS; // Return all slots if error
    }
  }

  /**
   * Emit event to the Event Bus
   */
  private async emitEvent(eventType: EventType, appointment: IAppointment): Promise<void> {
    const payload: AppointmentEventPayload = {
      appointmentId: appointment._id.toString(),
      patientId: appointment.patientId.toString(),
      doctorId: appointment.doctorId.toString(),
      patientName: appointment.patientName,
      doctorName: appointment.doctorName,
      date: appointment.date.toISOString(),
      timeSlot: appointment.timeSlot,
      status: appointment.status,
      reason: appointment.reason,
    };

    await eventBus.emit(eventType, payload);
  }
}

// Export singleton instance
const appointmentService = new AppointmentService();
export default appointmentService;
