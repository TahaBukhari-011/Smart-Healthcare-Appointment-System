'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface User {
  id: string;
  name: string;
  role: 'patient' | 'doctor';
}

interface Appointment {
  _id: string;
  patientName: string;
  doctorName: string;
  date: string;
  timeSlot: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  reason: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    completed: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [userRes, appointmentsRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/appointments'),
      ]);

      const userData = await userRes.json();
      const appointmentsData = await appointmentsRes.json();

      if (userData.success) setUser(userData.user);
      if (appointmentsData.success) {
        const appts = appointmentsData.appointments || [];
        setAppointments(appts);
        setStats({
          total: appts.length,
          pending: appts.filter((a: Appointment) => a.status === 'pending').length,
          approved: appts.filter((a: Appointment) => a.status === 'approved').length,
          completed: appts.filter((a: Appointment) => a.status === 'completed').length,
        });
      }
    } catch (error) {
      console.error('Failed to fetch data');
    }
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    completed: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-gray-100 text-gray-800',
  };

  const upcomingAppointments = appointments
    .filter((a) => ['pending', 'approved'].includes(a.status))
    .slice(0, 5);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-600 mt-1">
          {user?.role === 'doctor'
            ? 'Manage your appointments and patient requests'
            : 'View and manage your healthcare appointments'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Appointments</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-primary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Approved</p>
              <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-3xl font-bold text-blue-600">{stats.completed}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {user?.role === 'patient' && (
          <Link
            href="/dashboard/book"
            className="bg-primary-600 text-white rounded-xl p-6 hover:bg-primary-700 transition"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Book New Appointment</h3>
                <p className="text-white/80 text-sm">
                  Schedule a visit with a doctor
                </p>
              </div>
            </div>
          </Link>
        )}

        <Link
          href="/dashboard/appointments"
          className="bg-white border rounded-xl p-6 hover:border-primary-300 transition"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-primary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-900">
                View All Appointments
              </h3>
              <p className="text-gray-600 text-sm">
                See your appointment history
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Upcoming Appointments */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            Upcoming Appointments
          </h2>
        </div>
        <div className="divide-y">
          {upcomingAppointments.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No upcoming appointments
            </div>
          ) : (
            upcomingAppointments.map((appointment) => (
              <div
                key={appointment._id}
                className="p-6 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {user?.role === 'doctor'
                      ? appointment.patientName
                      : `Dr. ${appointment.doctorName}`}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(appointment.date).toLocaleDateString()} at{' '}
                    {appointment.timeSlot}
                  </p>
                  <p className="text-sm text-gray-500">{appointment.reason}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    statusColors[appointment.status]
                  }`}
                >
                  {appointment.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
