import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { deleteCollection, getUserByEmail } from "../../../../lib/db_users";

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ name: string }> }
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
        const { name } = await params;
        const decodedName = decodeURIComponent(name);
        deleteCollection(user.id, decodedName);
        return NextResponse.json({ status: "success" });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
