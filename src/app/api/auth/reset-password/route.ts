import { NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { User } from "@/models/User";
import connectToDatabase from "@/lib/mongodb";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    await connectToDatabase();
    
    // Hash the raw token to compare with DB
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetToken: hashedToken,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return NextResponse.json({ error: "Token is invalid or has expired" }, { status: 400 });
    }

    // Update password
    const newHashedPassword = await bcrypt.hash(password, 10);
    user.password = newHashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    
    await user.save();

    return NextResponse.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
