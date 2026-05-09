import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const ALLOWED_EMAILS = (
  process.env.ALLOWED_EMAILS ?? "qa.devadutta@gmail.com,talk2devdmohapatra@gmail.com"
)
  .split(",")
  .map((e) => e.trim().toLowerCase());

const isDev = process.env.NODE_ENV === "development";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ user }) {
      const email = user.email?.toLowerCase() ?? "";
      const allowed = isDev || ALLOWED_EMAILS.includes(email);
      if (!allowed) {
        console.warn(`[auth] Blocked sign-in attempt from: ${email}`);
        return false;
      }
      console.log(`[auth] Signed in: ${email}`);
      return true;
    },
    async session({ session }) {
      return session;
    },
    async jwt({ token }) {
      return token;
    },
  },
});
