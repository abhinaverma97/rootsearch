import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { getCollections, createCollection, getUserByEmail } from "../../../lib/db_users";

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = getUserByEmail(session.user.email);
    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const collections = getCollections(user.id);
    return NextResponse.json(collections);
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

    // Enforce Free Limit (Max 1 Collection)
    if (user.plan_type !== 'pro') {
        const currentCollections = getCollections(user.id);
        if (currentCollections.length >= 1) {
            return NextResponse.json({ error: "Free Plan limited to 1 collection." }, { status: 403 });
        }
    }

    try {
        const { name, boards } = await req.json();
        if (!name || !boards) {
            return NextResponse.json({ error: "Missing name or boards" }, { status: 400 });
        }

        createCollection(user.id, name, boards);
        return NextResponse.json({ status: "success" });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
