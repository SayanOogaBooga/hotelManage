"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BedDouble, CalendarCheck, DoorClosed, Banknote, ArrowRight } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default function DashboardOverview() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

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
    { label: "Total Rooms", value: data?.stats.totalRooms || 0, icon: BedDouble, color: "text-blue-600", bg: "bg-blue-100" },
    { label: "Available", value: data?.stats.availableRooms || 0, icon: DoorClosed, color: "text-emerald-600", bg: "bg-emerald-100" },
    { label: "Occupied", value: data?.stats.occupiedRooms || 0, icon: CalendarCheck, color: "text-rose-600", bg: "bg-rose-100" },
    { label: "Total Revenue", value: `₹ ${data?.stats.totalRevenue?.toLocaleString() || 0}`, icon: Banknote, color: "text-indigo-600", bg: "bg-indigo-100" },
  ];

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Dashboard Overview</h1>
        <p className="text-slate-500 mt-1">Welcome back! Here's what's happening at Heaven Valley Retreat today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-5"
            >
              <div className={`w-14 h-14 rounded-full flex items-center justify-center ${stat.bg} ${stat.color}`}>
                <Icon size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                {isLoading ? (
                  <div className="h-8 w-16 bg-slate-100 animate-pulse rounded mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
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
            <h2 className="text-xl font-bold text-slate-800">Recent Generated Bills</h2>
            <Link href="/dashboard/bookings" className="text-sm font-semibold text-primary hover:text-green-700 flex items-center gap-1">
              View All <ArrowRight size={16} />
            </Link>
          </div>
          
          <div className="flex-1 p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-12 bg-slate-100 animate-pulse rounded-xl" />)}
              </div>
            ) : data?.recentBookings?.length === 0 ? (
              <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center h-full">
                <p>No bills generated yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {data?.recentBookings?.map((booking: any) => (
                  <div key={booking._id} className="p-4 px-6 hover:bg-slate-50 transition-colors flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800">{booking.guestName}</p>
                      <p className="text-xs text-slate-500 mt-0.5">Memo: {booking.memoNo} • {format(new Date(booking.date), "dd MMM yyyy")}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-600">₹{booking.totalAmount?.toLocaleString()}</p>
                      <p className="text-xs text-slate-400 font-medium">{booking.paymentMode}</p>
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
          <h2 className="text-xl font-bold text-slate-800 mb-6">Quick Actions</h2>
          <div className="space-y-3 flex-1">
             <Link href="/dashboard/billing" className="w-full text-left px-5 py-4 rounded-xl border-2 border-slate-100 hover:border-primary hover:bg-primary/5 transition-all font-bold text-slate-700 flex justify-between items-center group block">
               Generate New Bill
               <span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 transform"><ArrowRight size={20}/></span>
             </Link>
             <Link href="/dashboard/rooms" className="w-full text-left px-5 py-4 rounded-xl border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50 transition-all font-bold text-slate-700 flex justify-between items-center group block">
               Manage Rooms & Guests
               <span className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 transform"><ArrowRight size={20}/></span>
             </Link>
             <Link href="/dashboard/bookings" className="w-full text-left px-5 py-4 rounded-xl border-2 border-slate-100 hover:border-amber-500 hover:bg-amber-50 transition-all font-bold text-slate-700 flex justify-between items-center group block">
               View Booking History
               <span className="text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 transform"><ArrowRight size={20}/></span>
             </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
