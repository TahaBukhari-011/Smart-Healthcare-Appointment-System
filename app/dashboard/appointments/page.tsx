'use client';

import { useEffect, useState } from 'react';

interface User {
  id: string;
  role: 'patient' | 'doctor';
}

interface Appointment {
  _id: string;
  patientId: string;
  doctorId: string;
  patientName: string;
  doctorName: string;
  date: string;
  timeSlot: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  reason: string;
  notes?: string;
}

export default function AppointmentsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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
        setAppointments(appointmentsData.appointments || []);
      }
    } catch (error) {
      console.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const updateAppointmentStatus = async (
    appointmentId: string,
    status: string
  ) => {
    setActionLoading(appointmentId);
    try {
      const res = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();
      if (data.success) {
        setAppointments(
          appointments.map((apt) =>
            apt._id === appointmentId ? { ...apt, status: status as Appointment['status'] } : apt
          )
        );
      }
    } catch (error) {
      console.error('Failed to update appointment');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredAppointments = appointments.filter((apt) =>
    filter === 'all' ? true : apt.status === filter
  );

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    completed: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-gray-100 text-gray-800',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
        <p className="text-gray-600 mt-1">
          {user?.role === 'doctor'
            ? 'Manage patient appointment requests'
            : 'View and manage your appointments'}
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['all', 'pending', 'approved', 'completed', 'rejected', 'cancelled'].map(
          (status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === status
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          )
        )}
      </div>

      {/* Appointments List */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {filteredAppointments.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <svg
              className="w-12 h-12 mx-auto mb-4 text-gray-300"
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
            <p>No appointments found</p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredAppointments.map((appointment) => (
              <div key={appointment._id} className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">
                        {user?.role === 'doctor'
                          ? appointment.patientName
                          : `Dr. ${appointment.doctorName}`}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          statusColors[appointment.status]
                        }`}
                      >
                        {appointment.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <svg
                          className="w-4 h-4"
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
                        {new Date(appointment.date).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg
                          className="w-4 h-4"
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
                        {appointment.timeSlot}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      <strong>Reason:</strong> {appointment.reason}
                    </p>
                    {appointment.notes && (
                      <p className="text-sm text-gray-500 mt-1">
                        <strong>Notes:</strong> {appointment.notes}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {user?.role === 'doctor' && appointment.status === 'pending' && (
                      <>
                        <button
                          onClick={() =>
                            updateAppointmentStatus(appointment._id, 'approved')
                          }
                          disabled={actionLoading === appointment._id}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() =>
                            updateAppointmentStatus(appointment._id, 'rejected')
                          }
                          disabled={actionLoading === appointment._id}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {user?.role === 'doctor' && appointment.status === 'approved' && (
                      <button
                        onClick={() =>
                          updateAppointmentStatus(appointment._id, 'completed')
                        }
                        disabled={actionLoading === appointment._id}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
                      >
                        Mark Complete
                      </button>
                    )}
                    {user?.role === 'patient' &&
                      ['pending', 'approved'].includes(appointment.status) && (
                        <button
                          onClick={() =>
                            updateAppointmentStatus(appointment._id, 'cancelled')
                          }
                          disabled={actionLoading === appointment._id}
                          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
