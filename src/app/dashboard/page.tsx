"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BedDouble,
  CalendarCheck,
  DoorClosed,
  Banknote,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import dynamic from "next/dynamic";
import { DatePicker } from "@/components/ui/date-picker";
import toast from "react-hot-toast";

const Rooms3D = dynamic(
  () => import("@/components/Rooms3D").then((mod) => mod.Rooms3D),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[450px] bg-slate-900 rounded-3xl animate-pulse" />
    ),
  },
);

export default function DashboardOverview() {
  const { data: session } = useSession();
  const permissions = session?.user?.permissions;
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Availability Search States
  const [searchStart, setSearchStart] = useState<Date | undefined>(undefined);
  const [searchEnd, setSearchEnd] = useState<Date | undefined>(undefined);
  const [availableRoomsResult, setAvailableRoomsResult] = useState<any[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearchAvailability = async () => {
    if (!searchStart || !searchEnd) {
      toast.error("Please select both dates");
      return;
    }
    if (searchEnd <= searchStart) {
      toast.error("Checkout date must be after Check-in date");
      return;
    }
    
    setIsSearching(true);
    try {
      const [roomsRes, bookingsRes] = await Promise.all([
        fetch("/api/rooms"),
        fetch("/api/bookings")
      ]);
      const rooms = await roomsRes.json();
      const bookings = await bookingsRes.json();
      
      const getMidnightTime = (date: string | Date) => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      };

      const start = getMidnightTime(searchStart);
      const end = getMidnightTime(searchEnd);

      const bookedRoomIds = new Set();
      
      bookings.forEach((b: any) => {
        if (b.checkIn && b.checkOut && b.roomsBooked && b.roomsBooked.length > 0) {
          const bStart = getMidnightTime(b.checkIn);
          const bEnd = getMidnightTime(b.checkOut);
          
          // Check for overlap
          if (start < bEnd && end > bStart) {
            b.roomsBooked.forEach((r: any) => bookedRoomIds.add(r._id || r));
          }
        }
      });

      const freeRooms = rooms.filter((r: any) => !bookedRoomIds.has(r._id));
      setAvailableRoomsResult(freeRooms);
      toast.success(`Found ${freeRooms.length} available rooms!`);
    } catch (e) {
      console.error(e);
      toast.error("Error searching availability");
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch("/api/dashboard");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const stats = [
    {
      label: "Total Rooms",
      value: data?.stats.totalRooms || 0,
      icon: BedDouble,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      label: "Available",
      value: data?.stats.availableRooms || 0,
      icon: DoorClosed,
      color: "text-emerald-600",
      bg: "bg-emerald-100",
    },
    {
      label: "Occupied",
      value: data?.stats.occupiedRooms || 0,
      icon: CalendarCheck,
      color: "text-rose-600",
      bg: "bg-rose-100",
    },
    {
      label: "Total Revenue",
      value: `₹ ${data?.stats.totalRevenue?.toLocaleString() || 0}`,
      icon: Banknote,
      color: "text-indigo-600",
      bg: "bg-indigo-100",
    },
  ];

  const visibleStats = permissions?.canViewRevenue
    ? stats
    : stats.filter((s) => s.label !== "Total Revenue");

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
          Dashboard Overview
        </h1>
        <p className="text-sm md:text-base text-slate-500 mt-1">
          Welcome back! Here's what's happening at Heaven Valley Retreat today.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {visibleStats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-5"
            >
              <div
                className={`w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shrink-0 ${stat.bg} ${stat.color}`}
              >
                <Icon size={20} className="sm:hidden" />
                <Icon size={24} className="hidden sm:block" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-slate-500">
                  {stat.label}
                </p>
                {isLoading ? (
                  <div className="h-6 sm:h-8 w-12 sm:w-16 bg-slate-100 animate-pulse rounded mt-1" />
                ) : (
                  <p className="text-lg sm:text-2xl font-bold text-slate-800">
                    {stat.value}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col"
        >
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h2 className="text-xl font-bold text-slate-800">
              Recent Generated Bills
            </h2>
            <Link
              href="/dashboard/bookings"
              className="text-sm font-semibold text-primary hover:text-green-700 transition-all flex items-center gap-1 cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
            >
              View All <ArrowRight size={16} />
            </Link>
          </div>

          <div className="flex-1 p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-12 bg-slate-100 animate-pulse rounded-xl"
                  />
                ))}
              </div>
            ) : data?.recentBookings?.length === 0 ? (
              <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center h-full">
                <p>No bills generated yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {data?.recentBookings?.map((booking: any) => (
                  <div
                    key={booking._id}
                    className="p-4 px-6 hover:bg-slate-50 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-slate-800">
                        {booking.guestName}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Memo: {booking.memoNo} •{" "}
                        {format(new Date(booking.date), "dd MMM yyyy")}
                      </p>
                    </div>
                    <div className="text-right">
                      {permissions?.canViewRevenue ? (
                        <p className="font-bold text-emerald-600">
                          ₹{booking.totalAmount?.toLocaleString()}
                        </p>
                      ) : (
                        <p className="font-bold text-slate-400 text-xs tracking-widest">
                          ***
                        </p>
                      )}
                      <p className="text-xs text-slate-400 font-medium">
                        {booking.paymentMode}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col h-full"
        >
          <h2 className="text-xl font-bold text-slate-800 mb-6">
            Quick Actions
          </h2>
          <div className="space-y-3 flex-1">
            {permissions?.canCreate && (
              <Link
                href="/dashboard/billing"
                className="w-full text-left px-5 py-4 rounded-xl border-2 border-slate-100 hover:border-primary hover:bg-primary/5 transition-all font-bold text-slate-700 flex justify-between items-center group block cursor-pointer hover:-translate-y-1 hover:shadow-md active:translate-y-0"
              >
                Generate New Bill
                <span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 transform">
                  <ArrowRight size={20} />
                </span>
              </Link>
            )}
            <Link
              href="/dashboard/rooms"
              className="w-full text-left px-5 py-4 rounded-xl border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50 transition-all font-bold text-slate-700 flex justify-between items-center group block cursor-pointer hover:-translate-y-1 hover:shadow-md active:translate-y-0"
            >
              Manage Rooms & Guests
              <span className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 transform">
                <ArrowRight size={20} />
              </span>
            </Link>
            <Link
              href="/dashboard/bookings"
              className="w-full text-left px-5 py-4 rounded-xl border-2 border-slate-100 hover:border-amber-500 hover:bg-amber-50 transition-all font-bold text-slate-700 flex justify-between items-center group block cursor-pointer hover:-translate-y-1 hover:shadow-md active:translate-y-0"
            >
              View Booking History
              <span className="text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 transform">
                <ArrowRight size={20} />
              </span>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Availability Search Widget */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
        className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 lg:p-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6 mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <CalendarCheck className="text-primary" /> Check Room Availability
            </h2>
            <p className="text-sm text-slate-500 mt-1">Select dates to find rooms that are free to book.</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Check In Date</label>
            <DatePicker value={searchStart ? searchStart.toISOString().split("T")[0] : ""} onChange={(d) => setSearchStart(new Date(d))} minDate={new Date()} highlightAvailability />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Check Out Date</label>
            <DatePicker value={searchEnd ? searchEnd.toISOString().split("T")[0] : ""} onChange={(d) => setSearchEnd(new Date(d))} minDate={searchStart || new Date()} highlightAvailability />
          </div>
          <button
            onClick={handleSearchAvailability}
            disabled={isSearching}
            className="w-full h-[42px] bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-900 transition-all shadow-sm hover:shadow-md disabled:opacity-50"
          >
            {isSearching ? "Searching..." : "Search Available Rooms"}
          </button>
        </div>

        {availableRoomsResult !== null && (
          <div className="mt-8 p-6 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h3 className="font-bold text-slate-800">
                {availableRoomsResult.length > 0 
                  ? `Available Rooms (${availableRoomsResult.length})` 
                  : "No rooms available for these dates."}
              </h3>
              {availableRoomsResult.length > 0 && searchStart && searchEnd && (
                <Link
                  href={`/dashboard/billing?checkIn=${searchStart.toISOString().split("T")[0]}&checkOut=${searchEnd.toISOString().split("T")[0]}`}
                  className="bg-primary text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 transition-all text-sm flex items-center justify-center gap-2 shadow-sm hover:shadow-md hover:-translate-y-0.5"
                >
                  Proceed to Booking
                </Link>
              )}
            </div>
            
            {availableRoomsResult.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {availableRoomsResult.map((room) => (
                  <div key={room._id} className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm flex flex-col items-center justify-center">
                    <span className="font-black text-lg text-slate-800">{room.roomNumber}</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{room.category}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* 3D Rooms section  */}

      {data?.stats?.totalRooms > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="w-full"
        >
          <Rooms3D />
        </motion.div>
      )}
    </div>
  );
}
