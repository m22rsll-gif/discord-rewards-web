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
    desc: 'Dès 20 crédits, demande ton bon Temu de 10€. Le gérant te l\'envoie directement sur WhatsApp.',
    color: 'from-green-500/20 to-green-600/10',
    border: 'border-green-500/30',
  },
];

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
