import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Booking from "@/models/Booking";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    await connectToDatabase();
    
    // Ensure memoNo is unique. In a real app, you might auto-increment this.
    // For now, we trust the input but handle duplicates gracefully.
    const existing = await Booking.findOne({ memoNo: data.memoNo });
    if (existing) {
      return NextResponse.json({ error: "Memo No already exists. Please use a unique Memo No." }, { status: 400 });
    }

    const newBooking = await Booking.create(data);
    
    return NextResponse.json(newBooking, { status: 201 });
  } catch (error: any) {
    console.error("Booking creation error:", error);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectToDatabase();
    // Fetch bookings sorted by newest first
    const bookings = await Booking.find().sort({ createdAt: -1 });
    return NextResponse.json(bookings, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}
