import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { getSavedItems, saveItem, unsaveItem, getUserByEmail } from "../../../lib/db_users";

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = getUserByEmail(session.user.email);
    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const items = getSavedItems(user.id);
    return NextResponse.json(items);
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
        const { opportunityId, data } = await req.json();
        if (!opportunityId || !data) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        saveItem(user.id, opportunityId, data);
        return NextResponse.json({ status: "success" });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = getUserByEmail(session.user.email);
    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    try {
        const { opportunityId } = await req.json();
        if (!opportunityId) {
            return NextResponse.json({ error: "Missing opportunityId" }, { status: 400 });
        }

        unsaveItem(user.id, opportunityId);
        return NextResponse.json({ status: "success" });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
