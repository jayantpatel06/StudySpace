import { useEffect, useState } from "react";
import { useAuthStore } from "../store/authStore";
import { useLibraryStore } from "../store/libraryStore";
import { useThemeStore } from "../store/themeStore";
import toast from "react-hot-toast";

function AddFloorModal({ isOpen, onClose, onAdd }) {
  const { theme } = useThemeStore();
  const [floorNumber, setFloorNumber] = useState("");
  const [floorName, setFloorName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isDark = theme === "dark";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!floorNumber) {
      toast.error("Please enter a floor number");
      return;
    }
    setIsLoading(true);
    await onAdd({ floor_number: parseInt(floorNumber), floor_name: floorName });
    setIsLoading(false);
    setFloorNumber("");
    setFloorName("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className={`rounded-2xl p-6 w-full max-w-md mx-4 ${isDark ? "bg-slate-800" : "bg-white"}`}>
        <h3 className={`text-lg font-semibold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>
          Add New Floor
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
              Floor Number
            </label>
            <input
              type="number"
              value={floorNumber}
              onChange={(e) => setFloorNumber(e.target.value)}
              className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none ${isDark
                ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                : "bg-white border-slate-200 text-slate-900"
                }`}
              placeholder="e.g., 1, 2, 3..."
              min="1"
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
              Floor Name (Optional)
            </label>
            <input
              type="text"
              value={floorName}
              onChange={(e) => setFloorName(e.target.value)}
              className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none ${isDark
                ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                : "bg-white border-slate-200 text-slate-900"
                }`}
              placeholder="e.g., Ground Floor, Reading Floor"
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
              {isLoading ? "Adding..." : "Add Floor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddRoomModal({ isOpen, onClose, onAdd, floors }) {
  const { theme } = useThemeStore();
  const [floorId, setFloorId] = useState("");
  const [roomName, setRoomName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [roomType, setRoomType] = useState("Study Hall");
  const [isLoading, setIsLoading] = useState(false);

  const isDark = theme === "dark";

  const roomTypes = [
    "Study Hall",
    "Reading Room",
    "Private Room",
    "Computer Lab",
    "Silent Zone",
    "Group Study",
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!floorId || !roomName) {
      toast.error("Please fill in all required fields");
      return;
    }
    setIsLoading(true);
    await onAdd(parseInt(floorId), {
      room_name: roomName,
      room_code: roomCode,
      room_type: roomType,
    });
    setIsLoading(false);
    setFloorId("");
    setRoomName("");
    setRoomCode("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className={`rounded-2xl p-6 w-full max-w-md mx-4 ${isDark ? "bg-slate-800" : "bg-white"}`}>
        <h3 className={`text-lg font-semibold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>
          Add New Room/Hall
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
              Select Floor
            </label>
            <select
              value={floorId}
              onChange={(e) => setFloorId(e.target.value)}
              className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none ${isDark
                ? "bg-slate-700 border-slate-600 text-white"
                : "bg-white border-slate-200 text-slate-900"
                }`}
            >
              <option value="">Choose a floor...</option>
              {floors.map((floor) => (
                <option key={floor.id} value={floor.id}>
                  Floor {floor.floor_number}{" "}
                  {floor.floor_name ? `- ${floor.floor_name}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
              Room Name
            </label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none ${isDark
                ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                : "bg-white border-slate-200 text-slate-900"
                }`}
              placeholder="e.g., Hall A, Reading Room 1"
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
              Room Code (Optional)
            </label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none ${isDark
                ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                : "bg-white border-slate-200 text-slate-900"
                }`}
              placeholder="e.g., HA, RR1"
              maxLength={4}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
              Room Type
            </label>
            <select
              value={roomType}
              onChange={(e) => setRoomType(e.target.value)}
              className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none ${isDark
                ? "bg-slate-700 border-slate-600 text-white"
                : "bg-white border-slate-200 text-slate-900"
                }`}
            >
              {roomTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
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
              {isLoading ? "Adding..." : "Add Room"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CreateSeatsModal({ isOpen, onClose, onAdd, room }) {
  const { theme } = useThemeStore();
  const [rows, setRows] = useState("4");
  const [columns, setColumns] = useState("6");
  const [hasPower, setHasPower] = useState(true);
  const [isQuietZone, setIsQuietZone] = useState(false);
  const [hasLamp, setHasLamp] = useState(false);
  const [hasErgoChair, setHasErgoChair] = useState(false);
  const [hasWifi, setHasWifi] = useState(true);
  const [wifiSpeed, setWifiSpeed] = useState("High-Speed");
  const [isLoading, setIsLoading] = useState(false);

  const isDark = theme === "dark";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rows || !columns) {
      toast.error("Please enter rows and columns");
      return;
    }
    setIsLoading(true);
    await onAdd(parseInt(rows), parseInt(columns), {
      hasPower,
      isQuietZone,
      hasLamp,
      hasErgoChair,
      hasWifi,
      wifiSpeed: hasWifi ? wifiSpeed : null,
      roomCode: room?.room_code || "",
      floor: room?.floor?.floor_number || 1,
      zone: room?.room_type || "General",
    });
    setIsLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className={`rounded-2xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto ${isDark ? "bg-slate-800" : "bg-white"
        }`}>
        <h3 className={`text-lg font-semibold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
          Create Seat Matrix
        </h3>
        <p className={`text-sm mb-4 ${isDark ? "text-slate-400" : "text-slate-500"}`}>For {room?.room_name}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                Rows
              </label>
              <input
                type="number"
                value={rows}
                onChange={(e) => setRows(e.target.value)}
                className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none ${isDark
                  ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                  : "bg-white border-slate-200 text-slate-900"
                  }`}
                placeholder="4"
                min="1"
                max="26"
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                Columns
              </label>
              <input
                type="number"
                value={columns}
                onChange={(e) => setColumns(e.target.value)}
                className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none ${isDark
                  ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                  : "bg-white border-slate-200 text-slate-900"
                  }`}
                placeholder="6"
                min="1"
                max="20"
              />
            </div>
          </div>

          {/* Preview */}
          <div className={`rounded-xl p-4 ${isDark ? "bg-slate-700" : "bg-slate-50"}`}>
            <p className={`text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}>Preview</p>
            <p className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
              {parseInt(rows || 0) * parseInt(columns || 0)} seats
            </p>
            <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              {rows} rows × {columns} columns
            </p>
          </div>

          {/* Amenities Section */}
          <div>
            <p className={`text-sm font-medium mb-3 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
              Seat Amenities
            </p>
            <div className="grid grid-cols-2 gap-3">
              <label className={`flex items-center gap-3 cursor-pointer p-3 rounded-xl border ${isDark ? "border-slate-600 hover:bg-slate-700" : "border-slate-200 hover:bg-slate-50"
                }`}>
                <input
                  type="checkbox"
                  checked={hasPower}
                  onChange={(e) => setHasPower(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <span className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                    ⚡ Power Outlet
                  </span>
                </div>
              </label>
              <label className={`flex items-center gap-3 cursor-pointer p-3 rounded-xl border ${isDark ? "border-slate-600 hover:bg-slate-700" : "border-slate-200 hover:bg-slate-50"
                }`}>
                <input
                  type="checkbox"
                  checked={hasLamp}
                  onChange={(e) => setHasLamp(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <span className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                    💡 Desk Lamp
                  </span>
                </div>
              </label>
              <label className={`flex items-center gap-3 cursor-pointer p-3 rounded-xl border ${isDark ? "border-slate-600 hover:bg-slate-700" : "border-slate-200 hover:bg-slate-50"
                }`}>
                <input
                  type="checkbox"
                  checked={hasErgoChair}
                  onChange={(e) => setHasErgoChair(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <span className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                    🪑 Ergonomic Chair
                  </span>
                </div>
              </label>
              <label className={`flex items-center gap-3 cursor-pointer p-3 rounded-xl border ${isDark ? "border-slate-600 hover:bg-slate-700" : "border-slate-200 hover:bg-slate-50"
                }`}>
                <input
                  type="checkbox"
                  checked={isQuietZone}
                  onChange={(e) => setIsQuietZone(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <span className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                    🔇 Quiet Zone
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* WiFi Section */}
          <div className={`p-3 rounded-xl border ${isDark ? "border-slate-600" : "border-slate-200"}`}>
            <label className="flex items-center gap-3 cursor-pointer mb-3">
              <input
                type="checkbox"
                checked={hasWifi}
                onChange={(e) => setHasWifi(e.target.checked)}
                className="w-5 h-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <span className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                📶 WiFi Available
              </span>
            </label>
            {hasWifi && (
              <select
                value={wifiSpeed}
                onChange={(e) => setWifiSpeed(e.target.value)}
                className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none ${isDark
                  ? "bg-slate-700 border-slate-600 text-white"
                  : "bg-white border-slate-200 text-slate-900"
                  }`}
              >
                <option value="Basic">Basic (10 Mbps)</option>
                <option value="Standard">Standard (50 Mbps)</option>
                <option value="High-Speed">High-Speed (100 Mbps)</option>
                <option value="Gigabit">Gigabit (1 Gbps)</option>
              </select>
            )}
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
              {isLoading ? "Creating..." : "Create Seats"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SeatMatrix({ seats, roomName }) {
  if (!seats || seats.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <p>No seats configured yet</p>
      </div>
    );
  }

  // Group seats by row
  const maxRow = Math.max(...seats.map((s) => s.row_number || 1));
  const maxCol = Math.max(...seats.map((s) => s.column_number || 1));

  const getSeatAt = (row, col) => {
    return seats.find((s) => s.row_number === row && s.column_number === col);
  };

  const getStatusColor = (status, isActive) => {
    if (!isActive) return "bg-gray-200 border-gray-300 text-gray-400";
    switch (status) {
      case "available":
        return "bg-green-100 border-green-500 text-green-700";
      case "occupied":
        return "bg-red-100 border-red-500 text-red-700";
      case "reserved":
        return "bg-yellow-100 border-yellow-500 text-yellow-700";
      default:
        return "bg-gray-100 border-gray-300 text-gray-600";
    }
  };

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-max">
        {/* Column Headers */}
        <div className="flex gap-2 mb-2 ml-8">
          {Array.from({ length: maxCol }, (_, i) => (
            <div
              key={i}
              className="w-12 h-6 flex items-center justify-center text-xs font-medium text-slate-400"
            >
              {i + 1}
            </div>
          ))}
        </div>

        {/* Rows */}
        {Array.from({ length: maxRow }, (_, rowIndex) => {
          const rowLabel = String.fromCharCode(65 + rowIndex);
          return (
            <div key={rowIndex} className="flex items-center gap-2 mb-2">
              {/* Row Label */}
              <div className="w-6 h-12 flex items-center justify-center text-xs font-medium text-slate-400">
                {rowLabel}
              </div>

              {/* Seats */}
              {Array.from({ length: maxCol }, (_, colIndex) => {
                const seat = getSeatAt(rowIndex + 1, colIndex + 1);
                if (!seat) {
                  return (
                    <div
                      key={colIndex}
                      className="w-12 h-12 border-2 border-dashed border-slate-200 rounded-lg"
                    ></div>
                  );
                }
                return (
                  <div
                    key={colIndex}
                    className={`w-12 h-12 border-2 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105 ${getStatusColor(seat.status, seat.is_active !== false)}`}
                    title={`${seat.label} - ${seat.status}`}
                  >
                    <span className="text-xs font-semibold">{seat.label}</span>
                    {seat.has_power && (
                      <svg
                        className="w-3 h-3"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
                      </svg>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function SeatManagement() {
  const { library } = useAuthStore();
  const {
    floors,
    rooms,
    seats,
    fetchFloors,
    fetchRooms,
    fetchSeats,
    addFloor,
    addRoom,
    createSeatsForRoom,
    deleteFloor,
    deleteRoom,
  } = useLibraryStore();

  const [isLoading, setIsLoading] = useState(true);
  const [showAddFloor, setShowAddFloor] = useState(false);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [showCreateSeats, setShowCreateSeats] = useState(false);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [expandedFloors, setExpandedFloors] = useState({});

  useEffect(() => {
    if (library?.id) {
      loadData();
    }
  }, [library?.id]);

  const loadData = async () => {
    setIsLoading(true);
    await Promise.all([
      fetchFloors(library.id),
      fetchRooms(library.id),
      fetchSeats(library.id),
    ]);
    setIsLoading(false);
  };

  const handleAddFloor = async (floorData) => {
    const { data, error } = await addFloor(library.id, floorData);
    if (error) {
      toast.error(error);
    } else {
      toast.success("Floor added successfully");
    }
  };

  const handleAddRoom = async (floorId, roomData) => {
    const { data, error } = await addRoom(library.id, floorId, roomData);
    if (error) {
      toast.error(error);
    } else {
      toast.success("Room added successfully");
    }
  };

  const handleCreateSeats = async (rows, columns, options) => {
    const { data, error } = await createSeatsForRoom(
      library.id,
      selectedRoom.id,
      rows,
      columns,
      options,
    );
    if (error) {
      toast.error(error);
    } else {
      toast.success(`Created ${rows * columns} seats successfully`);
    }
    setSelectedRoom(null);
  };

  const handleDeleteFloor = async (floor) => {
    if (
      !confirm(
        `Delete Floor ${floor.floor_number}? This will also delete all rooms and seats on this floor.`,
      )
    )
      return;
    const { error } = await deleteFloor(floor.id);
    if (error) {
      toast.error(error);
    } else {
      toast.success("Floor deleted");
    }
  };

  const handleDeleteRoom = async (room) => {
    if (
      !confirm(
        `Delete ${room.room_name}? This will also delete all seats in this room.`,
      )
    )
      return;
    const { error } = await deleteRoom(room.id);
    if (error) {
      toast.error(error);
    } else {
      toast.success("Room deleted");
    }
  };

  const toggleFloor = (floorId) => {
    setExpandedFloors((prev) => ({
      ...prev,
      [floorId]: !prev[floorId],
    }));
  };

  const getFloorRooms = (floorId) =>
    rooms.filter((r) => r.floor_id === floorId);
  const getRoomSeats = (roomId) => seats.filter((s) => s.room_id === roomId);

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
            Seat Management
          </h1>
          <p className="text-slate-600">
            Configure floors, rooms, and seat layouts
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAddFloor(true)}
            className="px-4 py-2.5 glass border border-slate-200 rounded-xl text-slate-600 font-medium hover:text-slate-800 hover:bg-white/30 flex items-center gap-2"
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
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            Add Floor
          </button>
          <button
            onClick={() => setShowAddRoom(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-indigo-700 flex items-center gap-2 shadow-lg shadow-purple-500/30 disabled:opacity-50"
            disabled={floors.length === 0}
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
            Add Room
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass rounded-2xl p-6 shadow-lg card-hover">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
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
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Floors</p>
              <p className="text-2xl font-bold text-slate-800">
                {floors.length}
              </p>
            </div>
          </div>
        </div>
        <div className="glass rounded-2xl p-6 shadow-lg card-hover">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Rooms</p>
              <p className="text-2xl font-bold text-slate-800">
                {rooms.length}
              </p>
            </div>
          </div>
        </div>
        <div className="glass rounded-2xl p-6 shadow-lg card-hover">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
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
                  d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Seats</p>
              <p className="text-2xl font-bold text-slate-800">
                {seats.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {floors.length === 0 && (
        <div className="glass rounded-2xl p-12 shadow-lg text-center">
          <svg
            className="w-16 h-16 text-slate-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">
            No floors configured
          </h3>
          <p className="text-slate-500 mb-6">
            Start by adding floors to your library, then add rooms and configure
            seats.
          </p>
          <button
            onClick={() => setShowAddFloor(true)}
            className="px-6 py-3 bg-gradient-to-r from-[#5B8BD9] to-[#8B7FCF] text-white rounded-xl font-medium hover:opacity-90 shadow-lg"
          >
            Add Your First Floor
          </button>
        </div>
      )}

      {/* Floor List */}
      {floors.length > 0 && (
        <div className="space-y-4">
          {floors.map((floor) => {
            const floorRooms = getFloorRooms(floor.id);
            const isExpanded = expandedFloors[floor.id] !== false;

            return (
              <div
                key={floor.id}
                className="glass rounded-2xl shadow-lg overflow-hidden"
              >
                {/* Floor Header */}
                <div
                  className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-white/30"
                  onClick={() => toggleFloor(floor.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-bold">
                        {floor.floor_number}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">
                        Floor {floor.floor_number}
                        {floor.floor_name && (
                          <span className="text-slate-500 font-normal ml-2">
                            ({floor.floor_name})
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {floorRooms.length} rooms
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFloor(floor);
                      }}
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg"
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                    <svg
                      className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>

                {/* Rooms */}
                {isExpanded && (
                  <div className="border-t border-slate-200/50">
                    {floorRooms.length === 0 ? (
                      <div className="p-6 text-center text-slate-500">
                        <p>No rooms on this floor yet</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-200/50">
                        {floorRooms.map((room) => {
                          const roomSeats = getRoomSeats(room.id);
                          return (
                            <div key={room.id} className="p-6">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                                    <span className="text-purple-600 font-semibold text-sm">
                                      {room.room_code || room.room_name[0]}
                                    </span>
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-slate-800">
                                      {room.room_name}
                                    </h4>
                                    <p className="text-xs text-slate-500">
                                      {room.room_type} • {roomSeats.length}{" "}
                                      seats
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => {
                                      setSelectedRoom(room);
                                      setShowCreateSeats(true);
                                    }}
                                    className="px-3 py-1.5 bg-[#5B8BD9]/20 text-[#5B8BD9] rounded-lg text-sm font-medium hover:bg-[#5B8BD9]/30 border border-[#5B8BD9]/30"
                                  >
                                    {roomSeats.length > 0
                                      ? "Reconfigure"
                                      : "Add Seats"}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteRoom(room)}
                                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg"
                                  >
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
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              </div>

                              {/* Seat Matrix */}
                              <SeatMatrix
                                seats={roomSeats}
                                roomName={room.room_name}
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      {seats.length > 0 && (
        <div className="mt-6 glass rounded-2xl p-6 shadow-lg">
          <h4 className="font-medium text-slate-800 mb-3">Seat Legend</h4>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-green-100 border-2 border-green-500"></div>
              <span className="text-sm text-slate-600">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-red-100 border-2 border-red-500"></div>
              <span className="text-sm text-slate-600">Occupied</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-yellow-100 border-2 border-yellow-500"></div>
              <span className="text-sm text-slate-600">Reserved</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-gray-200 border-2 border-gray-300"></div>
              <span className="text-sm text-slate-600">Inactive</span>
            </div>
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 text-yellow-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
              </svg>
              <span className="text-sm text-slate-600">Has Power</span>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <AddFloorModal
        isOpen={showAddFloor}
        onClose={() => setShowAddFloor(false)}
        onAdd={handleAddFloor}
      />
      <AddRoomModal
        isOpen={showAddRoom}
        onClose={() => setShowAddRoom(false)}
        onAdd={handleAddRoom}
        floors={floors}
      />
      <CreateSeatsModal
        isOpen={showCreateSeats}
        onClose={() => {
          setShowCreateSeats(false);
          setSelectedRoom(null);
        }}
        onAdd={handleCreateSeats}
        room={selectedRoom}
      />
    </div>
  );
}
