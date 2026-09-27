import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Room from "@/models/Room";
import Booking from "@/models/Booking";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectToDatabase();

    const [rooms, bookings] = await Promise.all([
      Room.find({}),
      Booking.find({}).sort({ createdAt: -1 })
    ]);

    const availableRooms = rooms.filter(r => r.status === "Available").length;
    const occupiedRooms = rooms.filter(r => r.status === "Occupied").length;
    
    // Calculate total revenue from all bookings
    const totalRevenue = bookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);

    // Get 5 most recent bookings for the table
    const recentBookings = bookings.slice(0, 5);

    return NextResponse.json({
      stats: {
        availableRooms,
        occupiedRooms,
        totalRooms: rooms.length,
        totalRevenue
      },
      recentBookings
    });
  } catch (error) {
    console.error("Dashboard fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
