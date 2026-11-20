# Copilote de candidature (version publique, sans compte)

N'importe qui peut l'utiliser, gratuitement : l'IA est Google Gemini (offre gratuite), clé côté serveur.

## Mise en ligne sur Vercel
1. Créez un dépôt GitHub avec ce dossier, puis « Import Project » sur vercel.com.
2. Créez une clé gratuite sur aistudio.google.com, puis dans Vercel (Settings > Environment Variables) ajoutez `GEMINI_API_KEY`. Si le modèle par défaut n'est plus gratuit, indiquez-en un autre dans `GEMINI_MODEL`.
3. Déployez : vous obtenez une adresse publique à partager.

En local : `npm install`, copier `.env.example` en `.env.local`, `npm run dev`.

## Fonctions
CV et offre en PDF, Word, texte ou image (lus côté serveur) ; score, mots-clés manquants, corrections à accepter/refuser, export PDF ; lettre de motivation en 3 modèles ; FR/EN/AR.

## Protection du budget
`lib/ratelimit.ts` limite chaque IP à 15 requêtes par heure (en mémoire ; lire un fichier, analyser et rédiger comptent chacun pour 1). Quota gratuit Gemini partagé par tous les visiteurs : quand il est atteint, l'appli affiche « trop de demandes ». Pour un vrai site : Upstash Redis.

Confidentialité : sur l'offre gratuite, Google peut utiliser les données envoyées pour améliorer ses produits. Informez les utilisateurs avant qu'ils envoient un CV.

## Autres modules (désactivés)
Pass, Kanban et schéma Supabase sont dans le dépôt mais hors de la page d'accueil. Pass : `NEXT_PUBLIC_SUBSCRIPTION_ENABLED=true`.
