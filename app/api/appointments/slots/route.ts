import { NextRequest, NextResponse } from 'next/server';
import appointmentService from '@/services/appointment';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get('doctorId');
    const date = searchParams.get('date');

    if (!doctorId || !date) {
      return NextResponse.json(
        { success: false, message: 'doctorId and date are required' },
        { status: 400 }
      );
    }

    // Call Appointment Microservice
    const slots = await appointmentService.getAvailableSlots(doctorId, date);

    return NextResponse.json({
      success: true,
      slots,
    });
  } catch (error: any) {
    console.error('[API] Get slots error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
