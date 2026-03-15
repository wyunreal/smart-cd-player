import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import type { Provider } from "next-auth/providers";

const providers: Provider[] = [
  Google({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    authorization: {
      params: {
        prompt: "consent",
        access_type: "offline",
        response_type: "code",
      },
    },
    profile(profile) {
      return {
        id: profile.sub,
        name: profile.name,
        email: profile.email,
        image: profile.picture,
      };
    },
  }),
];

export const providerMap = providers.map((provider) => {
  if (typeof provider === "function") {
    const providerData = provider();
    return { id: providerData.id, name: providerData.name };
  }
  return { id: provider.id, name: provider.name };
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
    updateAge: 24 * 60 * 60, // Re-issue token every 24 hours
  },
  callbacks: {
    async signIn({ user }) {
      const allowedEmails = process.env.ALLOWED_EMAILS;
      if (!allowedEmails || !allowedEmails.trim()) {
        return false;
      }
      const emailSet = new Set(
        allowedEmails.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean),
      );
      if (emailSet.size === 0) {
        return false;
      }
      return emailSet.has(user.email?.toLowerCase() || "");
    },
    async jwt({ token, user, profile }) {
      if (user) {
        token.picture = user.image;
      }
      if (profile && profile.picture) {
        token.picture = profile.picture;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.image = token.picture as string;
      }
      return session;
    },
    authorized({ auth: session, request: { nextUrl } }) {
      const isLoggedIn = !!session?.user;
      const isPublicPage = nextUrl.pathname.startsWith("/public");
      const isAuthPage = nextUrl.pathname.startsWith("/auth");

      if (isPublicPage || isAuthPage || isLoggedIn) {
        return true;
      }

      return false;
    },
  },
});
