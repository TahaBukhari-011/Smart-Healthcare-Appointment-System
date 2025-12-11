// Event types for the event-driven architecture

export type EventType =
  | 'APPOINTMENT_BOOKED'
  | 'APPOINTMENT_APPROVED'
  | 'APPOINTMENT_REJECTED'
  | 'APPOINTMENT_CANCELLED'
  | 'APPOINTMENT_COMPLETED';

export interface AppointmentEventPayload {
  appointmentId: string;
  patientId: string;
  doctorId: string;
  patientName: string;
  doctorName: string;
  date: string;
  timeSlot: string;
  status: string;
  reason?: string;
}

export interface EventMessage {
  type: EventType;
  payload: AppointmentEventPayload;
  timestamp: Date;
  id: string;
}

type EventHandler = (event: EventMessage) => Promise<void>;

/**
 * Simple in-memory Event Bus for event-driven architecture
 * In production, this could be replaced with Redis Pub/Sub, RabbitMQ, or Kafka
 */
class EventBus {
  private handlers: Map<EventType, EventHandler[]> = new Map();
  private eventLog: EventMessage[] = [];

  /**
   * Subscribe to an event type
   */
  subscribe(eventType: EventType, handler: EventHandler): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
    console.log(`[EventBus] Subscribed to ${eventType}`);

    // Return unsubscribe function
    return () => {
      const handlers = this.handlers.get(eventType);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) handlers.splice(index, 1);
      }
    };
  }

  /**
   * Emit an event to all subscribers
   */
  async emit(eventType: EventType, payload: AppointmentEventPayload): Promise<void> {
    const event: EventMessage = {
      type: eventType,
      payload,
      timestamp: new Date(),
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    // Log event
    this.eventLog.push(event);
    console.log(`[EventBus] Event emitted: ${eventType}`, { id: event.id });

    // Get handlers for this event type
    const handlers = this.handlers.get(eventType) || [];
    
    if (handlers.length === 0) {
      console.log(`[EventBus] No handlers for ${eventType}`);
      return;
    }

    // Execute all handlers in parallel
    const results = await Promise.allSettled(
      handlers.map(handler => handler(event))
    );

    // Log any errors
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`[EventBus] Handler ${index} failed for ${eventType}:`, result.reason);
      }
    });
  }

  /**
   * Get event log (for debugging)
   */
  getEventLog(): EventMessage[] {
    return [...this.eventLog];
  }

  /**
   * Clear event log
   */
  clearEventLog(): void {
    this.eventLog = [];
  }
}

// Singleton instance - shared across all services
const eventBus = new EventBus();
export default eventBus;
