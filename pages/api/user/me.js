// ============================================================
//  GET /api/user/me
//  Retourne le profil complet + historique de l'utilisateur connecté
// ============================================================

import { getServerSession } from 'next-auth/next';
import { authOptions }      from '../auth/[...nextauth]';
import { supabaseAdmin }    from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Non authentifié' });
  }

  const supabaseId = session.user.supabaseId;

  try {
    // Profil utilisateur
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, discord_username, discord_avatar, credits, total_earned, testimonial_done, created_at')
      .eq('id', supabaseId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    // Historique des transactions (50 dernières)
    const { data: transactions, error: txError } = await supabaseAdmin
      .from('transactions')
      .select('id, type, credits, created_at')
      .eq('user_id', supabaseId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (txError) {
      return res.status(500).json({ error: 'Erreur lors de la récupération des transactions' });
    }

    // Demande de retrait en cours (pending)
    const { data: pendingWithdrawal } = await supabaseAdmin
      .from('withdrawals')
      .select('id, amount_credits, whatsapp_number, status, created_at')
      .eq('user_id', supabaseId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return res.status(200).json({
      user,
      transactions:      transactions || [],
      pendingWithdrawal: pendingWithdrawal || null,
    });

  } catch (err) {
    console.error('API /user/me error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
