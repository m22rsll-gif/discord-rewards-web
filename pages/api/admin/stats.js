// ============================================================
//  GET /api/admin/stats
//  Statistiques globales de la communauté (admin seulement)
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

  try {
    // Total membres inscrits
    const { count: totalMembers } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Total crédits distribués (sum of total_earned)
    const { data: earnedData } = await supabaseAdmin
      .from('users')
      .select('total_earned');

    const totalDistributed = (earnedData || []).reduce(
      (sum, u) => sum + (u.total_earned || 0), 0
    );

    // Total crédits en circulation (sum of credits)
    const { data: creditsData } = await supabaseAdmin
      .from('users')
      .select('credits');

    const totalCirculating = (creditsData || []).reduce(
      (sum, u) => sum + (u.credits || 0), 0
    );

    // Retraits par statut
    const { data: withdrawalStats } = await supabaseAdmin
      .from('withdrawals')
      .select('status, amount_credits');

    const withdrawalsByStatus = { pending: 0, paid: 0, rejected: 0 };
    const withdrawalAmounts   = { pending: 0, paid: 0, rejected: 0 };

    (withdrawalStats || []).forEach((w) => {
      withdrawalsByStatus[w.status] = (withdrawalsByStatus[w.status] || 0) + 1;
      withdrawalAmounts[w.status]   = (withdrawalAmounts[w.status]   || 0) + w.amount_credits;
    });

    // Membres avec le bonus témoignage
    const { count: testimonialCount } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('testimonial_done', true);

    return res.status(200).json({
      totalMembers:     totalMembers || 0,
      totalDistributed,
      totalCirculating,
      testimonialDone:  testimonialCount || 0,
      withdrawals: {
        counts:  withdrawalsByStatus,
        credits: withdrawalAmounts,
      },
    });

  } catch (err) {
    console.error('API /admin/stats error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
