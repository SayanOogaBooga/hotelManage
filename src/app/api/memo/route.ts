import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Booking from "@/models/Booking";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectToDatabase();
    
    const lastBooking = await Booking.findOne().sort({ createdAt: -1 });
    let nextMemoNumber = 1001;
    
    if (lastBooking && lastBooking.memoNo) {
      const match = lastBooking.memoNo.match(/\d+$/);
      if (match) {
        nextMemoNumber = parseInt(match[0], 10) + 1;
      } else {
        const count = await Booking.countDocuments();
        nextMemoNumber = 1001 + count;
      }
    }
    
    const newMemoNo = `INV-${nextMemoNumber}`;
    return NextResponse.json({ memoNo: newMemoNo }, { status: 200 });
  } catch (error: any) {
    console.error("Error generating memo no:", error);
    return NextResponse.json({ error: "Failed to generate memo no" }, { status: 500 });
  }
}
