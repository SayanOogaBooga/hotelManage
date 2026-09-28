"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import Link from "next/link";
import {
  History,
  ReceiptText,
  ArrowRight,
  CalendarDays,
  Wallet,
  User as UserIcon,
  Printer,
  Trash2,
  BedDouble,
  Edit,
} from "lucide-react";
import { ReceiptPrint } from "@/components/ReceiptPrint";
import toast from "react-hot-toast";
import { playDeleteSound } from "@/lib/sounds";
import { generatePdfFromElement } from "@/lib/generatePdf";
import { motion, AnimatePresence } from "framer-motion";

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [printBooking, setPrintBooking] = useState<any>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handlePrint = (booking: any) => {
    setPrintBooking(booking);
    const toastId = toast.loading("Generating PDF...");
    setTimeout(async () => {
      const success = await generatePdfFromElement("receipt-print", `Bill-${booking.memoNo || "Receipt"}.pdf`);
      if (success) {
        toast.success("PDF Downloaded!", { id: toastId });
      } else {
        toast.error("Failed to generate PDF", { id: toastId });
      }
    }, 100);
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    const id = deleteConfirmId;
    setDeleteConfirmId(null);

    try {
      const res = await fetch(`/api/bookings?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        playDeleteSound();
        toast.success("Booking history deleted");
        setBookings(bookings.filter((b) => b._id !== id));
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to delete booking");
      }
    } catch (error) {
      toast.error("Network error");
    }
  };

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
    <>
      <div className="max-w-6xl mx-auto space-y-8 pb-24 print:hidden">
        <div className="flex items-center gap-4 border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
              Booking History
            </h1>
            <p className="text-sm md:text-base text-slate-500 mt-1">
              View and manage all past bookings and generated bills.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-pulse h-48"
              />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
            <ReceiptText size={48} className="text-slate-300 mb-4" />
            <h2 className="text-xl font-bold text-slate-800">
              No bookings yet
            </h2>
            <p className="text-slate-500 mt-2 max-w-sm">
              When you generate a bill from the Billing page and save it, it
              will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {bookings.map((booking) => (
              <div
                key={booking._id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col"
              >
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
                    <h3 className="text-xl font-bold text-slate-800">
                      {booking.guestName}
                    </h3>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-1">
                      Total
                    </p>
                    <p className="text-2xl font-bold text-emerald-600">
                      ₹{booking.totalAmount}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6 flex-1">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <UserIcon size={12} /> Contact
                    </p>
                    <p className="text-sm font-semibold text-slate-700">
                      {booking.mobileNo}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Wallet size={12} /> Payment
                    </p>
                    <p className="text-sm font-semibold text-slate-700">
                      {booking.paymentMode}
                    </p>
                  </div>
                  <div className="space-y-1 sm:col-span-1 col-span-2">
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <BedDouble size={12} /> Rooms
                    </p>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {booking.roomsBooked && booking.roomsBooked.length > 0 ? (
                        booking.roomsBooked.map((room: any) => (
                           <span key={room._id || room} className="text-[11px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded">
                             {room.roomNumber || "..."}
                           </span>
                        ))
                      ) : (
                        <span className="text-sm font-semibold text-slate-400">N/A</span>
                      )}
                    </div>
                  </div>
                  {booking.checkIn && (
                    <div className="space-y-1 col-span-full bg-slate-50 p-3 rounded-lg border border-slate-100 flex justify-between items-center mt-2">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                          Check In
                        </p>
                        <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                          <CalendarDays size={14} className="text-primary" />
                          {format(new Date(booking.checkIn), "dd MMM yyyy")}
                        </p>
                      </div>
                      <ArrowRight size={16} className="text-slate-300" />
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                          Check Out
                        </p>
                        <p className="text-sm font-bold text-slate-700 flex items-center gap-2 justify-end">
                          <CalendarDays size={14} className="text-primary" />
                          {booking.checkOut
                            ? format(new Date(booking.checkOut), "dd MMM yyyy")
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-medium text-slate-400">
                      {booking.particulars?.length || 0} items billed
                    </span>
                    <button
                      onClick={() => setDeleteConfirmId(booking._id)}
                      className="text-xs font-medium text-slate-400 hover:text-rose-600 transition-colors flex items-center gap-1 cursor-pointer"
                      title="Delete booking"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/dashboard/billing?id=${booking._id}`}
                      className="text-sm font-semibold text-slate-500 hover:text-slate-800 transition-all flex items-center gap-1 hover:-translate-y-0.5 active:translate-y-0"
                    >
                      <Edit size={14} /> Edit
                    </Link>
                    <button
                      onClick={() => handlePrint(booking)}
                      className="text-sm font-semibold text-primary hover:text-green-700 transition-all flex items-center gap-1 cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
                    >
                      Download PDF <Printer size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:hidden">
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
                Delete Booking?
              </h2>
              <p className="text-slate-500 mb-6">
                Are you sure you want to permanently delete this booking
                history? This action cannot be undone.
              </p>

              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 py-3 px-4 rounded-xl border-2 border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-all cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-3 px-4 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 transition-all shadow-md shadow-rose-200 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                >
                  Yes, Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {printBooking && <ReceiptPrint booking={printBooking} />}
    </>
  );
}
