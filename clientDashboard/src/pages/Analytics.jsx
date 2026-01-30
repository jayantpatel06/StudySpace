import { useEffect, useState } from "react";
import { useAuthStore } from "../store/authStore";
import { useThemeStore } from "../store/themeStore";
import { supabase } from "../config/supabase";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

export default function Analytics() {
  const { theme } = useThemeStore();
  const { library } = useAuthStore();
  const isDark = theme === "dark";
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState("7"); // days
  const [bookingsData, setBookingsData] = useState([]);
  const [occupancyData, setOccupancyData] = useState([]);
  const [peakHoursData, setPeakHoursData] = useState([]);
  const [departmentData, setDepartmentData] = useState([]);

  useEffect(() => {
    if (library?.id) {
      fetchAnalytics();
    }
  }, [library?.id, dateRange]);

  const fetchAnalytics = async () => {
    setIsLoading(true);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(dateRange));

    try {
      // Fetch bookings for the date range
      const { data: bookings } = await supabase
        .from("bookings")
        .select("*, user:users(department)")
        .eq("library_id", library.id)
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: true });

      if (bookings) {
        // Process daily bookings
        const dailyBookings = {};
        const hourlyBookings = Array(24).fill(0);
        const departments = {};

        bookings.forEach((booking) => {
          // Daily bookings
          const date = new Date(booking.created_at).toLocaleDateString();
          dailyBookings[date] = (dailyBookings[date] || 0) + 1;

          // Peak hours
          const hour = new Date(booking.start_time).getHours();
          hourlyBookings[hour]++;

          // Department breakdown
          const dept = booking.user?.department || "Unknown";
          departments[dept] = (departments[dept] || 0) + 1;
        });

        // Format for charts
        const labels = Object.keys(dailyBookings);
        const values = Object.values(dailyBookings);
        setBookingsData({ labels, values });

        // Peak hours (8 AM to 10 PM)
        setPeakHoursData({
          labels: Array.from({ length: 14 }, (_, i) => `${(i + 8) % 24}:00`),
          values: hourlyBookings.slice(8, 22),
        });

        // Department breakdown
        const deptLabels = Object.keys(departments).slice(0, 6);
        const deptValues = deptLabels.map((d) => departments[d]);
        setDepartmentData({ labels: deptLabels, values: deptValues });
      }

      // Fetch occupancy snapshots (simulated from current seat data)
      const { data: seats } = await supabase
        .from("seats")
        .select("status")
        .eq("library_id", library.id);

      if (seats) {
        const occupied = seats.filter((s) => s.status === "occupied").length;
        const available = seats.filter((s) => s.status === "available").length;
        const reserved = seats.filter((s) => s.status === "reserved").length;
        setOccupancyData({
          occupied,
          available,
          reserved,
          total: seats.length,
        });
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    }

    setIsLoading(false);
  };

  const bookingsChartData = {
    labels: bookingsData.labels || [],
    datasets: [
      {
        label: "Daily Bookings",
        data: bookingsData.values || [],
        fill: true,
        backgroundColor: "rgba(14, 165, 233, 0.1)",
        borderColor: "rgba(14, 165, 233, 1)",
        borderWidth: 2,
        tension: 0.4,
        pointBackgroundColor: "rgba(14, 165, 233, 1)",
        pointRadius: 4,
      },
    ],
  };

  const peakHoursChartData = {
    labels: peakHoursData.labels || [],
    datasets: [
      {
        label: "Bookings",
        data: peakHoursData.values || [],
        backgroundColor: "rgba(139, 92, 246, 0.8)",
        borderRadius: 8,
      },
    ],
  };

  const occupancyChartData = {
    labels: ["Occupied", "Available", "Reserved"],
    datasets: [
      {
        data: [
          occupancyData.occupied || 0,
          occupancyData.available || 0,
          occupancyData.reserved || 0,
        ],
        backgroundColor: ["#ef4444", "#22c55e", "#f59e0b"],
        borderWidth: 0,
      },
    ],
  };

  const departmentChartData = {
    labels: departmentData.labels || [],
    datasets: [
      {
        label: "Bookings by Department",
        data: departmentData.values || [],
        backgroundColor: [
          "rgba(14, 165, 233, 0.8)",
          "rgba(139, 92, 246, 0.8)",
          "rgba(34, 197, 94, 0.8)",
          "rgba(245, 158, 11, 0.8)",
          "rgba(239, 68, 68, 0.8)",
          "rgba(107, 114, 128, 0.8)",
        ],
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true, // Restored legend display
      },
    },
    scales: {
      x: {
        grid: {
          display: true, // Restored x-axis grid display
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
      },
    },
  };

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
            Analytics
          </h1>
          <p className="text-slate-600">
            Track your library's performance and usage patterns
          </p>
        </div>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className={`px-4 py-2 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none ${isDark
            ? "bg-slate-700 border-slate-600 text-white"
            : "border-slate-200"
            }`}
        >
          <option value="7">Last 7 days</option>
          <option value="14">Last 14 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="glass rounded-2xl p-6 shadow-lg card-hover">
          <p className="text-sm text-slate-500 mb-1">Total Bookings</p>
          <p className="text-3xl font-bold text-slate-800">
            {bookingsData.values?.reduce((a, b) => a + b, 0) || 0}
          </p>
          <p className="text-xs text-slate-400 mt-1">in selected period</p>
        </div>
        <div className="glass rounded-2xl p-6 shadow-lg card-hover">
          <p className="text-sm text-slate-500 mb-1">Avg Daily Bookings</p>
          <p className="text-3xl font-bold text-slate-800">
            {bookingsData.values?.length > 0
              ? Math.round(
                bookingsData.values.reduce((a, b) => a + b, 0) /
                bookingsData.values.length,
              )
              : 0}
          </p>
          <p className="text-xs text-slate-400 mt-1">per day</p>
        </div>
        <div className="glass rounded-2xl p-6 shadow-lg card-hover">
          <p className="text-sm text-slate-500 mb-1">Current Occupancy</p>
          <p className="text-3xl font-bold text-slate-800">
            {occupancyData.total > 0
              ? Math.round((occupancyData.occupied / occupancyData.total) * 100)
              : 0}
            %
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {occupancyData.occupied} of {occupancyData.total} seats
          </p>
        </div>
        <div className="glass rounded-2xl p-6 shadow-lg card-hover">
          <p className="text-sm text-slate-500 mb-1">Peak Hour</p>
          <p className="text-3xl font-bold text-slate-800">
            {peakHoursData.values?.length > 0
              ? `${peakHoursData.labels[peakHoursData.values.indexOf(Math.max(...peakHoursData.values))]}`
              : "N/A"}
          </p>
          <p className="text-xs text-slate-400 mt-1">busiest time</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Bookings Trend */}
        <div className="glass rounded-2xl p-6 shadow-lg">
          <h3 className="font-semibold text-slate-800 mb-4">Booking Trends</h3>
          <div className="h-64">
            <Line data={bookingsChartData} options={chartOptions} />
          </div>
        </div>

        {/* Peak Hours */}
        <div className="glass rounded-2xl p-6 shadow-lg">
          <h3 className="font-semibold text-slate-800 mb-4">Peak Hours</h3>
          <div className="h-64">
            <Bar data={peakHoursChartData} options={chartOptions} />
          </div>
        </div>

        {/* Current Occupancy */}
        <div className="glass rounded-2xl p-6 shadow-lg">
          <h3 className="font-semibold text-slate-800 mb-4">
            Current Seat Distribution
          </h3>
          <div className="flex items-center justify-center gap-8">
            {/* Larger Doughnut Chart */}
            <div className="w-56 h-56">
              <Doughnut
                data={occupancyChartData}
                options={{
                  ...chartOptions,
                  cutout: "65%",
                  scales: {
                    x: { display: false },
                    y: { display: false },
                  },
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                }}
              />
            </div>
            {/* Circular Progress Icons */}
            <div className="flex flex-col gap-4">
              {/* Occupied */}
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12">
                  <svg className="w-12 h-12 -rotate-90">
                    <circle cx="24" cy="24" r="20" fill="none" stroke="#fee2e2" strokeWidth="4" />
                    <circle
                      cx="24" cy="24" r="20" fill="none" stroke="#ef4444" strokeWidth="4"
                      strokeDasharray={`${(occupancyData.occupied / (occupancyData.total || 1)) * 125.6} 125.6`}
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Occupied</p>
                  <p className="text-xs text-slate-500">{occupancyData.occupied || 0} seats</p>
                </div>
              </div>
              {/* Available */}
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12">
                  <svg className="w-12 h-12 -rotate-90">
                    <circle cx="24" cy="24" r="20" fill="none" stroke="#dcfce7" strokeWidth="4" />
                    <circle
                      cx="24" cy="24" r="20" fill="none" stroke="#22c55e" strokeWidth="4"
                      strokeDasharray={`${(occupancyData.available / (occupancyData.total || 1)) * 125.6} 125.6`}
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Available</p>
                  <p className="text-xs text-slate-500">{occupancyData.available || 0} seats</p>
                </div>
              </div>
              {/* Reserved */}
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12">
                  <svg className="w-12 h-12 -rotate-90">
                    <circle cx="24" cy="24" r="20" fill="none" stroke="#fef3c7" strokeWidth="4" />
                    <circle
                      cx="24" cy="24" r="20" fill="none" stroke="#f59e0b" strokeWidth="4"
                      strokeDasharray={`${(occupancyData.reserved / (occupancyData.total || 1)) * 125.6} 125.6`}
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Reserved</p>
                  <p className="text-xs text-slate-500">{occupancyData.reserved || 0} seats</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Department Breakdown */}
        <div className="glass rounded-2xl p-6 shadow-lg">
          <h3 className="font-semibold text-slate-800 mb-4">
            Bookings by Department
          </h3>
          <div className="h-64">
            <Bar
              data={departmentChartData}
              options={{
                ...chartOptions,
                indexAxis: "y",
              }}
            />
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="glass rounded-2xl p-6 shadow-lg">
        <h3 className="font-semibold text-slate-800 mb-4">Quick Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900">Usage Trend</p>
                <p className="text-xs text-blue-700">
                  {bookingsData.values?.length >= 2
                    ? bookingsData.values[bookingsData.values.length - 1] >
                      bookingsData.values[0]
                      ? "Increasing"
                      : "Decreasing"
                    : "Not enough data"}
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-green-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-green-600"
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
              <div>
                <p className="text-sm font-medium text-green-900">
                  Available Now
                </p>
                <p className="text-xs text-green-700">
                  {occupancyData.available || 0} seats ready
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-purple-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-purple-600"
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
              <div>
                <p className="text-sm font-medium text-purple-900">Best Time</p>
                <p className="text-xs text-purple-700">
                  {peakHoursData.values?.length > 0
                    ? `Low traffic before ${peakHoursData.labels[peakHoursData.values.indexOf(Math.max(...peakHoursData.values))]}`
                    : "Anytime"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
