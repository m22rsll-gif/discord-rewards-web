// POST /api/admin/reset-credits
import { getServerSession } from 'next-auth/next';
import { authOptions }      from '../auth/[...nextauth]';
import { supabaseAdmin }    from '../../../lib/supabase';

function isAdmin(session) {
  return session?.user?.discordId === process.env.ADMIN_DISCORD_ID;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const session = await getServerSession(req, res, authOptions);
  if (!session || !isAdmin(session)) return res.status(403).json({ error: 'Accès refusé' });

  const { userId, resetTestimonial = false } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId requis' });

  try {
    const { data: user, error: fetchError } = await supabaseAdmin
      .from('users').select('id, discord_username, credits, total_earned').eq('id', userId).single();
    if (fetchError || !user) return res.status(404).json({ error: 'Utilisateur introuvable' });

    const updatePayload = { credits: 0, total_earned: 0 };
    if (resetTestimonial) updatePayload.testimonial_done = false;

    const { error: updateError } = await supabaseAdmin.from('users').update(updatePayload).eq('id', userId);
    if (updateError) return res.status(500).json({ error: 'Erreur lors de la réinitialisation' });

    await supabaseAdmin.from('withdrawals').update({ status: 'rejected' }).eq('user_id', userId).eq('status', 'pending');

    if (user.credits > 0) {
      await supabaseAdmin.from('transactions').insert({ user_id: userId, type: 'admin_reset', credits: -user.credits, discord_message_id: null });
    }

    return res.status(200).json({
      message: `Cagnotte de ${user.discord_username} réinitialisée avec succès.`,
      user: { id: user.id, discord_username: user.discord_username, credits_before: user.credits },
    });
  } catch (err) {
    console.error('API /admin/reset-credits error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
