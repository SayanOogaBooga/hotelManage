import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Room from "@/models/Room";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectToDatabase();
    const rooms = await Room.find({}).sort({ roomNumber: 1 });
    return NextResponse.json(rooms);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch rooms" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { roomNumber, status } = await request.json();
    
    if (!roomNumber) {
      return NextResponse.json({ error: "Room number is required" }, { status: 400 });
    }

    await connectToDatabase();
    
    // Check if room already exists
    const existingRoom = await Room.findOne({ roomNumber });
    if (existingRoom) {
      return NextResponse.json({ error: "Room already exists" }, { status: 400 });
    }

    const newRoom = await Room.create({ roomNumber, status: status || "Available" });
    return NextResponse.json(newRoom, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create room" }, { status: 500 });
  }
}
