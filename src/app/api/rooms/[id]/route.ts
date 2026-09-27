import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Room from "@/models/Room";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const data = await request.json();
    const resolvedParams = await params;
    const { id } = resolvedParams;

    await connectToDatabase();
    
    // Whitelist allowed fields to update
    const updatePayload: any = {};
    if (data.status) updatePayload.status = data.status;
    
    if (data.status === "Occupied") {
      updatePayload.currentGuestName = data.currentGuestName;
      updatePayload.checkInDate = data.checkInDate;
      updatePayload.checkOutDate = data.checkOutDate;
    } else if (data.status === "Available" || data.status === "Maintenance") {
      // Clear guest details if no longer occupied
      updatePayload.$unset = {
        currentGuestName: "",
        checkInDate: "",
        checkOutDate: ""
      };
    }

    const updatedRoom = await Room.findByIdAndUpdate(
      id,
      updatePayload,
      { returnDocument: 'after' }
    );

    if (!updatedRoom) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    return NextResponse.json(updatedRoom);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update room" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    
    await connectToDatabase();
    
    const deletedRoom = await Room.findByIdAndDelete(id);

    if (!deletedRoom) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Room deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete room" }, { status: 500 });
  }
}
