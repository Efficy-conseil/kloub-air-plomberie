# Consignes du projet Kloub Air Plomberie

## Sources de vérité

- Le frontend publié est dans `kloub-air-plomberie/`.
- Les assets publiés sont dans `kloub-air-plomberie/assets/`.
- Ne pas modifier les fichiers hors dashboard sans demande explicite.

## Règles de modification

- Ne jamais connecter ce dépôt au backend Chez Papi, à Google Apps Script, à Make ou à un Google Sheet.
- Ne pas ajouter de commande de déploiement backend tant qu'un backend Kloub Air dédié n'existe pas.
- Ne pas réintroduire d'URL `script.google.com`, d'identifiant `AKfy...` ou d'ID de Google Sheet Chez Papi dans `kloub-air-plomberie/`.
- Préserver les comportements existants sauf demande explicite contraire.
- Ne pas écraser les changements locaux ou les fichiers non suivis appartenant à l'utilisateur.

## Vérifications

- Exécuter `npm run check` après toute modification du frontend ou des scripts.
- Exécuter `git diff --check` avant chaque commit.
- Vérifier les fichiers JSON ou XML modifiés avec un parseur adapté.

## Déploiements

- Frontend : un push sur `main` publie automatiquement `kloub-air-plomberie/` avec GitHub Actions.
- Backend : aucun déploiement backend depuis ce dépôt.

## Git

- Ne versionner que les fichiers liés à la demande en cours.
- Utiliser des commits ciblés avec un message décrivant le résultat.
- Après un push, indiquer le commit et les éventuelles étapes manuelles restantes.
