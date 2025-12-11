import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import authService from '@/services/auth';
import appointmentService from '@/services/appointment';
// Import to initialize event listeners
import '@/services/notification';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    const user = authService.verifyToken(token);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    // Call Appointment Microservice based on user role
    let result;
    if (user.role === 'doctor') {
      result = await appointmentService.getDoctorAppointments(user.id);
    } else {
      result = await appointmentService.getPatientAppointments(user.id);
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[API] Get appointments error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    const user = authService.verifyToken(token);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    // Only patients can book appointments
    if (user.role !== 'patient') {
      return NextResponse.json(
        { success: false, message: 'Only patients can book appointments' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { doctorId, doctorName, date, timeSlot, reason } = body;

    if (!doctorId || !doctorName || !date || !timeSlot || !reason) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Call Appointment Microservice
    // This will emit APPOINTMENT_BOOKED event
    // Notification Microservice will receive and create notification
    const result = await appointmentService.createAppointment({
      patientId: user.id,
      patientName: user.name,
      doctorId,
      doctorName,
      date,
      timeSlot,
      reason,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('[API] Create appointment error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
