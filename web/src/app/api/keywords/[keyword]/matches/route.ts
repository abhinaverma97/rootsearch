import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { getUserByEmail } from "../../../../../lib/db_users";

const API_BASE_URL = 'http://localhost:8000';

export async function GET(
    req: NextRequest,
    { params }: { params: { keyword: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = getUserByEmail(session.user.email);
    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    try {
        const { keyword } = params;
        const response = await fetch(`${API_BASE_URL}/keywords/matches?keyword=${encodeURIComponent(keyword)}&user_id=${user.id}`);
        if (!response.ok) throw new Error("Backend error");
        const data = await response.json();
        return NextResponse.json(data);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
