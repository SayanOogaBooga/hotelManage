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

export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 });
    }

    const data = await request.json();
    await connectToDatabase();
    
    // Check if memoNo is unique (if they changed it)
    if (data.memoNo) {
      const existing = await Booking.findOne({ memoNo: data.memoNo, _id: { $ne: id } });
      if (existing) {
        return NextResponse.json({ error: "Memo No already exists. Please use a unique Memo No." }, { status: 400 });
      }
    }

    const updatedBooking = await Booking.findByIdAndUpdate(id, data, { new: true });
    
    if (!updatedBooking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    return NextResponse.json(updatedBooking, { status: 200 });
  } catch (error: any) {
    console.error("Booking update error:", error);
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    await connectToDatabase();

    if (id) {
      const booking = await Booking.findById(id).populate("roomsBooked", "roomNumber category");
      if (!booking) {
        return NextResponse.json({ error: "Booking not found" }, { status: 404 });
      }
      return NextResponse.json(booking, { status: 200 });
    }

    // Fetch all bookings sorted by newest first
    const bookings = await Booking.find().populate("roomsBooked", "roomNumber category").sort({ createdAt: -1 });
    return NextResponse.json(bookings, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 });
    }

    await connectToDatabase();
    
    const deletedBooking = await Booking.findByIdAndDelete(id);
    if (!deletedBooking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Booking deleted successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("Error deleting booking:", error);
    return NextResponse.json({ error: "Failed to delete booking" }, { status: 500 });
  }
}
