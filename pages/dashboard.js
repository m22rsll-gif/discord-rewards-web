// ============================================================
//  PAGE : /dashboard — Espace membre (protégé)
// ============================================================

import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState }  from 'react';
import { useRouter }             from 'next/router';
import Head                      from 'next/head';
import Image                     from 'next/image';
import Link                      from 'next/link';

const MIN_CREDITS = 10;

const TYPE_LABELS = {
  result:      { label: 'Résultat posté',   badge: 'badge-result',      prefix: '+' },
  testimonial: { label: 'Bonus témoignage', badge: 'badge-testimonial', prefix: '+' },
  withdrawal:  { label: 'Retrait effectué', badge: 'badge-withdrawal',  prefix: ''  },
};

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchUserData();
    }
  }, [status]);

  async function fetchUserData() {
    try {
      setLoading(true);
      const res = await fetch('/api/user/me');
      if (!res.ok) throw new Error('Erreur lors du chargement');
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-discord-darkest flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-discord-blurple border-t-transparent rounded-full animate-spin" />
          <p className="text-discord-muted">Chargement de ta cagnotte…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-discord-darkest flex items-center justify-center">
        <div className="card text-center max-w-md">
          <p className="text-discord-red text-lg mb-4">❌ {error}</p>
          <button onClick={fetchUserData} className="btn-primary">Réessayer</button>
        </div>
      </div>
    );
  }

  const { user, transactions, pendingWithdrawal } = data || {};
  const credits       = user?.credits       ?? 0;
  const totalEarned   = user?.total_earned  ?? 0;
  const progressPct   = Math.min(100, (credits / MIN_CREDITS) * 100);
  const canWithdraw   = credits >= MIN_CREDITS && !pendingWithdrawal;

  return (
    <>
      <Head>
        <title>Mon tableau de bord — Récompenses Discord</title>
      </Head>

      <div className="min-h-screen bg-discord-darkest">
        {/* NAVBAR */}
        <nav className="border-b border-discord-light/20 bg-discord-darker/80 backdrop-blur-md sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <Link href="/dashboard" className="text-white font-bold text-lg">
              🏆 Récompenses
            </Link>
            <div className="flex items-center gap-3">
              {user?.discord_avatar && (
                <Image
                  src={user.discord_avatar}
                  alt={user.discord_username}
                  width={36}
                  height={36}
                  className="rounded-full ring-2 ring-discord-blurple/50"
                />
              )}
              <span className="text-white font-medium hidden sm:block">
                {user?.discord_username}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="btn-secondary text-sm"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </nav>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

          {/* BANNIÈRE RETRAIT EN ATTENTE */}
          {pendingWithdrawal && (
            <div className="bg-discord-yellow/10 border border-discord-yellow/30
                            rounded-xl p-4 flex items-center gap-3">
              <span className="text-2xl">⏳</span>
              <div>
                <p className="text-discord-yellow font-semibold">
                  Retrait de {pendingWithdrawal.amount_credits} crédits en cours de traitement
                </p>
                <p className="text-discord-muted text-sm">
                  Demande soumise le {formatDate(pendingWithdrawal.created_at)}. Le gérant va t&apos;envoyer ton bon Temu sur WhatsApp.
                </p>
              </div>
            </div>
          )}

          {/* HAUT DE PAGE : solde + progression */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">

            {/* Solde principal */}
            <div className="sm:col-span-2 card flex flex-col justify-between gap-6">
              <div>
                <p className="text-discord-muted text-sm font-medium uppercase tracking-wider mb-1">
                  Ta cagnotte
                </p>
                <div className="flex items-end gap-3">
                  <span className="text-7xl font-extrabold text-white leading-none">
                    {credits}
                  </span>
                  <span className="text-discord-muted text-2xl pb-2">
                    crédit{credits !== 1 ? 's' : ''}
                  </span>
                </div>
                <p className="text-discord-muted text-sm mt-2">
                  Total gagné depuis le début :{' '}
                  <span className="text-white font-semibold">{totalEarned} crédits</span>
                </p>
              </div>

              {/* Barre de progression */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-discord-muted">Progression vers le retrait</span>
                  <span className={credits >= MIN_CREDITS ? 'text-discord-green font-semibold' : 'text-white'}>
                    {credits}/{MIN_CREDITS} crédits
                  </span>
                </div>
                <div className="h-3 bg-discord-medium rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700
                                ${credits >= MIN_CREDITS
                                  ? 'bg-discord-green'
                                  : 'bg-gradient-to-r from-discord-blurple to-purple-400'}`}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                {credits < MIN_CREDITS && (
                  <p className="text-discord-muted text-xs mt-2">
                    Plus que {MIN_CREDITS - credits} crédit{MIN_CREDITS - credits > 1 ? 's' : ''} pour débloquer ton bon Temu !
                  </p>
                )}
              </div>

              {/* Bouton retrait */}
              <Link
                href={canWithdraw ? '/retrait' : '#'}
                className={`btn-primary text-center inline-block
                            ${!canWithdraw ? 'opacity-40 pointer-events-none cursor-not-allowed' : ''}`}
              >
                {pendingWithdrawal
                  ? '⏳ Retrait en attente'
                  : credits >= MIN_CREDITS
                    ? '🎁 Demander mon bon Temu'
                    : `🔒 Retrait disponible à 10 crédits`}
              </Link>
            </div>

            {/* Stats rapides */}
            <div className="flex flex-col gap-4">
              <div className="card flex-1 flex flex-col justify-center text-center">
                <div className="text-3xl mb-1">
                  {user?.testimonial_done ? '✅' : '🎥'}
                </div>
                <p className="text-white font-semibold text-sm">
                  Bonus témoignage
                </p>
                <p className={`text-xs mt-1 font-medium ${user?.testimonial_done ? 'text-discord-green' : 'text-discord-muted'}`}>
                  {user?.testimonial_done ? 'Obtenu (+10 crédits)' : 'Non encore obtenu'}
                </p>
              </div>
              <div className="card flex-1 flex flex-col justify-center text-center">
                <div className="text-3xl mb-1">📅</div>
                <p className="text-white font-semibold text-sm">Membre depuis</p>
                <p className="text-discord-muted text-xs mt-1">
                  {user?.created_at
                    ? new Date(user.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
                    : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* COMMENT GAGNER DES CRÉDITS */}
          <div className="card">
            <h2 className="text-white font-bold text-lg mb-4">Comment gagner plus de crédits ?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 bg-discord-blurple/10 rounded-lg p-4">
                <span className="text-2xl">📸</span>
                <div>
                  <p className="text-white font-semibold">+1 crédit / jour</p>
                  <p className="text-discord-muted text-sm">Poste un résultat dans le salon dédié</p>
                </div>
              </div>
              <div className={`flex items-start gap-3 rounded-lg p-4 ${user?.testimonial_done ? 'bg-discord-medium/50 opacity-60' : 'bg-purple-500/10'}`}>
                <span className="text-2xl">🎥</span>
                <div>
                  <p className="text-white font-semibold">
                    +10 crédits {user?.testimonial_done && <span className="text-discord-green">(déjà obtenu)</span>}
                  </p>
                  <p className="text-discord-muted text-sm">
                    {user?.testimonial_done
                      ? 'Bonus témoignage déjà accordé'
                      : 'Poste une vidéo témoignage dans le salon témoignages'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* HISTORIQUE DES TRANSACTIONS */}
          <div className="card">
            <h2 className="text-white font-bold text-lg mb-5">Historique des transactions</h2>

            {transactions && transactions.length > 0 ? (
              <div className="space-y-2">
                {transactions.map((tx) => {
                  const info = TYPE_LABELS[tx.type] || { label: tx.type, badge: '', prefix: '+' };
                  return (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between py-3 px-4
                                 bg-discord-medium/50 rounded-lg hover:bg-discord-medium
                                 transition-colors duration-150"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`badge ${info.badge}`}>{info.label}</span>
                        <span className="text-discord-muted text-sm hidden sm:block">
                          {formatDate(tx.created_at)}
                        </span>
                      </div>
                      <span
                        className={`font-bold text-sm ${
                          tx.credits > 0 ? 'text-discord-green' : 'text-discord-red'
                        }`}
                      >
                        {tx.credits > 0 ? '+' : ''}{tx.credits} crédit{Math.abs(tx.credits) > 1 ? 's' : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">💤</div>
                <p className="text-discord-muted">Aucune transaction pour le moment.</p>
                <p className="text-discord-muted text-sm mt-1">
                  Commence par poster un résultat dans le salon Discord !
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
