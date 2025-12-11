import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import authService from '@/services/auth';
import notificationService from '@/services/notification';

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

    // Call Notification Microservice
    const result = await notificationService.getUserNotifications(user.id);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[API] Get notifications error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
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

    const body = await request.json();
    const { notificationId, markAll } = body;

    let result;
    if (markAll) {
      result = await notificationService.markAllAsRead(user.id);
    } else if (notificationId) {
      result = await notificationService.markAsRead(notificationId, user.id);
    } else {
      return NextResponse.json(
        { success: false, message: 'notificationId or markAll required' },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[API] Update notification error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
