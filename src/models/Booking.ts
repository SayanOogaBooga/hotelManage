import mongoose, { Schema, Document } from "mongoose";

export interface IParticular {
  slNo: number;
  description: string;
  noOfHead: number;
  ratePerHeadDay: number;
  amount: number;
}

export interface IBooking extends Document {
  memoNo: string;
  date: Date;
  guestName: string;
  address: string;
  mobileNo: string;
  checkIn: Date;
  checkOut: Date;
  roomsBooked: mongoose.Types.ObjectId[];
  particulars: IParticular[];
  subTotal: number;
  gst: number;
  totalAmount: number;
  amountInWords: string;
  advancePayment: number;
  remainingAmount: number;
  paymentMode: "Cash" | "UPI" | "Bank Transfer" | "Others";
  bookedBy?: string;
}

const ParticularSchema = new Schema<IParticular>({
  slNo: { type: Number, required: true },
  description: { type: String, required: true }, // 'Room Rent', 'Food', etc.
  noOfHead: { type: Number, required: true },
  ratePerHeadDay: { type: Number, required: true },
  amount: { type: Number, required: true },
});

const BookingSchema = new Schema<IBooking>({
  memoNo: { type: String, required: true, unique: true },
  date: { type: Date, required: true, default: Date.now },
  guestName: { type: String, required: true },
  address: { type: String, required: false },
  mobileNo: { type: String, required: true },
  checkIn: { type: Date, required: false },
  checkOut: { type: Date, required: false },
  roomsBooked: [{ type: Schema.Types.ObjectId, ref: "Room" }],
  particulars: [ParticularSchema],
  subTotal: { type: Number, required: true },
  gst: { type: Number, required: true, default: 0 },
  totalAmount: { type: Number, required: true },
  amountInWords: { type: String, required: true },
  advancePayment: { type: Number, required: false, default: 0 },
  remainingAmount: { type: Number, required: false, default: 0 },
  paymentMode: { 
    type: String, 
    enum: ["Cash", "UPI", "Bank Transfer", "Others"], 
    required: true 
  },
  bookedBy: { type: String, required: false },
}, { timestamps: true });

if (mongoose.models.Booking) {
  delete mongoose.models.Booking;
}
export default mongoose.model<IBooking>("Booking", BookingSchema);
