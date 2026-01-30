import { useEffect, useState, useMemo } from "react";
import { useAuthStore } from "../store/authStore";
import { useLibraryStore } from "../store/libraryStore";
import { useThemeStore } from "../store/themeStore";
import toast from "react-hot-toast";

function AddStudentModal({ isOpen, onClose, onAdd }) {
  const { theme } = useThemeStore();
  const [studentCode, setStudentCode] = useState("");
  const [notes, setNotes] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [hasExpiration, setHasExpiration] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isDark = theme === "dark";

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!studentCode.trim()) {
      toast.error("Please enter a student code");
      return;
    }
    if (hasExpiration && !expiresAt) {
      toast.error("Please select an expiration date");
      return;
    }
    setIsLoading(true);
    const result = await onAdd({
      studentCode: studentCode.trim().toUpperCase(),
      notes,
      expiresAt: hasExpiration ? new Date(expiresAt).toISOString() : null
    });
    setIsLoading(false);
    if (result.success) {
      setStudentCode("");
      setNotes("");
      setExpiresAt("");
      setHasExpiration(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className={`rounded-2xl p-6 w-full max-w-md mx-4 ${isDark ? "bg-slate-800" : "bg-white"}`}>
        <h3 className={`text-lg font-semibold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
          Add Student Subscription
        </h3>
        <p className={`text-sm mb-4 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
          Enter the student's unique code to subscribe them to your library.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
              Student Code *
            </label>
            <input
              type="text"
              value={studentCode}
              onChange={(e) => setStudentCode(e.target.value.toUpperCase())}
              className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none font-mono text-lg tracking-wider ${isDark
                ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                : "bg-white border-slate-200 text-slate-900"
                }`}
              placeholder="e.g., STU1A2B3C"
              maxLength={10}
            />
          </div>

          {/* Expiration Toggle */}
          <div className={`flex items-center justify-between p-3 rounded-xl ${isDark ? "bg-slate-700" : "bg-slate-50"}`}>
            <div>
              <p className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>Set Expiration Date</p>
              <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Subscription will auto-expire</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={hasExpiration}
                onChange={(e) => setHasExpiration(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          {/* Expiration Date Picker */}
          {hasExpiration && (
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                Expires On *
              </label>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                min={today}
                className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none ${isDark
                  ? "bg-slate-700 border-slate-600 text-white"
                  : "bg-white border-slate-200 text-slate-900"
                  }`}
              />
              <p className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Student will lose access after this date
              </p>
            </div>
          )}

          <div>
            <label className={`block text-sm font-medium mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none ${isDark
                ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                : "bg-white border-slate-200 text-slate-900"
                }`}
              placeholder="Add any notes about this student..."
              rows={2}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-4 py-2.5 border rounded-xl font-medium ${isDark
                ? "border-slate-600 text-slate-300 hover:bg-slate-700"
                : "border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 disabled:opacity-50"
            >
              {isLoading ? "Adding..." : "Add Student"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StudentRow({ student, onRemove }) {
  const [isRemoving, setIsRemoving] = useState(false);

  const getInitials = (name) => {
    return (
      name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase() || "U"
    );
  };

  const handleRemove = async () => {
    if (!confirm("Are you sure you want to remove this student's subscription?")) {
      return;
    }
    setIsRemoving(true);
    await onRemove(student.id);
    setIsRemoving(false);
  };

  // Check if subscription is expired
  const isExpired = student.expires_at && new Date(student.expires_at) < new Date();
  const isActive = student.status === "active" && !isExpired;

  // Calculate status display
  const getStatusDisplay = () => {
    if (student.status === "cancelled") return { text: "Cancelled", color: "bg-red-100 text-red-700" };
    if (isExpired) return { text: "Expired", color: "bg-orange-100 text-orange-700" };
    if (student.status === "active") return { text: "Active", color: "bg-green-100 text-green-700" };
    return { text: student.status, color: "bg-slate-100 text-slate-700" };
  };

  const statusDisplay = getStatusDisplay();

  // Format expiration date
  const formatExpiration = () => {
    if (!student.expires_at) return "Never";
    const date = new Date(student.expires_at);
    const now = new Date();
    const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24));

    if (isExpired) {
      return `Expired ${date.toLocaleDateString()}`;
    }
    if (diffDays <= 7) {
      return `${diffDays} day${diffDays === 1 ? '' : 's'} left`;
    }
    return date.toLocaleDateString();
  };

  return (
    <tr className={`${isExpired ? 'opacity-60' : ''}`}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-semibold">
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
      <td className="px-4 py-3">
        <span className="font-mono text-sm text-slate-900 font-semibold bg-slate-100 px-2 py-1 rounded">
          {student.user?.student_code || "-"}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-slate-600">
        {student.user?.department || "-"}
      </td>
      <td className="px-4 py-3">
        <span className={`px-2 py-1 text-xs font-medium rounded-lg ${statusDisplay.color}`}>
          {statusDisplay.text}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-slate-600">
        {new Date(student.subscribed_at).toLocaleDateString()}
      </td>
      <td className="px-4 py-3">
        <span className={`text-sm ${isExpired ? 'text-orange-600 font-medium' : 'text-slate-600'}`}>
          {formatExpiration()}
        </span>
      </td>
      <td className="px-4 py-3">
        {isActive ? (
          <button
            onClick={handleRemove}
            disabled={isRemoving}
            className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50"
          >
            {isRemoving ? "Removing..." : "Remove"}
          </button>
        ) : (
          <span className="text-slate-400 text-sm">—</span>
        )}
      </td>
    </tr>
  );
}

