// ============================================================
//  POST /api/withdraw/request
//  Soumet une demande de retrait
// ============================================================

import { getServerSession } from 'next-auth/next';
import { authOptions }      from '../auth/[...nextauth]';
import { supabaseAdmin }    from '../../../lib/supabase';

const MIN_CREDITS = 20;

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
