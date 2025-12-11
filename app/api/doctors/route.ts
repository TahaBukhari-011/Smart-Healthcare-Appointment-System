import { NextResponse } from 'next/server';
import authService from '@/services/auth';

export async function GET() {
  try {
    // Call Auth Microservice
    const doctors = await authService.getAllDoctors();

    return NextResponse.json({
      success: true,
      doctors,
    });
  } catch (error: any) {
    console.error('[API] Get doctors error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
