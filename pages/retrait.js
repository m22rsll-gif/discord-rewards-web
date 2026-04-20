// ============================================================
//  PAGE : /retrait — Formulaire de retrait (protégé)
// ============================================================

import { useSession }         from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter }           from 'next/router';
import Head                    from 'next/head';
import Link                    from 'next/link';

const STATUS_INFO = {
  pending:  { label: 'En attente',         color: 'text-discord-yellow', icon: '⏳', bg: 'bg-discord-yellow/10 border-discord-yellow/30' },
  paid:     { label: 'Bon envoyé ✓',       color: 'text-discord-green',  icon: '🎁', bg: 'bg-discord-green/10  border-discord-green/30'  },
  rejected: { label: 'Rejeté',             color: 'text-discord-red',    icon: '❌', bg: 'bg-discord-red/10    border-discord-red/30'    },
};

export default function RetraitPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [userData,        setUserData]        = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [whatsapp,        setWhatsapp]        = useState('');
  const [submitting,      setSubmitting]      = useState(false);
  const [submitError,     setSubmitError]     = useState(null);
  const [submitSuccess,   setSubmitSuccess]   = useState(false);
  const [pendingWithdrawal, setPendingWithdrawal] = useState(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/');
  }, [status]);

  useEffect(() => {
    if (status === 'authenticated') loadData();
  }, [status]);

  async function loadData() {
    try {
      setLoading(true);
      const res  = await fetch('/api/user/me');
      const json = await res.json();
      setUserData(json.user);
      setPendingWithdrawal(json.pendingWithdrawal);
      if (json.user?.whatsapp) setWhatsapp(json.user.whatsapp);
    } catch {
      // silencieux
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);

    try {
      const res  = await fetch('/api/withdraw/request', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ whatsapp }),
      });
      const json = await res.json();

      if (!res.ok) {
        setSubmitError(json.error || 'Une erreur est survenue');
        return;
      }

      setSubmitSuccess(true);
      setPendingWithdrawal(json.withdrawal);
      await loadData();
    } catch {
      setSubmitError('Erreur réseau. Réessaie dans un moment.');
    } finally {
      setSubmitting(false);
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-discord-darkest flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-discord-blurple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const credits    = userData?.credits ?? 0;
  const canRequest = credits >= 20 && !pendingWithdrawal;

  return (
    <>
      <Head>
        <title>Demander un retrait — Récompenses Discord</title>
      </Head>

      <div className="min-h-screen bg-discord-darkest">
        {/* NAVBAR */}
        <nav className="border-b border-discord-light/20 bg-discord-darker/80 backdrop-blur-md sticky top-0 z-10">
          <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-4">
            <Link href="/dashboard" className="text-discord-muted hover:text-white transition-colors">
              ← Retour au tableau de bord
            </Link>
          </div>
        </nav>

        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-6">

          <div>
            <h1 className="text-3xl font-extrabold text-white">Demander un retrait</h1>
            <p className="text-discord-muted mt-2">
              Tu as <span className="text-white font-semibold">{credits} crédit{credits !== 1 ? 's' : ''}</span>.
              {credits >= 20
                ? ' Tu peux demander ton bon Temu de 10€ !'
                : ` Il te faut encore ${20 - credits} crédit${20 - credits > 1 ? 's' : ''}.`}
            </p>
          </div>

          {/* STATUT EN COURS */}
          {pendingWithdrawal && (
            <div className={`border rounded-xl p-5 ${STATUS_INFO[pendingWithdrawal.status]?.bg}`}>
              <div className="flex items-start gap-3">
                <span className="text-3xl">{STATUS_INFO[pendingWithdrawal.status]?.icon}</span>
                <div>
                  <p className={`font-bold text-lg ${STATUS_INFO[pendingWithdrawal.status]?.color}`}>
                    {STATUS_INFO[pendingWithdrawal.status]?.label}
                  </p>
                  <p className="text-discord-muted text-sm mt-1">
                    {pendingWithdrawal.amount_credits} crédits → 10€ de bon Temu
                  </p>
                  {pendingWithdrawal.status === 'pending' && (
                    <p className="text-discord-muted text-sm mt-1">
                      Le gérant va t&apos;envoyer ton bon sur WhatsApp sous peu. 🙏
                    </p>
                  )}
                  {pendingWithdrawal.status === 'paid' && (
                    <p className="text-discord-green text-sm mt-1 font-medium">
                      🎉 Ton bon Temu t&apos;a été envoyé sur WhatsApp !
                    </p>
                  )}
                  {pendingWithdrawal.status === 'rejected' && (
                    <p className="text-discord-red text-sm mt-1">
                      Ta demande a été rejetée. Contacte le gérant sur Discord.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* FORMULAIRE */}
          {!pendingWithdrawal && (
            <div className="card">
              <h2 className="text-white font-bold text-lg mb-6">
                🎁 Recevoir mon bon Temu de 10€
              </h2>

              {/* Récapitulatif */}
              <div className="bg-discord-medium rounded-lg p-4 mb-6 flex items-center justify-between">
                <div>
                  <p className="text-discord-muted text-sm">Crédits actuels</p>
                  <p className="text-white font-bold text-xl">{credits} / 20 crédits</p>
                </div>
                <div className="text-right">
                  <p className="text-discord-muted text-sm">Valeur du bon Temu</p>
                  <p className="text-discord-green font-bold text-xl">10€</p>
                </div>
              </div>

              {!canRequest ? (
                <div className="text-center py-6">
                  <p className="text-discord-muted">
                    Il te faut au moins <span className="text-white font-semibold">20 crédits</span> pour faire un retrait.
                  </p>
                  <div className="mt-4 bg-discord-medium rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-discord-blurple h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((credits / 20) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-discord-muted text-sm mt-2">{credits} / 20 crédits</p>
                  <Link href="/dashboard" className="btn-primary inline-block mt-4">
                    ← Retour à ma cagnotte
                  </Link>
                </div>
              ) : submitSuccess ? (
                <div className="text-center py-6">
                  <div className="text-5xl mb-4">🎉</div>
                  <h3 className="text-white font-bold text-xl mb-2">Demande envoyée !</h3>
                  <p className="text-discord-muted">
                    Le gérant va traiter ta demande et t&apos;envoyer ton bon Temu sur WhatsApp.
                  </p>
                  <Link href="/dashboard" className="btn-primary inline-block mt-6">
                    Retour au tableau de bord
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-white font-medium mb-2">
                      Ton numéro WhatsApp
                    </label>
                    <input
                      type="tel"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="+33 6 12 34 56 78"
                      required
                      className="w-full bg-discord-medium border border-discord-light/30
                                 text-white placeholder-discord-muted
                                 rounded-lg px-4 py-3 text-lg
                                 focus:outline-none focus:ring-2 focus:ring-discord-blurple
                                 focus:border-transparent transition-all"
                    />
                    <p className="text-discord-muted text-sm mt-2">
                      Format international recommandé (ex : +33612345678)
                    </p>
                  </div>

                  {submitError && (
                    <div className="bg-discord-red/10 border border-discord-red/30
                                    rounded-lg p-3 text-discord-red text-sm">
                      ❌ {submitError}
                    </div>
                  )}

                  <div className="bg-discord-blurple/10 border border-discord-blurple/30
                                  rounded-lg p-4 text-sm text-discord-muted">
                    <p className="font-semibold text-white mb-1">⚠️ Important</p>
                    <p>
                      En soumettant cette demande, tu acceptes que le gérant de la communauté
                      te contacte sur WhatsApp pour t&apos;envoyer le bon Temu.
                      Tes crédits seront déduits après validation.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || !whatsapp}
                    className="btn-primary w-full text-lg py-4"
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Envoi en cours…
                      </span>
                    ) : (
                      '🎁 Confirmer ma demande de retrait'
                    )}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
