import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { createUser, getUserByEmail, updateUserLogin } from "../../../../lib/db_users";

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            if (!user.email) return false;

            const existingUser = getUserByEmail(user.email);

            if (existingUser) {
                updateUserLogin(user.email);
            } else {
                // First time login - create user
                createUser({
                    id: user.id,
                    email: user.email,
                    name: user.name || "",
                    image: user.image || "",
                    provider: account?.provider || "google"
                });
            }
            return true;
        },
        async session({ session, token }) {
            // Attach user details from DB to session
            if (session.user?.email) {
                const dbUser = getUserByEmail(session.user.email);
                if (dbUser) {
                    (session.user as any).id = dbUser.id;
                    (session.user as any).plan_type = dbUser.plan_type;
                    (session.user as any).credits_total = dbUser.credits_total;
                    (session.user as any).credits_used = dbUser.credits_used;
                }
            }
            return session;
        },
    },

};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
