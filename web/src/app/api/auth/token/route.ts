
import { getServerSession } from "next-auth";
import { authOptions } from "../[...nextauth]/route";
import { SignJWT } from "jose";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const secret = new TextEncoder().encode(
        process.env.NEXTAUTH_SECRET || "supersecretkey"
    );

    const token = await new SignJWT({
        sub: (session.user as any).id,
        email: session.user.email,
        plan_type: (session.user as any).plan_type || 'free'
    })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("1h")
        .sign(secret);

    return NextResponse.json({ token });
}
