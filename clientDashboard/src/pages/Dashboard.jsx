import { useEffect, useState } from "react";
import { useAuthStore } from "../store/authStore";
import { useLibraryStore } from "../store/libraryStore";
import { useThemeStore } from "../store/themeStore";

function StatCard({ title, value, subtitle, icon, color }) {
  return (
    <div className="glass rounded-2xl p-6 shadow-lg card-hover">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className="text-3xl font-bold text-slate-800 mt-1">{value}</p>
          {subtitle && (
            <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div
          className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}
        >
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={icon}
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

function ActiveStudentRow({ student }) {
  const getInitials = (name) => {
    return (
      name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase() || "U"
    );
  };

  return (
    <tr className="hover:bg-slate-100/50">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-semibold">
            {getInitials(student.user?.name)}
          </div>
          <div>
            <p className="font-medium text-slate-800">
              {student.user?.name || "Unknown"}
            </p>
            <p className="text-xs text-slate-500">{student.user?.email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-slate-600">
        {student.user?.department || "-"}
      </td>
      <td className="px-4 py-3">
        <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-lg">
          {student.seat?.label || "N/A"}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-slate-600">
        {new Date(student.start_time).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </td>
      <td className="px-4 py-3 text-sm text-slate-600">
        {student.duration} min
      </td>
    </tr>
  );
}

export default function Dashboard() {
  const { library } = useAuthStore();
  const {
    stats,
    activeStudents,
    fetchStats,
    fetchActiveStudents,
    subscribeToSeats,
  } = useLibraryStore();
  const { theme, toggleTheme } = useThemeStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (library?.id) {
      const loadData = async () => {
        setIsLoading(true);
        await Promise.all([
          fetchStats(library.id),
          fetchActiveStudents(library.id),
        ]);
        setIsLoading(false);
      };
      loadData();

      // Subscribe to real-time updates
      const unsubscribe = subscribeToSeats(library.id);
      return () => unsubscribe?.();
    }
  }, [library?.id]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (library?.id) {
      const interval = setInterval(() => {
        fetchStats(library.id);
        fetchActiveStudents(library.id);
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [library?.id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 font-display">
            Dashboard
          </h1>
          <p className="text-slate-600">
            Welcome back! Here's your library overview.
          </p>
        </div>
        <div className="text-sm text-slate-500">
          Last updated: {new Date().toLocaleTimeString()}
        </div>

        {/* Theme Toggle Switch */}
        <button
          onClick={toggleTheme}
          className={`relative w-14 h-8 rounded-full transition-all duration-300 flex items-center ${theme === 'dark'
            ? 'bg-slate-700'
            : 'bg-yellow-200'
            }`}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {/* Toggle circle with icon inside */}
          <span className={`absolute w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 flex items-center justify-center ${theme === 'dark'
            ? 'translate-x-7'
            : 'translate-x-1'
            }`}>
            {theme === 'dark' ? (
              <svg className="w-4 h-4 text-indigo-950" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-orange-700" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
          </span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <StatCard
          title="Total Seats"
          value={stats?.totalSeats || 0}
          subtitle="Across all floors"
          icon="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z"
          color="bg-primary-500"
        />
        <StatCard
          title="Available"
          value={stats?.availableSeats || 0}
          subtitle={`${stats?.totalSeats ? Math.round((stats.availableSeats / stats.totalSeats) * 100) : 0}% of total`}
          icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          color="bg-green-500"
        />
        <StatCard
          title="Occupied"
          value={stats?.occupiedSeats || 0}
          subtitle={`${stats?.occupancyRate || 0}% occupancy rate`}
          icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          color="bg-red-500"
        />
        <StatCard
          title="Today's Bookings"
          value={stats?.todayBookings || 0}
          subtitle={`${stats?.checkedInUsers || 0} checked in`}
          icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          color="bg-yellow-500"
        />
        <StatCard
          title="Subscribed Students"
          value={stats?.subscribedStudents || 0}
          subtitle="Active subscriptions"
          icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
          color="bg-purple-500"
        />
      </div>

      {/* Library Status Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-1 glass rounded-2xl p-6 shadow-lg">
          <h3 className="font-semibold text-slate-800 mb-4">Library Status</h3>

          {/* Occupancy Ring */}
          <div className="flex items-center justify-center mb-4">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="#e2e8f0"
                  strokeWidth="12"
                  fill="none"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke={
                    stats?.occupancyRate > 80
                      ? "#ef4444"
                      : stats?.occupancyRate > 50
                        ? "#f59e0b"
                        : "#22c55e"
                  }
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${(stats?.occupancyRate || 0) * 3.52} 352`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-slate-800">
                  {stats?.occupancyRate || 0}%
                </span>
                <span className="text-xs text-slate-500">Occupancy</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                <span className="text-slate-600">Available</span>
              </div>
              <span className="font-medium text-slate-800">{stats?.availableSeats || 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <span className="text-slate-600">Occupied</span>
              </div>
              <span className="font-medium text-slate-800">{stats?.occupiedSeats || 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                <span className="text-slate-600">Reserved</span>
              </div>
              <span className="font-medium text-slate-800">{stats?.reservedSeats || 0}</span>
            </div>
          </div>
        </div>

        {/* Library Info */}
        <div className="lg:col-span-2 glass rounded-2xl p-6 shadow-lg">
          <h3 className="font-semibold text-slate-800 mb-4">
            Library Information
          </h3>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                Name
              </p>
              <p className="font-medium text-slate-800">{library?.name}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                Address
              </p>
              <p className="font-medium text-slate-800">
                {library?.address || "Not set"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                Opening Hours
              </p>
              <p className="font-medium text-slate-800">
                {library?.opening_time} - {library?.closing_time}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                Geofence Radius
              </p>
              <p className="font-medium text-slate-800">
                {library?.radius_meters}m
              </p>
            </div>
          </div>

          {library?.description && (
            <div className="mt-4 pt-4 border-t border-slate-200/50">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                Description
              </p>
              <p className="text-slate-600">{library.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Active Students Table */}
      <div className="glass rounded-2xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200/50 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">Active Students</h3>
          <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
            {activeStudents.length} checked in
          </span>
        </div>

        {activeStudents.length === 0 ? (
          <div className="p-8 text-center">
            <svg
              className="w-12 h-12 text-slate-300 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <p className="text-slate-500">No students currently checked in</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Seat
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Check-in
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Duration
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/50">
                {activeStudents.map((student) => (
                  <ActiveStudentRow key={student.id} student={student} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
