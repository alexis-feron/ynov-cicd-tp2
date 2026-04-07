# Ynov CI/CD — TP2

[![CI](https://github.com/alexis-feron/ynov-cicd-tp2/actions/workflows/ci.yml/badge.svg)](https://github.com/alexis-feron/ynov-cicd-tp2/actions/workflows/ci.yml)

API de tarification de livraison de repas, développée avec **Hono** (TypeScript).

## Stack

| Outil | Rôle |
|---|---|
| [Hono](https://hono.dev) | Framework HTTP |
| [Vitest](https://vitest.dev) | Tests unitaires & intégration |
| [ESLint](https://eslint.org) | Linter |

## Démarrage

```bash
npm install
npm start          # http://localhost:3000
```

## Scripts

```bash
npm test               # Tests
npm run test:coverage  # Tests + rapport de couverture (seuil 80%)
npm run lint           # Linter
```

## Routes

| Méthode | Route | Description |
|---|---|---|
| `POST` | `/orders/simulate` | Calcule le prix sans persister |
| `POST` | `/orders` | Crée et persiste une commande |
| `GET` | `/orders/:id` | Récupère une commande par id |
| `POST` | `/promo/validate` | Valide un code promo |

## Exemple

```bash
curl -X POST http://localhost:3000/orders/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"name": "Pizza", "price": 12.5, "quantity": 2}],
    "distance": 5,
    "weight": 1,
    "hour": 15,
    "dayOfWeek": 2
  }'
```

```json
{
  "subtotal": 25,
  "discount": 0,
  "deliveryFee": 3,
  "surge": 1,
  "total": 28
}
```

## Codes promo disponibles

| Code | Type | Valeur | Commande min |
|---|---|---|---|
| `BIENVENUE20` | percentage | 20% | 15 € |
| `FIXE5` | fixed | 5 € | 10 € |

## Collection Postman

Importer `postman/collection.json` dans Postman. La variable `baseUrl` est pré-configurée sur `http://localhost:3000`.
