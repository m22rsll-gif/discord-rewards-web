// GET /api/admin/users
import { getServerSession } from 'next-auth/next';
import { authOptions }      from '../auth/[...nextauth]';
import { supabaseAdmin }    from '../../../lib/supabase';

function isAdmin(session) {
  return session?.user?.discordId === process.env.ADMIN_DISCORD_ID;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const session = await getServerSession(req, res, authOptions);
  if (!session || !isAdmin(session)) return res.status(403).json({ error: 'Accès refusé' });

  const { search = '' } = req.query;

  try {
    let query = supabaseAdmin
      .from('users')
      .select('id, discord_id, discord_username, discord_avatar, credits, total_earned, testimonial_done, created_at')
      .order('credits', { ascending: false })
      .limit(50);

    if (search.trim()) {
      query = query.ilike('discord_username', `%${search.trim()}%`);
    }

    const { data: users, error } = await query;
    if (error) throw error;

    return res.status(200).json({ users: users || [] });
  } catch (err) {
    console.error('API /admin/users error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
