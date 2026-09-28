"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  BedDouble,
  RefreshCw,
  CalendarDays,
  User as UserIcon,
  LogOut,
  CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { playPopSound, playDeleteSound } from "@/lib/sounds";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

interface Room {
  _id: string;
  roomNumber: string;
  status: "Available" | "Occupied" | "Maintenance";
  currentGuestName?: string;
  checkInDate?: string;
  checkOutDate?: string;
  activeBookings?: any[];
  upcomingBookings?: any[];
}

export default function RoomsManagement() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newRoomNumber, setNewRoomNumber] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isAddRoomModalOpen, setIsAddRoomModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("All");
  const [roomToCheckout, setRoomToCheckout] = useState<string | null>(null);

  const fetchRooms = async () => {
    setIsLoading(true);
    try {
      const [roomsRes, bookingsRes] = await Promise.all([
        fetch("/api/rooms"),
        fetch("/api/bookings"),
      ]);
      const roomsData = await roomsRes.json();
      const bookingsData = await bookingsRes.json();

      if (Array.isArray(roomsData) && Array.isArray(bookingsData)) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTime = today.getTime();

        const getMidnightTime = (dateString: string) => {
          const d = new Date(dateString);
          d.setHours(0, 0, 0, 0);
          return d.getTime();
        };

        const mergedRooms = roomsData.map((room: any) => {
          // Find any active or future bookings for this room
          const roomBookings = bookingsData.filter((b: any) => {
            const isRoomInBooking = b.roomsBooked?.some(
              (r: any) => r._id === room._id || r === room._id,
            );
            return isRoomInBooking && getMidnightTime(b.checkOut) >= todayTime;
          });

          let dynamicStatus = room.status; // Start with manual status (important for Maintenance)
          let currentBooking = null;

          if (dynamicStatus !== "Maintenance") {
            // Check if any booking covers today
            currentBooking = roomBookings.find((b: any) => {
              const checkInTime = getMidnightTime(b.checkIn);
              const checkOutTime = getMidnightTime(b.checkOut);
              // CheckIn is on or before today, AND CheckOut is STRICTLY after today
              return checkInTime <= todayTime && todayTime < checkOutTime;
            });

            if (currentBooking) {
              dynamicStatus = "Occupied";
            } else {
              dynamicStatus = "Available";
            }
          }

          // Upcoming bookings are strictly those where checkIn is strictly in the future
          const upcomingBookings = roomBookings.filter(
            (b: any) => getMidnightTime(b.checkIn) > todayTime,
          );

          return {
            ...room,
            status: dynamicStatus,
            activeBookings: currentBooking ? [currentBooking] : [],
            upcomingBookings: upcomingBookings,
          };
        });
        setRooms(mergedRooms);
      }
    } catch (error) {
      toast.error("Failed to fetch rooms");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomNumber.trim()) return;

    setIsAdding(true);
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomNumber: newRoomNumber }),
      });

      if (res.ok) {
        toast.success(`Room ${newRoomNumber} added!`);
        setNewRoomNumber("");
        setIsAddRoomModalOpen(false);
        fetchRooms();
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Failed to add room");
      }
    } catch (error) {
      toast.error("Error adding room.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      // Optimistic update for Available / Maintenance
      setRooms(
        rooms.map((r) =>
          r._id === id ? { ...r, status: newStatus as any } : r,
        ),
      );

      const res = await fetch(`/api/rooms/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        if (newStatus === "Available") {
          playPopSound();
          toast.success("Room checked out and is now Available.");
        }
      } else {
        throw new Error("Failed");
      }
    } catch (error) {
      toast.error("Failed to update status");
      fetchRooms(); // revert on failure
    }
  };

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const confirmDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const executeDelete = async () => {
    if (!deleteConfirmId) return;
    const id = deleteConfirmId;
    setDeleteConfirmId(null);

    try {
      const res = await fetch(`/api/rooms/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        playDeleteSound();
        toast.success("Room deleted");
        setRooms(rooms.filter((r) => r._id !== id));
      }
    } catch (error) {
      toast.error("Failed to delete room");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Available":
        return (
          <span className="bg-emerald-100 text-emerald-800 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded font-bold uppercase tracking-wide">
            Available
          </span>
        );
      case "Occupied":
        return (
          <span className="bg-rose-100 text-rose-800 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded font-bold uppercase tracking-wide">
            Occupied
          </span>
        );
      case "Maintenance":
        return (
          <span className="bg-amber-100 text-amber-800 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded font-bold uppercase tracking-wide">
            Maintenance
          </span>
        );
      default:
        return null;
    }
  };

  const filteredRooms = rooms.filter((room) =>
    activeTab === "All" ? true : room.status === activeTab,
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-3">
            <BedDouble className="text-primary" /> Room Management
          </h1>
          <p className="text-sm md:text-base text-slate-500 mt-1">
            Manage rooms, assign guests, and track occupancy.
          </p>
        </div>

        <button
          onClick={() => setIsAddRoomModalOpen(true)}
          className="bg-primary text-white px-6 py-3 rounded-xl text-lg font-bold hover:bg-green-700 transition-all flex items-center gap-2 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
        >
          <Plus size={24} />
          Add New Room
        </button>
      </div>

      {rooms.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {["All", "Available", "Occupied", "Maintenance"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-full font-bold text-sm whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab
                  ? "bg-slate-800 text-white shadow-md scale-105"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:shadow hover:-translate-y-0.5 active:translate-y-0"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      <div className="bg-slate-50">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-48 bg-slate-200 animate-pulse rounded-2xl"
              ></div>
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <BedDouble size={48} className="mx-auto mb-4 text-slate-300" />
            <p className="text-lg font-bold text-slate-700">No rooms found</p>
            <p className="text-sm">
              Start by adding your first room using the "Add New Room" button
              above.
            </p>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <BedDouble size={48} className="mx-auto mb-4 text-slate-300" />
            <p className="text-lg font-bold text-slate-700">
              No {activeTab.toLowerCase()} rooms found
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            <AnimatePresence>
              {filteredRooms.map((room) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={room._id}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col relative group"
                >
                  <div className="p-3 sm:p-6 border-b border-slate-100 flex justify-between items-start">
                    <div>
                      {getStatusBadge(room.status)}
                      <h3 className="text-xl sm:text-3xl font-black text-slate-800 mt-1 sm:mt-2">
                        {room.roomNumber}
                      </h3>
                    </div>

                    <button
                      onClick={() => confirmDelete(room._id)}
                      className="text-slate-400 hover:text-rose-600 bg-slate-100 hover:bg-rose-100 transition-all p-2 rounded-full cursor-pointer hover:scale-110 active:scale-95"
                      title="Delete Room"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="p-3 sm:p-6 bg-slate-50 flex-1 flex flex-col justify-center">
                    {room.status === "Occupied" ? (
                      <div className="space-y-3 sm:space-y-4">
                        {room.activeBookings &&
                        room.activeBookings.length > 0 ? (
                          <>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                <UserIcon size={16} className="sm:hidden" />
                                <UserIcon
                                  size={18}
                                  className="hidden sm:block"
                                />
                              </div>
                              <div>
                                <p className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider">
                                  Guest
                                </p>
                                <p className="text-xs sm:text-base font-bold text-slate-700 leading-tight">
                                  {room.activeBookings[0].guestName}
                                </p>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2 bg-white p-2 sm:p-3 rounded-lg sm:rounded-xl border border-slate-100">
                              <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                  Check In
                                </p>
                                <p className="text-xs font-semibold text-slate-600">
                                  {room.activeBookings[0].checkIn
                                    ? format(
                                        new Date(
                                          room.activeBookings[0].checkIn,
                                        ),
                                        "dd MMM yy",
                                      )
                                    : "N/A"}
                                </p>
                              </div>
                              <div className="text-left sm:text-right">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                  Check Out
                                </p>
                                <p className="text-[10px] sm:text-xs font-semibold text-slate-600">
                                  {room.activeBookings[0].checkOut
                                    ? format(
                                        new Date(
                                          room.activeBookings[0].checkOut,
                                        ),
                                        "dd MMM yy",
                                      )
                                    : "N/A"}
                                </p>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="text-center text-slate-400 font-medium text-xs sm:text-base">
                            Occupied (Walk-in / Unassigned)
                          </div>
                        )}
                      </div>
                    ) : room.status === "Maintenance" ? (
                      <div className="text-center text-slate-400 font-medium text-xs sm:text-base">
                        Room is currently under maintenance.
                      </div>
                    ) : (
                      <div className="flex flex-col h-full justify-center">
                        {room.upcomingBookings &&
                        room.upcomingBookings.length > 0 ? (
                          <div className="space-y-2">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                              Upcoming Bookings
                            </p>
                            {room.upcomingBookings.map(
                              (b: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="bg-white p-2 sm:p-3 rounded-lg border border-slate-200 text-xs shadow-sm flex justify-between items-center"
                                >
                                  <span className="font-bold text-slate-700 truncate mr-2">
                                    {b.guestName}
                                  </span>
                                  <span className="text-slate-500 font-medium whitespace-nowrap bg-slate-50 px-2 py-0.5 rounded">
                                    {b.checkIn
                                      ? format(new Date(b.checkIn), "dd/MM")
                                      : ""}{" "}
                                    -{" "}
                                    {b.checkOut
                                      ? format(new Date(b.checkOut), "dd/MM")
                                      : ""}
                                  </span>
                                </div>
                              ),
                            )}
                          </div>
                        ) : (
                          <div className="text-center text-slate-400 font-medium text-xs sm:text-base">
                            Room is clean and ready for guests.
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="p-3 sm:p-4 bg-white border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {room.status === "Available" ? (
                      <button
                        onClick={() =>
                          handleStatusChange(room._id, "Maintenance")
                        }
                        className="col-span-1 sm:col-span-2 bg-amber-100 text-amber-700 py-2 sm:py-2.5 rounded-xl text-xs sm:text-base font-bold flex items-center justify-center gap-1 sm:gap-2 hover:bg-amber-200 transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                      >
                        Mark as Maintenance
                      </button>
                    ) : room.status === "Occupied" ? (
                      <div className="col-span-1 sm:col-span-2 text-center text-rose-500 font-medium text-xs sm:text-sm py-2">
                        {/* Modify checkout date in Create Memo to checkout */}
                      </div>
                    ) : (
                      <button
                        onClick={() =>
                          handleStatusChange(room._id, "Available")
                        }
                        className="col-span-1 sm:col-span-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-all py-2 sm:py-2.5 rounded-xl text-xs sm:text-base font-bold flex items-center justify-center gap-1 sm:gap-2 cursor-pointer hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0"
                      >
                        Mark Available
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirmId(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-sm relative z-10 shadow-2xl border border-slate-100 text-center"
            >
              <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">
                Delete Room?
              </h2>
              <p className="text-slate-500 mb-6">
                Are you sure you want to permanently delete this room? This
                action cannot be undone.
              </p>

              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 py-3 px-4 rounded-xl border-2 border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-all cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
                >
                  Cancel
                </button>
                <button
                  onClick={executeDelete}
                  className="flex-1 py-3 px-4 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 transition-all shadow-md shadow-rose-200 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                >
                  Yes, Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Add Room Modal */}
      <AnimatePresence>
        {isAddRoomModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200"
            >
              <div className="p-6 border-b border-slate-100">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-800">
                  <Plus className="text-primary" /> Add New Room
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Enter the room number or name to create a new room.
                </p>
              </div>

              <form onSubmit={handleAddRoom}>
                <div className="p-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">
                      Room Number
                    </label>
                    <input
                      type="text"
                      value={newRoomNumber}
                      onChange={(e) => setNewRoomNumber(e.target.value)}
                      placeholder="e.g. 101 or A-1"
                      className="w-full px-4 py-3 text-lg border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-700 bg-slate-50"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 rounded-b-2xl">
                  <button
                    type="button"
                    onClick={() => setIsAddRoomModalOpen(false)}
                    className="px-5 py-2.5 text-slate-600 font-semibold hover:bg-slate-200 rounded-xl transition-all cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAdding || !newRoomNumber.trim()}
                    className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold hover:bg-green-700 transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                  >
                    {isAdding ? (
                      <RefreshCw size={18} className="animate-spin" />
                    ) : (
                      <Plus size={18} />
                    )}
                    Create Room
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Check Out Dialog (Temporarily Disabled)
      <Dialog open={!!roomToCheckout} onOpenChange={(open) => !open && setRoomToCheckout(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl text-rose-600 flex items-center gap-2">
              <LogOut size={24} />
              Confirm Check-Out
            </DialogTitle>
            <DialogDescription className="text-slate-600 text-base py-2">
              Are you absolutely sure you want to check out this room? This action is immediate and will mark the room as available.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <button 
              onClick={() => setRoomToCheckout(null)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-bold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={() => {
                if (roomToCheckout) {
                  handleStatusChange(roomToCheckout, "Available");
                  setRoomToCheckout(null);
                }
              }}
              className="px-4 py-2 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-700 transition-colors"
            >
              Confirm Check-Out
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      */}
    </div>
  );
}
