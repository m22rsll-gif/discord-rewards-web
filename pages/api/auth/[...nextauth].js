// ============================================================
//  pages/api/auth/[...nextauth].js
//  Authentification Discord via NextAuth.js
// ============================================================

import NextAuth from 'next-auth';
import DiscordProvider from 'next-auth/providers/discord';
import { supabaseAdmin } from '../../../lib/supabase';

export const authOptions = {
  providers: [
    DiscordProvider({
      clientId:     process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      authorization: { params: { scope: 'identify' } },
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    /**
     * Appelé après une connexion réussie.
     * On upsert l'utilisateur dans Supabase et on stocke son UUID interne.
     */
    async signIn({ user, account, profile }) {
      try {
        const discordId       = profile.id;
        const discordUsername = profile.username;
        const discordAvatar   = profile.avatar
          ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
          : `https://cdn.discordapp.com/embed/avatars/${parseInt(profile.discriminator || '0') % 5}.png`;

        const { data, error } = await supabaseAdmin
          .from('users')
          .upsert(
            {
              discord_id:       discordId,
              discord_username: discordUsername,
              discord_avatar:   discordAvatar,
            },
            { onConflict: 'discord_id', ignoreDuplicates: false }
          )
          .select('id')
          .single();

        if (error) {
          console.error('Supabase upsert error:', error);
          return false;
        }

        // Stocker l'UUID interne dans l'objet user pour les callbacks suivants
        user.supabaseId  = data.id;
        user.discordId   = discordId;
        user.discordAvatar = discordAvatar;
        return true;

      } catch (err) {
        console.error('SignIn callback error:', err);
        return false;
      }
    },

    /**
     * Enrichit le JWT avec les infos Discord/Supabase.
     */
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.supabaseId    = user.supabaseId;
        token.discordId     = user.discordId;
        token.discordAvatar = user.discordAvatar;
      }
      return token;
    },

    /**
     * Expose les données dans la session côté client.
     */
    async session({ session, token }) {
      session.user.supabaseId    = token.supabaseId;
      session.user.discordId     = token.discordId;
      session.user.discordAvatar = token.discordAvatar;
      return session;
    },
  },

  pages: {
    signIn: '/',
    error:  '/',
  },

  session: {
    strategy: 'jwt',
    maxAge:   30 * 24 * 60 * 60, // 30 jours
  },
};

export default NextAuth(authOptions);
