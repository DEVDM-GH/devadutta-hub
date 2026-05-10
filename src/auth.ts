import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

// On Vercel, never use a localhost AUTH_URL from a copied .env — OAuth would redirect there.
if (process.env.VERCEL_URL) {
  const authUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL;
  if (authUrl?.includes("localhost")) {
    delete process.env.AUTH_URL;
    delete process.env.NEXTAUTH_URL;
  }
}

const ALLOWED_EMAILS = (
  process.env.ALLOWED_EMAILS ?? "qa.devadutta@gmail.com,talk2devdmohapatra@gmail.com"
)
  .split(",")
  .map((e) => e.trim().toLowerCase());

const isDev = process.env.NODE_ENV === "development";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
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
