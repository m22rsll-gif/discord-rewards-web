// ============================================================
//  PAGE : /admin — Dashboard administrateur (protégé)
// ============================================================

import { useSession }          from 'next-auth/react';
import { useEffect, useState }  from 'react';
import { useRouter }            from 'next/router';
import Head                     from 'next/head';
import Image                    from 'next/image';
import Link                     from 'next/link';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function StatCard({ icon, label, value, sub, color = 'text-white' }) {
  return (
    <div className="card flex flex-col gap-1">
      <span className="text-2xl">{icon}</span>
      <p className="text-discord-muted text-xs uppercase tracking-wider font-medium">{label}</p>
      <p className={`text-3xl font-extrabold ${color}`}>{value}</p>
      {sub && <p className="text-discord-muted text-xs">{sub}</p>}
    </div>
  );
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [withdrawals,     setWithdrawals]     = useState([]);
  const [stats,           setStats]           = useState(null);
  const [activeTab,       setActiveTab]       = useState('pending');
  const [loadingData,     setLoadingData]     = useState(true);
  const [processingId,    setProcessingId]    = useState(null);
  const [notification,    setNotification]    = useState(null);

  // Panel reset cagnotte
  const [userSearch,      setUserSearch]      = useState('');
  const [userResults,     setUserResults]     = useState([]);
  const [searchLoading,   setSearchLoading]   = useState(false);
  const [resetTarget,     setResetTarget]     = useState(null);
  const [resetTestimonial,setResetTestimonial]= useState(false);
  const [resetConfirm,    setResetConfirm]    = useState(false);
  const [resetting,       setResetting]       = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/'); return; }
    if (status === 'authenticated')   { fetchAll(); }
  }, [status]);

  useEffect(() => {
    if (status === 'authenticated') fetchWithdrawals();
  }, [activeTab]);

  async function fetchAll() {
    setLoadingData(true);
    await Promise.all([fetchWithdrawals(), fetchStats()]);
    setLoadingData(false);
  }

  async function fetchWithdrawals() {
    const res  = await fetch(`/api/admin/withdrawals?status=${activeTab}`);
    const json = await res.json();
    if (res.status === 403) { router.push('/'); return; }
    setWithdrawals(json.withdrawals || []);
  }

  async function fetchStats() {
    const res  = await fetch('/api/admin/stats');
    const json = await res.json();
    if (res.ok) setStats(json);
  }

  async function processWithdrawal(withdrawalId, action) {
    setProcessingId(withdrawalId);
    try {
      const res  = await fetch('/api/admin/process', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ withdrawalId, action }),
      });
      const json = await res.json();
      if (!res.ok) { showNotification(json.error || 'Erreur', 'error'); return; }
      showNotification(json.message, 'success');
      await fetchAll();
    } catch {
      showNotification('Erreur réseau', 'error');
    } finally {
      setProcessingId(null);
    }
  }

  function showNotification(message, type) {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  }

  async function searchUsers(query) {
    setSearchLoading(true);
    try {
      const res  = await fetch(`/api/admin/users?search=${encodeURIComponent(query)}`);
      const json = await res.json();
      setUserResults(json.users || []);
    } catch {
      setUserResults([]);
    } finally {
      setSearchLoading(false);
    }
  }

  async function resetCredits() {
    if (!resetTarget) return;
    setResetting(true);
    try {
      const res  = await fetch('/api/admin/reset-credits', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ userId: resetTarget.id, resetTestimonial }),
      });
      const json = await res.json();
      if (!res.ok) { showNotification(json.error || 'Erreur', 'error'); return; }
      showNotification(json.message, 'success');
      setResetTarget(null);
      setResetConfirm(false);
      setUserResults([]);
      setUserSearch('');
      await fetchStats();
    } catch {
      showNotification('Erreur réseau', 'error');
    } finally {
      setResetting(false);
    }
  }

  if (status === 'loading' || loadingData) {
    return (
      <div className="min-h-screen bg-discord-darkest flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-discord-blurple border-t-transparent rounded-full animate-spin" />
          <p className="text-discord-muted">Chargement du dashboard admin…</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Dashboard Admin — Récompenses Discord</title>
      </Head>

      <div className="min-h-screen bg-discord-darkest">
        <nav className="border-b border-discord-light/20 bg-discord-darker/80 backdrop-blur-md sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">🛡️</span>
              <span className="text-white font-bold">Dashboard Admin</span>
            </div>
            <Link href="/dashboard" className="btn-secondary text-sm">Vue membre</Link>
          </div>
        </nav>

        {notification && (
          <div className={`fixed top-20 right-4 z-50 max-w-sm rounded-xl px-5 py-4 border shadow-2xl transition-all duration-300 ${notification.type === 'success' ? 'bg-discord-green/20 border-discord-green/40 text-discord-green' : 'bg-discord-red/20 border-discord-red/40 text-discord-red'}`}>
            {notification.type === 'success' ? '✅ ' : '❌ '}{notification.message}
          </div>
        )}

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">

          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard icon="👥" label="Membres inscrits" value={stats.totalMembers} />
              <StatCard icon="💰" label="Crédits distribués" value={stats.totalDistributed} sub="depuis le début" color="text-discord-green" />
              <StatCard icon="🎥" label="Témoignages validés" value={stats.testimonialDone} />
              <StatCard icon="⏳" label="Retraits en attente" value={stats.withdrawals?.counts?.pending || 0} sub={`${stats.withdrawals?.credits?.pending || 0} crédits à payer`} color={stats.withdrawals?.counts?.pending > 0 ? 'text-discord-yellow' : 'text-white'} />
            </div>
          )}

          {/* ─── PANEL RESET CAGNOTTE ─── */}
          <div className="card space-y-5">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔧</span>
              <div>
                <h2 className="text-white font-bold text-lg">Réinitialiser une cagnotte</h2>
                <p className="text-discord-muted text-sm">Remet les crédits d&apos;un membre à 0</p>
              </div>
            </div>

            <div className="flex gap-3">
              <input
                type="text"
                value={userSearch}
                onChange={(e) => { setUserSearch(e.target.value); if (e.target.value.length >= 2) searchUsers(e.target.value); else setUserResults([]); }}
                placeholder="Chercher un pseudo Discord…"
                className="flex-1 bg-discord-medium border border-discord-light/30 text-white placeholder-discord-muted rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-discord-blurple"
              />
              <button onClick={() => searchUsers(userSearch)} disabled={searchLoading || userSearch.length < 2} className="btn-secondary px-5 disabled:opacity-50">
                {searchLoading ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" /> : '🔍'}
              </button>
            </div>

            {userResults.length > 0 && !resetTarget && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {userResults.map((u) => (
                  <div key={u.id} className="flex items-center justify-between bg-discord-medium rounded-lg px-4 py-3 hover:bg-discord-light/10 transition">
                    <div className="flex items-center gap-3">
                      {u.discord_avatar ? (
                        <img src={`https://cdn.discordapp.com/avatars/${u.discord_id}/${u.discord_avatar}.png?size=32`} alt={u.discord_username} className="w-8 h-8 rounded-full" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-discord-blurple/30 flex items-center justify-center text-xs font-bold text-discord-blurple">
                          {u.discord_username?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-white font-semibold text-sm">{u.discord_username}</p>
                        <p className="text-discord-muted text-xs">💰 {u.credits} crédits · total gagné : {u.total_earned}{u.testimonial_done ? ' · 🎥 témoignage fait' : ''}</p>
                      </div>
                    </div>
                    <button onClick={() => { setResetTarget(u); setResetConfirm(false); setResetTestimonial(false); }} className="btn-danger text-xs px-3 py-1.5">Sélectionner</button>
                  </div>
                ))}
              </div>
            )}

            {userResults.length === 0 && userSearch.length >= 2 && !searchLoading && (
              <p className="text-discord-muted text-sm text-center py-2">Aucun membre trouvé.</p>
            )}

            {resetTarget && (
              <div className="bg-discord-red/10 border border-discord-red/30 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-bold">⚠️ Réinitialiser <span className="text-discord-red">{resetTarget.discord_username}</span> ?</p>
                    <p className="text-discord-muted text-sm mt-1">Solde actuel : <span className="text-white font-semibold">{resetTarget.credits} crédits</span>{resetTarget.credits === 0 && ' (déjà à 0)'}</p>
                  </div>
                  <button onClick={() => { setResetTarget(null); setResetConfirm(false); }} className="text-discord-muted hover:text-white text-xl leading-none">✕</button>
                </div>

                {resetTarget.testimonial_done && (
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={resetTestimonial} onChange={(e) => setResetTestimonial(e.target.checked)} className="w-4 h-4 accent-discord-blurple" />
                    <span className="text-discord-muted text-sm">Réinitialiser aussi le bonus témoignage (permettra de le regagner)</span>
                  </label>
                )}

                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={resetConfirm} onChange={(e) => setResetConfirm(e.target.checked)} className="w-4 h-4 accent-discord-red" />
                  <span className="text-discord-muted text-sm">Je confirme vouloir remettre cette cagnotte à <strong className="text-white">0 crédit</strong></span>
                </label>

                <button onClick={resetCredits} disabled={!resetConfirm || resetting} className="btn-danger w-full py-3 disabled:opacity-50">
                  {resetting ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />Réinitialisation…</span> : '🗑️ Confirmer la réinitialisation'}
                </button>
              </div>
            )}
          </div>

          {/* ONGLETS RETRAITS */}
          <div>
            <div className="flex gap-2 mb-6 border-b border-discord-light/20 pb-0">
              {[{ key: 'pending', label: '⏳ En attente' }, { key: 'paid', label: '✅ Payés' }, { key: 'rejected', label: '❌ Rejetés' }].map((tab) => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all -mb-px ${activeTab === tab.key ? 'border-discord-blurple text-white' : 'border-transparent text-discord-muted hover:text-white'}`}>
                  {tab.label}
                  {tab.key === 'pending' && stats?.withdrawals?.counts?.pending > 0 && (
                    <span className="ml-2 bg-discord-yellow/20 text-discord-yellow text-xs px-2 py-0.5 rounded-full">{stats.withdrawals.counts.pending}</span>
                  )}
                </button>
              ))}
            </div>

            {withdrawals.length === 0 ? (
              <div className="card text-center py-12">
                <div className="text-5xl mb-3">📭</div>
                <p className="text-discord-muted">Aucune demande dans cette catégorie.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {withdrawals.map((w) => (
                  <div key={w.id} className="card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {w.users?.discord_avatar ? (
                        <Image src={w.users.discord_avatar} alt={w.users.discord_username} width={44} height={44} className="rounded-full ring-2 ring-discord-blurple/30 flex-shrink-0" />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-discord-blurple/30 flex items-center justify-center flex-shrink-0">
                          <span className="text-discord-blurple font-bold">{w.users?.discord_username?.[0]?.toUpperCase() || '?'}</span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-white font-semibold truncate">{w.users?.discord_username || 'Inconnu'}</p>
                        <p className="text-discord-muted text-xs truncate">ID Discord : {w.users?.discord_id}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div><p className="text-discord-muted text-xs">Crédits</p><p className="text-white font-bold">{w.amount_credits} crédits → 10€</p></div>
                      <div>
                        <p className="text-discord-muted text-xs">WhatsApp</p>
                        <a href={`https://wa.me/${w.whatsapp_number.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-discord-green font-semibold hover:underline">{w.whatsapp_number}</a>
                      </div>
                      <div><p className="text-discord-muted text-xs">Date demande</p><p className="text-white">{formatDate(w.created_at)}</p></div>
                      {w.paid_at && <div><p className="text-discord-muted text-xs">Payé le</p><p className="text-discord-green">{formatDate(w.paid_at)}</p></div>}
                      <div><p className="text-discord-muted text-xs">Solde actuel</p><p className="text-white">{w.users?.credits ?? 0} crédits</p></div>
                    </div>
                    {activeTab === 'pending' && (
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => processWithdrawal(w.id, 'pay')} disabled={processingId === w.id} className="btn-success text-sm px-4 py-2 disabled:opacity-60">
                          {processingId === w.id ? <span className="flex items-center gap-1"><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />…</span> : '✅ Marquer payé'}
                        </button>
                        <button onClick={() => processWithdrawal(w.id, 'reject')} disabled={processingId === w.id} className="btn-danger text-sm px-4 py-2 disabled:opacity-60">❌ Rejeter</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
