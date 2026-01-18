import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { getUserByEmail } from "../../../lib/db_users";

import { SignJWT } from "jose";

const API_BASE_URL = 'http://localhost:8000';

async function generateToken(user: any) {
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "supersecretkey");
    return new SignJWT({
        sub: user.id,
        email: user.email,
        plan_type: user.plan_type || 'free'
    })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("5m") // Short lived for internal call
        .sign(secret);
}

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = getUserByEmail(session.user.email);
    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    try {
        // We don't strictly need token for GET logic per app.py but let's be consistent if we ever protect it
        const response = await fetch(`${API_BASE_URL}/keywords?user_id=${user.id}`);
        if (!response.ok) throw new Error("Backend error");
        const data = await response.json();
        return NextResponse.json(data);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = getUserByEmail(session.user.email);
    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    try {
        const payload = await req.json();
        const token = await generateToken(user);

        const response = await fetch(`${API_BASE_URL}/keywords?user_id=${user.id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error("Backend error");
        const data = await response.json();
        return NextResponse.json(data);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
