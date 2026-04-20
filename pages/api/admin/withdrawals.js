// ============================================================
//  GET /api/admin/withdrawals
//  Liste les demandes de retrait (admin seulement)
// ============================================================

import { getServerSession } from 'next-auth/next';
import { authOptions }      from '../auth/[...nextauth]';
import { supabaseAdmin }    from '../../../lib/supabase';

function isAdmin(session) {
  return session?.user?.discordId === process.env.ADMIN_DISCORD_ID;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session || !isAdmin(session)) {
    return res.status(403).json({ error: 'Accès refusé' });
  }

  const { status = 'pending' } = req.query;

  try {
    const { data: withdrawals, error } = await supabaseAdmin
      .from('withdrawals')
      .select(`
        id,
        amount_credits,
        whatsapp_number,
        status,
        created_at,
        paid_at,
        users (
          discord_id,
          discord_username,
          discord_avatar,
          credits
        )
      `)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Erreur base de données' });
    }

    return res.status(200).json({ withdrawals });

  } catch (err) {
    console.error('API /admin/withdrawals error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
