"use client";

import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import { BookOpen, Calendar, Download, Search } from "lucide-react";
import { useSession } from "next-auth/react";

export default function RegisterPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const { data: session } = useSession();
  const permissions = session?.user?.permissions;
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await fetch("/api/bookings");
        if (res.ok) {
          const data = await res.json();
          // Sort bookings chronologically by date
          const sorted = data.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
          setBookings(sorted);
        }
      } catch (err) {
        console.error("Failed to fetch bookings");
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  const years = useMemo(() => {
    if (bookings.length === 0) return [new Date().getFullYear()];
    const uniqueYears = Array.from(new Set(bookings.map(b => new Date(b.date).getFullYear())));
    if (!uniqueYears.includes(new Date().getFullYear())) {
      uniqueYears.push(new Date().getFullYear());
    }
    return uniqueYears.sort((a, b) => b - a);
  }, [bookings]);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const d = new Date(b.date);
      const matchesDate = d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
      
      if (!matchesDate) return false;
      if (!searchQuery) return true;

      const query = searchQuery.toLowerCase();
      return (
        b.guestName?.toLowerCase().includes(query) ||
        b.memoNo?.toLowerCase().includes(query) ||
        b.mobileNo?.includes(query)
      );
    });
  }, [bookings, selectedMonth, selectedYear, searchQuery]);

  const handleExportCSV = () => {
    const headers = [
      "Sl No", "Date", "Memo No", "Guest Name", "Address", "Contact", 
      "Room No", "Check In", "Check Out", "Advance (₹)", "Balance (₹)", "Total (₹)", "Mode"
    ];

    const csvData = filteredBookings.map((b, index) => {
      const roomNos = b.roomsBooked?.map((r: any) => r.roomNumber || r).join(" & ") || "N/A";
      const checkIn = b.checkIn ? format(new Date(b.checkIn), "dd/MM/yyyy") : "N/A";
      const checkOut = b.checkOut ? format(new Date(b.checkOut), "dd/MM/yyyy") : "N/A";
      
      return [
        index + 1,
        format(new Date(b.date), "dd/MM/yyyy"),
        b.memoNo,
        `"${b.guestName}"`,
        `"${b.address || ""}"`,
        b.mobileNo,
        `"${roomNos}"`,
        checkIn,
        checkOut,
        permissions?.canViewRevenue ? (b.advancePayment || 0) : "***",
        permissions?.canViewRevenue ? (b.remainingAmount !== undefined ? b.remainingAmount : (b.totalAmount || 0)) : "***",
        permissions?.canViewRevenue ? (b.totalAmount || 0) : "***",
        b.paymentMode || ""
      ].join(",");
    });

    const csvContent = [headers.join(","), ...csvData].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Hotel_Register_${months[selectedMonth]}_${selectedYear}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-3">
            <BookOpen className="text-primary" /> Hotel Register
          </h1>
          <p className="text-sm md:text-base text-slate-500 mt-1">
            View traditional ledger of all guests, filterable by month and year.
          </p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={handleExportCSV}
            disabled={filteredBookings.length === 0}
            className="px-4 py-2 bg-slate-800 text-white text-sm font-bold rounded-lg hover:bg-slate-900 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100">
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm">
              <Calendar size={16} className="text-slate-400" />
              <select 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer"
              >
                {months.map((m, idx) => (
                  <option key={m} value={idx}>{m}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm">
              <select 
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer w-20"
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="relative w-full md:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search Guest or Memo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none shadow-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1,2,3,4].map(i => <div key={i} className="h-12 bg-slate-100 animate-pulse rounded-lg" />)}
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="py-12 text-center flex flex-col items-center">
            <BookOpen size={48} className="text-slate-200 mb-4" />
            <h3 className="text-lg font-bold text-slate-600">No Entries Found</h3>
            <p className="text-slate-400 text-sm mt-1">
              There are no bookings registered for {months[selectedMonth]} {selectedYear}.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3 border-b border-slate-200 w-12 text-center">#</th>
                  <th className="px-4 py-3 border-b border-slate-200">Date</th>
                  <th className="px-4 py-3 border-b border-slate-200">Memo No</th>
                  <th className="px-4 py-3 border-b border-slate-200">Guest Name</th>
                  <th className="px-4 py-3 border-b border-slate-200">Room(s)</th>
                  <th className="px-4 py-3 border-b border-slate-200">Check In/Out</th>
                  <th className="px-4 py-3 border-b border-slate-200 text-right">Advance (₹)</th>
                  <th className="px-4 py-3 border-b border-slate-200 text-right">Balance (₹)</th>
                  <th className="px-4 py-3 border-b border-slate-200 text-right">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBookings.map((b, idx) => {
                  const roomNos = b.roomsBooked?.map((r: any) => r.roomNumber || r).join(", ") || "-";
                  const advance = b.advancePayment || 0;
                  const total = b.totalAmount || 0;
                  const balance = b.remainingAmount !== undefined ? b.remainingAmount : total;
                  
                  return (
                    <tr key={b._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                      <td className="px-4 py-3 font-semibold text-slate-700">
                        {format(new Date(b.date), "dd MMM yy")}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{b.memoNo}</td>
                      <td className="px-4 py-3 font-bold text-slate-800">
                        {b.guestName}
                        <div className="text-[10px] font-normal text-slate-400 mt-0.5 flex flex-col">
                          <span>{b.mobileNo}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="bg-primary/10 text-primary font-bold px-2 py-0.5 rounded text-xs">
                          {roomNos}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        <div className="flex flex-col gap-0.5">
                          <span><span className="text-slate-400 inline-block w-6">IN:</span> {b.checkIn ? format(new Date(b.checkIn), "dd/MM/yyyy") : "-"}</span>
                          <span><span className="text-slate-400 inline-block w-6">OUT:</span> {b.checkOut ? format(new Date(b.checkOut), "dd/MM/yyyy") : "-"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-600">
                        {permissions?.canViewRevenue ? advance.toFixed(2) : <span className="text-slate-400 tracking-widest">***</span>}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-rose-600">
                        {permissions?.canViewRevenue ? balance.toFixed(2) : <span className="text-slate-400 tracking-widest">***</span>}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-600">
                        {permissions?.canViewRevenue ? total.toFixed(2) : <span className="text-slate-400 tracking-widest">***</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
