// ============================================================
//  POST /api/withdraw/request
//  Soumet une demande de retrait
// ============================================================

import { getServerSession } from 'next-auth/next';
import { authOptions }      from '../auth/[...nextauth]';
import { supabaseAdmin }    from '../../../lib/supabase';

const MIN_CREDITS = 10;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Non authentifié' });
  }

  const { whatsapp } = req.body;

  // Validation du numéro WhatsApp
  if (!whatsapp || typeof whatsapp !== 'string') {
    return res.status(400).json({ error: 'Numéro WhatsApp requis' });
  }
  const cleanWhatsapp = whatsapp.replace(/\s/g, '').trim();
  if (!/^\+?[0-9]{7,15}$/.test(cleanWhatsapp)) {
    return res.status(400).json({ error: 'Numéro WhatsApp invalide' });
  }

  const supabaseId = session.user.supabaseId;

  try {
    // Récupérer le solde actuel
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, credits, whatsapp')
      .eq('id', supabaseId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    if (user.credits < MIN_CREDITS) {
      return res.status(400).json({
        error: `Crédits insuffisants. Minimum requis : ${MIN_CREDITS} crédits.`,
        currentCredits: user.credits,
      });
    }

    // Vérifier qu'il n'y a pas déjà une demande en attente
    const { data: existing } = await supabaseAdmin
      .from('withdrawals')
      .select('id')
      .eq('user_id', supabaseId)
      .eq('status', 'pending')
      .limit(1)
      .maybeSingle();

    if (existing) {
      return res.status(409).json({
        error: 'Tu as déjà une demande de retrait en attente. Attends qu\'elle soit traitée.',
      });
    }

    // Créer la demande de retrait
    // Note : les crédits ne sont déduits qu'à la validation par l'admin
    const { data: withdrawal, error: wError } = await supabaseAdmin
      .from('withdrawals')
      .insert({
        user_id:        supabaseId,
        amount_credits: user.credits, // on retire tous les crédits disponibles
        whatsapp_number: cleanWhatsapp,
        status:          'pending',
      })
      .select()
      .single();

    if (wError) {
      return res.status(500).json({ error: 'Erreur lors de la création du retrait' });
    }

    // Sauvegarder le numéro WhatsApp dans le profil si pas encore renseigné
    if (!user.whatsapp) {
      await supabaseAdmin
        .from('users')
        .update({ whatsapp: cleanWhatsapp })
        .eq('id', supabaseId);
    }

    return res.status(201).json({
      message:    'Demande de retrait soumise avec succès !',
      withdrawal: {
        id:             withdrawal.id,
        amount_credits: withdrawal.amount_credits,
        status:         withdrawal.status,
        created_at:     withdrawal.created_at,
      },
    });

  } catch (err) {
    console.error('API /withdraw/request error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
