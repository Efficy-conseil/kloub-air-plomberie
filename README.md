# Kloub Air Plomberie

Dashboard client GitHub Pages pour Kloub Air Plomberie.

Cette version est volontairement frontend-only. Elle n'appelle aucun backend, Google Apps Script, Make ou Google Sheets.

## Organisation

- `kloub-air-plomberie/` : frontend Kloub Air publié par GitHub Pages.

## Vérifications

```bash
npm run check
```

Cette commande vérifie le JavaScript du dashboard et bloque les références backend interdites dans le frontend publié.

## Backend

Il n'y a pas de backend dans ce dépôt.

## Déploiement du frontend

Le workflow `.github/workflows/deploy-pages.yml` publie uniquement `kloub-air-plomberie/` après chaque push sur `main` qui touche ce répertoire.

Dans les paramètres GitHub du dépôt, la source de GitHub Pages doit être réglée une seule fois sur **GitHub Actions**.
