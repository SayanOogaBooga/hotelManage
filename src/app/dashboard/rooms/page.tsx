"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, BedDouble, RefreshCw, CalendarDays, User as UserIcon, LogOut, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { playPopSound, playDeleteSound } from "@/lib/sounds";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/date-picker";

interface Room {
  _id: string;
  roomNumber: string;
  status: "Available" | "Occupied" | "Maintenance";
  currentGuestName?: string;
  checkInDate?: string;
  checkOutDate?: string;
}

export default function RoomsManagement() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newRoomNumber, setNewRoomNumber] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isAddRoomModalOpen, setIsAddRoomModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("All");
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  
  // Booking Form State
  const [guestName, setGuestName] = useState("");
  const [checkIn, setCheckIn] = useState<Date | undefined>(new Date());
  const [checkOut, setCheckOut] = useState<Date | undefined>();
  const [isSavingBooking, setIsSavingBooking] = useState(false);

  const fetchRooms = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/rooms");
      const data = await res.json();
      if (Array.isArray(data)) {
        setRooms(data);
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
    // If switching to occupied, open the modal instead
    if (newStatus === "Occupied") {
      const room = rooms.find(r => r._id === id);
      if (room) {
        setSelectedRoom(room);
        setGuestName("");
        setCheckIn(new Date());
        setCheckOut(undefined);
        setIsModalOpen(true);
      }
      return;
    }

    try {
      // Optimistic update for Available / Maintenance
      setRooms(rooms.map(r => r._id === id ? { ...r, status: newStatus as any } : r));
      
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

  const handleBookRoom = async () => {
    if (!selectedRoom || !guestName.trim() || !checkIn || !checkOut) {
      toast.error("Please fill in all guest details and dates");
      return;
    }

    setIsSavingBooking(true);
    try {
      const payload = {
        status: "Occupied",
        currentGuestName: guestName,
        checkInDate: checkIn.toISOString(),
        checkOutDate: checkOut.toISOString(),
      };

      const res = await fetch(`/api/rooms/${selectedRoom._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        playPopSound();
        toast.success(`Room ${selectedRoom.roomNumber} is now Occupied!`);
        setIsModalOpen(false);
        fetchRooms();
      } else {
        toast.error("Failed to book room");
      }
    } catch (error) {
      toast.error("Network error while booking room");
    } finally {
      setIsSavingBooking(false);
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
    switch(status) {
      case 'Available': return <span className="bg-emerald-100 text-emerald-800 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded font-bold uppercase tracking-wide">Available</span>;
      case 'Occupied': return <span className="bg-rose-100 text-rose-800 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded font-bold uppercase tracking-wide">Occupied</span>;
      case 'Maintenance': return <span className="bg-amber-100 text-amber-800 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded font-bold uppercase tracking-wide">Maintenance</span>;
      default: return null;
    }
  };

  const filteredRooms = rooms.filter(room => activeTab === "All" ? true : room.status === activeTab);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-3">
            <BedDouble className="text-primary" /> Room Management
          </h1>
          <p className="text-sm md:text-base text-slate-500 mt-1">Manage rooms, assign guests, and track occupancy.</p>
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
            {[1, 2, 3].map(i => <div key={i} className="h-48 bg-slate-200 animate-pulse rounded-2xl"></div>)}
          </div>
        ) : rooms.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <BedDouble size={48} className="mx-auto mb-4 text-slate-300" />
            <p className="text-lg font-bold text-slate-700">No rooms found</p>
            <p className="text-sm">Start by adding your first room using the "Add New Room" button above.</p>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <BedDouble size={48} className="mx-auto mb-4 text-slate-300" />
            <p className="text-lg font-bold text-slate-700">No {activeTab.toLowerCase()} rooms found</p>
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
                      <h3 className="text-xl sm:text-3xl font-black text-slate-800 mt-1 sm:mt-2">{room.roomNumber}</h3>
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
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <UserIcon size={16} className="sm:hidden" />
                            <UserIcon size={18} className="hidden sm:block" />
                          </div>
                          <div>
                            <p className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider">Guest</p>
                            <p className="text-xs sm:text-base font-bold text-slate-700 leading-tight">{room.currentGuestName}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2 bg-white p-2 sm:p-3 rounded-lg sm:rounded-xl border border-slate-100">
                          <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Check In</p>
                            <p className="text-xs font-semibold text-slate-600">
                              {room.checkInDate ? format(new Date(room.checkInDate), "dd MMM yy") : "N/A"}
                            </p>
                          </div>
                          <div className="text-left sm:text-right">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Check Out</p>
                            <p className="text-[10px] sm:text-xs font-semibold text-slate-600">
                              {room.checkOutDate ? format(new Date(room.checkOutDate), "dd MMM yy") : "N/A"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : room.status === "Maintenance" ? (
                      <div className="text-center text-slate-400 font-medium text-xs sm:text-base">
                        Room is currently under maintenance.
                      </div>
                    ) : (
                      <div className="text-center text-slate-400 font-medium text-xs sm:text-base">
                        Room is clean and ready for guests.
                      </div>
                    )}
                  </div>

                  <div className="p-3 sm:p-4 bg-white border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {room.status === "Available" ? (
                      <>
                        <button 
                          onClick={() => handleStatusChange(room._id, "Occupied")}
                          className="col-span-1 sm:col-span-2 bg-primary text-white py-2 sm:py-2.5 rounded-xl text-xs sm:text-base font-bold flex items-center justify-center gap-1 sm:gap-2 hover:bg-green-700 transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                        >
                          <CheckCircle2 size={16} className="sm:hidden"/>
                          <CheckCircle2 size={18} className="hidden sm:block"/> 
                          Assign Guest
                        </button>
                        <button 
                          onClick={() => handleStatusChange(room._id, "Maintenance")}
                          className="col-span-1 sm:col-span-2 text-slate-500 py-1 text-[10px] sm:text-xs font-bold hover:text-amber-600 transition-all uppercase tracking-wider cursor-pointer hover:scale-105 active:scale-95"
                        >
                          Maintenance
                        </button>
                      </>
                    ) : room.status === "Occupied" ? (
                      <button 
                        onClick={() => handleStatusChange(room._id, "Available")}
                        className="col-span-1 sm:col-span-2 bg-rose-100 text-rose-700 hover:bg-rose-200 transition-all py-2 sm:py-2.5 rounded-xl text-xs sm:text-base font-bold flex items-center justify-center gap-1 sm:gap-2 cursor-pointer hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0"
                      >
                        <LogOut size={16} className="sm:hidden"/>
                        <LogOut size={18} className="hidden sm:block"/> 
                        Check Out
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleStatusChange(room._id, "Available")}
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

      {/* Booking Modal (Custom) */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200"
            >
              <div className="p-6 border-b border-slate-100">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-800">
                  Assign Room {selectedRoom?.roomNumber}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Enter the guest details to mark this room as currently occupied.
                </p>
              </div>
              
              <div className="p-6 grid gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Guest Name</label>
                  <input 
                    type="text" 
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-700 bg-slate-50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 flex flex-col">
                    <label className="text-sm font-semibold text-slate-700">Check In</label>
                    <DatePicker value={checkIn} onChange={(_, date) => setCheckIn(date)} />
                  </div>
                  <div className="space-y-2 flex flex-col">
                    <label className="text-sm font-semibold text-slate-700">Check Out</label>
                    <DatePicker value={checkOut} onChange={(_, date) => setCheckOut(date)} minDate={checkIn} />
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 rounded-b-2xl">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-slate-600 font-semibold hover:bg-slate-200 rounded-xl transition-all cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleBookRoom}
                  disabled={isSavingBooking}
                  className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold hover:bg-green-700 transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                >
                  {isSavingBooking ? <RefreshCw size={18} className="animate-spin"/> : <CheckCircle2 size={18} />}
                  Confirm Booking
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
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
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Delete Room?</h2>
              <p className="text-slate-500 mb-6">Are you sure you want to permanently delete this room? This action cannot be undone.</p>
              
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
                    <label className="text-sm font-semibold text-slate-700">Room Number</label>
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
                    {isAdding ? <RefreshCw size={18} className="animate-spin"/> : <Plus size={18} />}
                    Create Room
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
