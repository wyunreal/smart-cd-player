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
  callbacks: {
    async jwt({ token, user, profile }) {
      // En el primer inicio de sesión, incluir la imagen del usuario
      if (user) {
        token.picture = user.image;
      }
      // También desde el profile de OAuth
      if (profile && profile.picture) {
        token.picture = profile.picture;
      }
      return token;
    },
    async session({ session, token }) {
      // Incluir la imagen del token JWT en la sesión
      if (session.user) {
        session.user.image = token.picture as string;
      }
      return session;
    },
    authorized({ auth: session, request: { nextUrl } }) {
      const isLoggedIn = !!session?.user;
      const isPublicPage = nextUrl.pathname.startsWith("/public");
      const isAuthPage = nextUrl.pathname.startsWith("/auth");
      const isApiPage = nextUrl.pathname.startsWith("/api");

      if (isPublicPage || isAuthPage || isApiPage || isLoggedIn) {
        return true;
      }

      return false; // Redirect unauthenticated users to login page
    },
  },
});
