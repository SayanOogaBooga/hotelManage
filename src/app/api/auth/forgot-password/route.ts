import { NextResponse } from "next/server";
import crypto from "crypto";
import { User } from "@/models/User";
import connectToDatabase from "@/lib/mongodb";
import { Resend } from "resend";

// Resend setup (requires RESEND_API_KEY in .env.local)
const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy");

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

    await connectToDatabase();
    
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't leak whether a user exists or not for security
      return NextResponse.json({ message: "If your email exists, a reset link was sent." });
    }

    // Generate token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    // Save token to DB with 1-hour expiration
    user.resetToken = hashedToken;
    user.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    // Create reset link
    const resetUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/reset-password/${resetToken}`;

    // Send Email using Resend
    let emailSent = false;
    let resendError = null;

    if (process.env.RESEND_API_KEY) {
      const { data, error } = await resend.emails.send({
        from: "Heaven Valley Retreat <onboarding@resend.dev>", // Replace with verified domain in production
        to: user.email,
        subject: "Password Reset Request",
        html: `
          <h2>Password Reset</h2>
          <p>You requested a password reset for your Heaven Valley Retreat management account.</p>
          <p>Please click the button below to reset your password. This link will expire in 1 hour.</p>
          <a href="${resetUrl}" style="display:inline-block;padding:10px 20px;background-color:#22c55e;color:white;text-decoration:none;border-radius:5px;margin-top:10px;">Reset Password</a>
          <p style="margin-top:20px;font-size:12px;color:#666;">If you didn't request this, you can safely ignore this email.</p>
        `,
      });

      if (error) {
        console.error("Resend API Error:", error);
        resendError = error.message;
      } else {
        emailSent = true;
      }
    } else {
      console.warn("RESEND_API_KEY is not set. Reset URL:", resetUrl);
    }

    // For testing/development purposes, return the link if email fails or we're in dev mode without an API key
    if (!emailSent) {
      return NextResponse.json({ 
        message: "Email sending failed or API key missing. Here is your dev link:", 
        devResetLink: resetUrl,
        errorDetails: resendError
      });
    }

    return NextResponse.json({ message: "If your email exists, a reset link was sent." });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
