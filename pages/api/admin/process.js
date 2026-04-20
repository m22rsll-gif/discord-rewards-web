// ============================================================
//  POST /api/admin/process
//  Traite une demande de retrait : pay ou reject (admin seulement)
// ============================================================

import { getServerSession } from 'next-auth/next';
import { authOptions }      from '../auth/[...nextauth]';
import { supabaseAdmin }    from '../../../lib/supabase';

function isAdmin(session) {
  return session?.user?.discordId === process.env.ADMIN_DISCORD_ID;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session || !isAdmin(session)) {
    return res.status(403).json({ error: 'Accès refusé' });
  }

  const { withdrawalId, action } = req.body;

  if (!withdrawalId || !['pay', 'reject'].includes(action)) {
    return res.status(400).json({ error: 'withdrawalId et action (pay|reject) requis' });
  }

  try {
    // Récupérer le retrait
    const { data: withdrawal, error: fetchError } = await supabaseAdmin
      .from('withdrawals')
      .select('id, user_id, amount_credits, status')
      .eq('id', withdrawalId)
      .single();

    if (fetchError || !withdrawal) {
      return res.status(404).json({ error: 'Demande de retrait introuvable' });
    }

    if (withdrawal.status !== 'pending') {
      return res.status(409).json({ error: 'Cette demande a déjà été traitée' });
    }

    if (action === 'pay') {
      // Marquer comme payé + déduire les crédits
      const { error: withdrawalUpdateError } = await supabaseAdmin
        .from('withdrawals')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('id', withdrawalId);

      if (withdrawalUpdateError) throw withdrawalUpdateError;

      // Déduire les crédits
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('credits')
        .eq('id', withdrawal.user_id)
        .single();

      const newCredits = Math.max(0, (user?.credits ?? 0) - withdrawal.amount_credits);

      const { error: userUpdateError } = await supabaseAdmin
        .from('users')
        .update({ credits: newCredits })
        .eq('id', withdrawal.user_id);

      if (userUpdateError) throw userUpdateError;

      // Logger la transaction de retrait
      await supabaseAdmin.from('transactions').insert({
        user_id: withdrawal.user_id,
        type:    'withdrawal',
        credits: -withdrawal.amount_credits,
      });

      return res.status(200).json({
        message: `Retrait de ${withdrawal.amount_credits} crédits marqué comme payé.`,
        action:  'paid',
      });

    } else {
      // Rejeter — crédits non déduits (ils n'avaient pas été bloqués)
      const { error: rejectError } = await supabaseAdmin
        .from('withdrawals')
        .update({ status: 'rejected' })
        .eq('id', withdrawalId);

      if (rejectError) throw rejectError;

      return res.status(200).json({
        message: 'Demande rejetée.',
        action:  'rejected',
      });
    }

  } catch (err) {
    console.error('API /admin/process error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
