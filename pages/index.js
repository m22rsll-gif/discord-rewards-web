// ============================================================
//  PAGE : / — Landing page
// ============================================================

import { signIn, useSession } from 'next-auth/react';
import { useRouter }           from 'next/router';
import { useEffect }           from 'react';
import Head                    from 'next/head';

const FEATURES = [
  {
    icon: '📸',
    title: '+1 crédit par résultat',
    desc: 'Poste tes résultats dans le salon dédié chaque jour pour gagner 1 crédit (1 fois par jour).',
    color: 'from-indigo-500/20 to-indigo-600/10',
    border: 'border-indigo-500/30',
  },
  {
    icon: '🎥',
    title: '+20 crédits pour un témoignage',
    desc: 'Partage une vidéo témoignage dans le salon prévu. Bonus unique accordé une seule fois.',
    color: 'from-purple-500/20 to-purple-600/10',
    border: 'border-purple-500/30',
  },
  {
    icon: '🎁',
    title: '20 crédits = 10€ Temu',
    desc: "Dès 20 crédits, demande ton bon Temu de 10€. Le gérant te l'envoie directement sur WhatsApp.",
    color: 'from-green-500/20 to-green-600/10',
    border: 'border-green-500/30',
  },
];

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status]);

  return (
    <>
      <Head>
        <title>Récompenses Discord — Gagne des bons Temu</title>
        <meta name="description" content="Participe à la communauté, gagne des crédits et échange-les contre des bons Temu." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-discord-darkest">
        {/* Gradient de fond */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-discord-blurple/20 rounded-full blur-3xl" />
          <div className="absolute top-1/3 -right-20 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-1/4 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-20 pb-24">

          {/* HERO */}
          <div className="text-center mb-20">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-discord-blurple/20 border border-discord-blurple/40
                            text-indigo-300 text-sm font-medium px-4 py-2 rounded-full mb-8">
              <span className="w-2 h-2 bg-discord-green rounded-full animate-pulse" />
              Communauté Discord active
            </div>

            <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight mb-6">
              <span className="text-white">Participe,</span>
              <br />
              <span className="bg-gradient-to-r from-discord-blurple to-purple-400
                               bg-clip-text text-transparent">
                gagne des récompenses
              </span>
            </h1>

            <p className="text-discord-muted text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              Poste tes résultats et témoignages dans la communauté,
              accumule des crédits et échange-les contre des{' '}
              <span className="text-white font-semibold">bons Temu de 10€</span>.
            </p>

            {/* Bouton connexion Discord */}
            <button
              onClick={() => signIn('discord')}
              disabled={status === 'loading'}
              className="group inline-flex items-center gap-3 bg-discord-blurple hover:bg-indigo-500
                         text-white font-bold text-lg px-8 py-4 rounded-xl
                         transition-all duration-200 shadow-lg shadow-discord-blurple/30
                         hover:shadow-discord-blurple/50 hover:-translate-y-0.5
                         disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {/* Logo Discord SVG */}
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.03.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              Se connecter avec Discord
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 group-hover:translate-x-1 transition-transform">
                <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
              </svg>
            </button>

            <p className="mt-4 text-discord-muted text-sm">
              Connexion sécurisée via Discord OAuth2 — aucun mot de passe nécessaire
            </p>
          </div>

          {/* FEATURES */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-20">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className={`relative bg-gradient-to-br ${f.color} border ${f.border}
                            rounded-2xl p-6 hover:-translate-y-1 transition-transform duration-200`}
              >
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="text-white font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-discord-muted text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* HOW IT WORKS */}
          <div className="card text-center">
            <h2 className="text-2xl font-bold mb-8">Comment ça marche ?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
              {[
                { step: '1', label: 'Connecte-toi', detail: 'avec ton compte Discord' },
                { step: '2', label: 'Participe', detail: 'dans les salons actifs' },
                { step: '3', label: 'Accumule', detail: 'des crédits au fil du temps' },
                { step: '4', label: 'Retire', detail: 'ton bon Temu de 10€' },
              ].map(({ step, label, detail }) => (
                <div key={step} className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 bg-discord-blurple rounded-full flex items-center
                                  justify-center text-xl font-extrabold shadow-lg shadow-discord-blurple/30">
                    {step}
                  </div>
                  <span className="text-white font-semibold">{label}</span>
                  <span className="text-discord-muted text-sm">{detail}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <footer className="mt-16 text-center text-discord-muted text-sm">
            © {new Date().getFullYear()} Communauté Discord — Tous droits réservés
          </footer>
        </div>
      </div>
    </>
  );
    }
