import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import { User } from "@/models/User";
import bcrypt from "bcryptjs";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, email, password, role, permissions } = await req.json();

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    await connectToDatabase();
    
    // In Next 15, params is a promise. We await it.
    const resolvedParams = await params;
    
    const userToUpdate = await User.findById(resolvedParams.id);
    if (!userToUpdate) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if new email conflicts with another user
    if (email.toLowerCase() !== userToUpdate.email) {
      const existingEmail = await User.findOne({ email: email.toLowerCase() });
      if (existingEmail) {
        return NextResponse.json({ error: "Email already in use by another user" }, { status: 400 });
      }
    }

    userToUpdate.name = name;
    userToUpdate.email = email.toLowerCase();
    userToUpdate.role = role || "STAFF";
    userToUpdate.permissions = permissions || userToUpdate.permissions;

    if (password) {
      userToUpdate.password = await bcrypt.hash(password, 10);
    }

    await userToUpdate.save();

    const userObj = userToUpdate.toObject();
    delete userObj.password;

    return NextResponse.json(userObj, { status: 200 });
  } catch (error) {
    console.error("Failed to update user:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
