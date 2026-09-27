"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { History, ReceiptText, ArrowRight, CalendarDays, Wallet, User as UserIcon } from "lucide-react";

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await fetch("/api/bookings");
        if (res.ok) {
          const data = await res.json();
          setBookings(data);
        }
      } catch (err) {
        console.error("Failed to fetch bookings");
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-24">
      <div className="flex items-center gap-4 border-b border-slate-200 pb-6">
        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shadow-inner">
          <History size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Booking History</h1>
          <p className="text-slate-500 mt-1">View and manage all past bookings and generated bills.</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-pulse h-48" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
          <ReceiptText size={48} className="text-slate-300 mb-4" />
          <h2 className="text-xl font-bold text-slate-800">No bookings yet</h2>
          <p className="text-slate-500 mt-2 max-w-sm">When you generate a bill from the Billing page and save it, it will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {bookings.map((booking) => (
            <div key={booking._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Memo {booking.memoNo}
                    </span>
                    <span className="text-sm text-slate-400 font-medium">
                      {format(new Date(booking.date), "dd MMM yyyy")}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">{booking.guestName}</h3>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-1">Total</p>
                  <p className="text-2xl font-bold text-emerald-600">₹{booking.totalAmount}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6 flex-1">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><UserIcon size={12}/> Contact</p>
                  <p className="text-sm font-semibold text-slate-700">{booking.mobileNo}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><Wallet size={12}/> Payment</p>
                  <p className="text-sm font-semibold text-slate-700">{booking.paymentMode}</p>
                </div>
                {booking.checkIn && (
                  <div className="space-y-1 col-span-2 bg-slate-50 p-3 rounded-lg border border-slate-100 flex justify-between items-center mt-2">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Check In</p>
                      <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <CalendarDays size={14} className="text-primary"/>
                        {format(new Date(booking.checkIn), "dd MMM yyyy")}
                      </p>
                    </div>
                    <ArrowRight size={16} className="text-slate-300" />
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Check Out</p>
                      <p className="text-sm font-bold text-slate-700 flex items-center gap-2 justify-end">
                        <CalendarDays size={14} className="text-primary"/>
                        {booking.checkOut ? format(new Date(booking.checkOut), "dd MMM yyyy") : "N/A"}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                <span className="text-xs font-medium text-slate-400">
                  {booking.particulars?.length || 0} items billed
                </span>
                <button className="text-sm font-semibold text-primary hover:text-green-700 transition-colors flex items-center gap-1">
                  View Details <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
