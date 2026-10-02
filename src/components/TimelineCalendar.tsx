"use client";

import { useState, useEffect } from "react";
import { format, addDays, isSameDay, startOfDay, startOfMonth, endOfMonth, eachDayOfInterval, addMonths } from "date-fns";
import { CalendarDays, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";


export function TimelineCalendar() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const today = startOfDay(new Date());
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(today));

  // Generate days for the current month
  const dateRange = eachDayOfInterval({
    start: currentMonth,
    end: endOfMonth(currentMonth)
  });

  const handlePrev = () => setCurrentMonth(prev => addMonths(prev, -1));
  const handleNext = () => setCurrentMonth(prev => addMonths(prev, 1));
  const handleToday = () => setCurrentMonth(startOfMonth(today));

  const monthDisplay = format(currentMonth, "MMMM yyyy");

  const monthOptions = Array.from({ length: 25 }).map((_, i) => {
    const d = addMonths(startOfMonth(today), i - 6);
    return {
      value: format(d, "yyyy-MM"),
      label: format(d, "MMMM yyyy")
    };
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [roomsRes, bookingsRes] = await Promise.all([
          fetch("/api/rooms"),
          fetch("/api/bookings")
        ]);
        const roomsData = await roomsRes.json();
        const bookingsData = await bookingsRes.json();
        
        // Sort rooms
        roomsData.sort((a: any, b: any) => {
          const numA = parseInt(a.roomNumber) || 0;
          const numB = parseInt(b.roomNumber) || 0;
          return numA - numB;
        });

        setRooms(roomsData);
        setBookings(bookingsData);
      } catch (e) {
        console.error("Failed to fetch timeline data", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const getRoomStatusForDate = (roomId: string, date: Date) => {
    const targetDate = startOfDay(date).getTime();

    const booking = bookings.find(b => {
      if (!b.checkIn || !b.checkOut || !b.roomsBooked) return false;
      
      const bStart = startOfDay(new Date(b.checkIn)).getTime();
      const bEnd = startOfDay(new Date(b.checkOut)).getTime();
      
      const isRoomInBooking = b.roomsBooked.some((r: any) => (r._id || r) === roomId);
      
      // The room is occupied on targetDate if targetDate is between checkIn and checkOut-1
      return isRoomInBooking && targetDate >= bStart && targetDate < bEnd;
    });

    return booking;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
      <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-slate-50">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <CalendarDays className="text-primary" /> Room Availability
          </h2>
          <p className="text-sm text-slate-500 mt-1">At-a-glance view of room bookings.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 xl:gap-6">
          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
            <button onClick={handlePrev} className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition-colors" title="Previous Month">
              <ChevronLeft size={18} />
            </button>
            <div className="relative flex items-center min-w-[140px] justify-center group/select">
              <select 
                value={format(currentMonth, "yyyy-MM")}
                onChange={(e) => {
                  const [year, month] = e.target.value.split("-");
                  setCurrentMonth(new Date(parseInt(year), parseInt(month) - 1, 1));
                }}
                className="text-sm font-bold text-slate-700 bg-transparent outline-none cursor-pointer group-hover/select:bg-slate-100 pl-3 pr-7 py-1 rounded appearance-none relative z-10 w-full text-center transition-colors"
                title="Select Month"
              >
                {monthOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <div className="absolute right-2 text-slate-400 pointer-events-none z-0 group-hover/select:text-slate-600 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </div>
            <button onClick={handleNext} className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition-colors" title="Next Month">
              <ChevronRight size={18} />
            </button>
            <div className="w-px h-5 bg-slate-200 mx-1"></div>
            <button onClick={handleToday} className="px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/10 rounded transition-colors uppercase tracking-wider">
              Today
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded bg-emerald-50 border border-emerald-100"></div> Available</div>
            <div className="flex items-center gap-1.5 relative">
              <div className="w-4 h-4 rounded bg-rose-100 border border-rose-200 overflow-hidden relative">
                <svg className="absolute inset-0 w-full h-full text-rose-400 opacity-60 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <line x1="0" y1="0" x2="100" y2="100" stroke="currentColor" strokeWidth="8" />
                  <line x1="100" y1="0" x2="0" y2="100" stroke="currentColor" strokeWidth="8" />
                </svg>
              </div> 
              Booked
            </div>
          </div>
        </div>
      </div>

      <div className="p-0 overflow-x-auto overflow-y-hidden relative scroll-smooth touch-pan-x" style={{ scrollbarWidth: 'thin' }}>
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="animate-spin mb-3 text-primary" size={32} />
            <p className="font-medium">Loading timeline...</p>
          </div>
        ) : rooms.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-medium">No rooms found.</div>
        ) : (
          <div className="w-max min-w-full pb-32">
            {/* Header row with dates */}
            <div className="flex border-b border-slate-200 bg-slate-100/50 sticky top-0 z-40">
              <div className="w-24 sm:w-32 shrink-0 py-3 px-4 border-r border-slate-200 font-bold text-slate-700 text-sm flex items-center sticky left-0 bg-slate-50 z-50 shadow-[1px_0_5px_rgba(0,0,0,0.02)]">
                Room
              </div>
              {dateRange.map((date, i) => (
                <div key={i} className="flex-1 min-w-[55px] py-2 px-1 text-center border-r border-slate-200 last:border-0 flex flex-col items-center justify-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{format(date, "EEE")}</span>
                  <span className={`text-sm font-black ${isSameDay(date, today) ? "text-primary bg-primary/10 px-2 rounded-full" : "text-slate-800"}`}>
                    {format(date, "dd")}
                  </span>
                </div>
              ))}
            </div>

            {/* Room rows */}
            <div className="divide-y divide-slate-100 relative z-0">
              {rooms.map(room => (
                <div key={room._id} className="flex hover:bg-slate-50/80 transition-colors group">
                  <div className="w-24 sm:w-32 shrink-0 py-2 px-4 border-r border-slate-200 flex flex-col justify-center bg-white group-hover:bg-slate-50/80 transition-colors sticky left-0 z-30 shadow-[1px_0_5px_rgba(0,0,0,0.02)]">
                    <span className="font-bold text-slate-800 text-lg leading-tight">{room.roomNumber}</span>
                    <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate">{room.category}</span>
                  </div>
                  
                  {dateRange.map((date, i) => {
                    const booking = getRoomStatusForDate(room._id, date);
                    const isBooked = !!booking;
                    
                    let isStart = false;
                    let isEnd = false;
                    if (booking) {
                       const bStart = startOfDay(new Date(booking.checkIn)).getTime();
                       const bEnd = startOfDay(new Date(booking.checkOut)).getTime();
                       const tDate = startOfDay(date).getTime();
                       if (tDate === bStart) isStart = true;
                       if (tDate === bEnd - 24 * 60 * 60 * 1000) isEnd = true;
                    }

                    return (
                      <div key={i} className="flex-1 min-w-[55px] p-1 border-r border-slate-100 last:border-0 bg-white">
                        {isBooked ? (
                          <div className="group/tooltip relative h-full w-full z-20 hover:z-50">
                            <div 
                              className={`h-full w-full min-h-[42px] bg-rose-50 flex items-center justify-center relative cursor-help transition-all hover:bg-rose-100
                                ${isStart ? 'rounded-l-md border-l border-rose-300' : 'border-l-0'} 
                                ${isEnd ? 'rounded-r-md border-r border-rose-300' : 'border-r-0'}
                                border-y border-rose-200
                              `}
                            >
                              {/* Cross pattern */}
                              <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
                                <svg className="absolute inset-0 w-full h-full text-rose-400 opacity-40" viewBox="0 0 100 100" preserveAspectRatio="none">
                                  <line x1="0" y1="0" x2="100" y2="100" stroke="currentColor" strokeWidth="4" />
                                  <line x1="100" y1="0" x2="0" y2="100" stroke="currentColor" strokeWidth="4" />
                                </svg>
                              </div>
                              
                              {isStart && (
                                <span className="absolute left-2 z-10 truncate max-w-[calc(100%-8px)] text-[10px] font-bold text-rose-800 bg-white/80 px-1 rounded shadow-sm">
                                  {booking?.guestName?.split(' ')[0] || 'Booked'}
                                </span>
                              )}
                            </div>
                            {/* CSS Tooltip */}
                            <div className="absolute opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-slate-800 text-white text-xs rounded-md shadow-xl p-3 transition-all pointer-events-none">
                              <p className="font-bold mb-1 text-sm">{booking?.guestName}</p>
                              <p className="text-slate-300">Check-in: {format(new Date(booking?.checkIn), "PP")}</p>
                              <p className="text-slate-300">Check-out: {format(new Date(booking?.checkOut), "PP")}</p>
                              {/* Tooltip Arrow */}
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-800"></div>
                            </div>
                          </div>
                        ) : (
                           <Link 
                             href={`/dashboard/billing?checkIn=${format(date, "yyyy-MM-dd")}&checkOut=${format(addDays(date, 1), "yyyy-MM-dd")}`}
                             className="h-full w-full min-h-[42px] bg-emerald-50/60 rounded-md border border-emerald-100/50 hover:border-emerald-300 hover:bg-emerald-100 transition-all flex items-center justify-center group/cell"
                             title="Click to book"
                           >
                              <span className="opacity-0 group-hover/cell:opacity-100 text-xl text-emerald-500 font-light">+</span>
                           </Link>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
