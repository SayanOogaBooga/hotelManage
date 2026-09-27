import mongoose, { Schema, Document } from "mongoose";

export interface IRoom extends Document {
  roomNumber: string;
  status: "Available" | "Occupied" | "Maintenance";
  currentGuestName?: string;
  checkInDate?: Date;
  checkOutDate?: Date;
}

const RoomSchema = new Schema<IRoom>({
  roomNumber: { type: String, required: true, unique: true },
  status: { 
    type: String, 
    enum: ["Available", "Occupied", "Maintenance"],
    default: "Available"
  },
  currentGuestName: { type: String },
  checkInDate: { type: Date },
  checkOutDate: { type: Date }
}, { timestamps: true });

export default mongoose.models.Room || mongoose.model<IRoom>("Room", RoomSchema);