export default function StudentManagement() {
  const { theme } = useThemeStore();
  const { library, client } = useAuthStore();
  const {
    subscribedStudents,
    activeStudents,
    fetchSubscribedStudents,
    fetchActiveStudents,
    addStudentSubscription,
    removeStudentSubscription,
    subscribeToSubscriptions,
  } = useLibraryStore();

  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const isDark = theme === "dark";

  useEffect(() => {
    if (library?.id) {
      const loadData = async () => {
        setIsLoading(true);
        await Promise.all([
          fetchSubscribedStudents(library.id),
          fetchActiveStudents(library.id),
        ]);
        setIsLoading(false);
      };
      loadData();

      // Subscribe to real-time updates
      const unsubscribe = subscribeToSubscriptions(library.id);
      return () => unsubscribe?.();
    }
  }, [library?.id]);

  const handleAddStudent = async ({ studentCode, notes, expiresAt }) => {
    const result = await addStudentSubscription(library.id, studentCode, client?.id, notes, expiresAt);
    if (result.error) {
      toast.error(result.error);
      return { success: false };
    }
    toast.success("Student subscribed successfully!");
    return { success: true };
  };

  const handleRemoveStudent = async (subscriptionId) => {
    const result = await removeStudentSubscription(subscriptionId);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Subscription removed");
  };

  // Filter students based on search and status
  const filteredStudents = useMemo(() => {
    return (subscribedStudents || []).filter((student) => {
      const matchesSearch =
        !searchQuery ||
        student.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.user?.student_code?.toLowerCase().includes(searchQuery.toLowerCase());

      // Check if subscription is expired based on expires_at
      const isExpired = student.expires_at && new Date(student.expires_at) < new Date();

      let matchesStatus = false;
      if (statusFilter === "all") {
        matchesStatus = true;
      } else if (statusFilter === "expired") {
        matchesStatus = isExpired || student.status === "expired";
      } else if (statusFilter === "active") {
        matchesStatus = student.status === "active" && !isExpired;
      } else {
        matchesStatus = student.status === statusFilter;
      }

      return matchesSearch && matchesStatus;
    });
  }, [subscribedStudents, searchQuery, statusFilter]);

  // Count active subscriptions (exclude expired ones)
  const activeSubscriptionsCount = (subscribedStudents || []).filter(
    (s) => s.status === "active" && !(s.expires_at && new Date(s.expires_at) < new Date())
  ).length;

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
            Student Management
          </h1>
          <p className="text-slate-600">
            Manage student subscriptions for your library.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors"
        >
          <svg
            className="w-5 h-5"
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
          Add Student
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">
                Total Subscribed
              </p>
              <p className="text-3xl font-bold text-slate-800 mt-1">
                {subscribedStudents?.length || 0}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary-500 flex items-center justify-center">
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
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">
                Active Subscriptions
              </p>
              <p className="text-3xl font-bold text-slate-800 mt-1">
                {activeSubscriptionsCount}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center">
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">
                Currently Checked In
              </p>
              <p className="text-3xl font-bold text-slate-800 mt-1">
                {activeStudents?.length || 0}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-yellow-500 flex items-center justify-center">
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
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="glass rounded-2xl p-4 shadow-lg mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search by name, email, or student code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none ${isDark
                ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                : "bg-white/80 border-slate-300 text-slate-900 placeholder-slate-500"
                }`}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none ${isDark
              ? "bg-slate-700 border-slate-600 text-white"
              : "bg-white/80 border-slate-300 text-slate-900"
              }`}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="glass rounded-2xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200/50 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">Subscribed Students</h3>
          <span className="px-3 py-1 bg-primary-100 text-primary-700 text-sm font-medium rounded-full">
            {filteredStudents.length} students
          </span>
        </div>

        {filteredStudents.length === 0 ? (
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
            <p className="text-slate-500">
              {searchQuery || statusFilter !== "all"
                ? "No students match your filters"
                : "No students subscribed yet"}
            </p>
            {!searchQuery && statusFilter === "all" && (
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-4 text-primary-600 font-medium hover:text-primary-700"
              >
                Add your first student →
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-200/70">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
                    Student Code
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
                    Subscribed On
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
                    Expires
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/50">
                {filteredStudents.map((student) => (
                  <StudentRow
                    key={student.id}
                    student={student}
                    onRemove={handleRemoveStudent}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      <AddStudentModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddStudent}
      />
    </div>
  );
}
