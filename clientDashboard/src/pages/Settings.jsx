import { useState } from "react";
import { useAuthStore } from "../store/authStore";
import { supabase } from "../config/supabase";
import toast from "react-hot-toast";

export default function Settings() {
  const { library, client, updateLibrary } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("library");

  // Library settings state
  const [librarySettings, setLibrarySettings] = useState({
    name: library?.name || "",
    address: library?.address || "",
    opening_time: library?.opening_time || "08:00",
    closing_time: library?.closing_time || "22:00",
    radius_meters: library?.radius_meters || 100,
    description: library?.description || "",
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleLibrarySettingsChange = (field, value) => {
    setLibrarySettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveLibrarySettings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("libraries")
        .update({
          name: librarySettings.name,
          address: librarySettings.address,
          opening_time: librarySettings.opening_time,
          closing_time: librarySettings.closing_time,
          radius_meters: parseInt(librarySettings.radius_meters),
          description: librarySettings.description,
          updated_at: new Date().toISOString(),
        })
        .eq("id", library.id)
        .select()
        .single();

      if (error) throw error;

      updateLibrary(data);
      toast.success("Settings saved successfully");
    } catch (error) {
      toast.error(error.message || "Failed to save settings");
    }
    setIsLoading(false);
  };

  const handlePasswordChange = async () => {
    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      toast.error("Please fill in all password fields");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);
    try {
      // Verify current password
      const { data: clientData } = await supabase
        .from("library_clients")
        .select("password_hash")
        .eq("id", client.id)
        .single();

      const currentHash = atob(clientData.password_hash);
      if (currentHash !== passwordData.currentPassword) {
        throw new Error("Current password is incorrect");
      }

      // Update password
      const newHash = btoa(passwordData.newPassword);
      const { error } = await supabase
        .from("library_clients")
        .update({
          password_hash: newHash,
          updated_at: new Date().toISOString(),
        })
        .eq("id", client.id);

      if (error) throw error;

      toast.success("Password changed successfully");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      toast.error(error.message || "Failed to change password");
    }
    setIsLoading(false);
  };

  const tabs = [
    {
      id: "library",
      label: "Library Settings",
      icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
    },
    {
      id: "account",
      label: "Account",
      icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    },
  ];

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 font-display">
          Settings
        </h1>
        <p className="text-slate-500">
          Manage your library and account settings
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-primary-600 text-white"
                : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
            }`}
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
                d={tab.icon}
              />
            </svg>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Library Settings Tab */}
      {activeTab === "library" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-semibold text-slate-900 mb-6">
            Library Information
          </h3>

          <div className="space-y-6 max-w-2xl">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Library Name
              </label>
              <input
                type="text"
                value={librarySettings.name}
                onChange={(e) =>
                  handleLibrarySettingsChange("name", e.target.value)
                }
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Address
              </label>
              <input
                type="text"
                value={librarySettings.address}
                onChange={(e) =>
                  handleLibrarySettingsChange("address", e.target.value)
                }
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Opening Time
                </label>
                <input
                  type="time"
                  value={librarySettings.opening_time}
                  onChange={(e) =>
                    handleLibrarySettingsChange("opening_time", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Closing Time
                </label>
                <input
                  type="time"
                  value={librarySettings.closing_time}
                  onChange={(e) =>
                    handleLibrarySettingsChange("closing_time", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Geofence Radius (meters)
              </label>
              <input
                type="number"
                value={librarySettings.radius_meters}
                onChange={(e) =>
                  handleLibrarySettingsChange("radius_meters", e.target.value)
                }
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                min="10"
                max="5000"
              />
              <p className="text-xs text-slate-500 mt-1">
                Users must be within this radius to check in to the library
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Description
              </label>
              <textarea
                value={librarySettings.description}
                onChange={(e) =>
                  handleLibrarySettingsChange("description", e.target.value)
                }
                rows={4}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
              />
            </div>

            <div className="pt-4">
              <button
                onClick={handleSaveLibrarySettings}
                disabled={isLoading}
                className="px-6 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
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
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Tab */}
      {activeTab === "account" && (
        <div className="space-y-6">
          {/* Account Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-semibold text-slate-900 mb-6">
              Account Information
            </h3>

            <div className="flex items-start gap-6">
              <div className="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary-700">
                  {client?.name?.[0] || "U"}
                </span>
              </div>
              <div className="space-y-4 flex-1">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                    Name
                  </p>
                  <p className="font-medium text-slate-900">{client?.name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                    Username
                  </p>
                  <p className="font-medium text-slate-900">
                    {client?.username}
                  </p>
                </div>
                {client?.email && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                      Email
                    </p>
                    <p className="font-medium text-slate-900">{client.email}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Change Password */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-semibold text-slate-900 mb-6">
              Change Password
            </h3>

            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({
                      ...prev,
                      currentPassword: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({
                      ...prev,
                      newPassword: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  onClick={handlePasswordChange}
                  disabled={isLoading}
                  className="px-6 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 disabled:opacity-50"
                >
                  {isLoading ? "Changing..." : "Change Password"}
                </button>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-6">
            <h3 className="font-semibold text-red-700 mb-2">Danger Zone</h3>
            <p className="text-sm text-slate-600 mb-4">
              Contact your administrator to delete your account or transfer
              library ownership.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
