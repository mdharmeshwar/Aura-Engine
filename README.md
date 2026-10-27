# Aura Engine

Aura Engine is a Sprint 18 inventory management app with an Express API and a React operations dashboard. The backend provides inventory CRUD, Zod validation, MongoDB aggregation analytics, and security middleware. The frontend consumes the API and includes inventory filtering, quick-add, restock alerts, category valuation, and CSV export.

## Architecture

- `src/app.js` — Express app and middleware composition
- `src/config/` — environment and database configuration
- `src/models/Product.js` — MongoDB schema and indexes
- `src/controllers/` — HTTP handlers for inventory and analytics
- `src/services/` — database queries and aggregation logic
- `src/schemas/productSchema.js` — Zod validation schemas
- `src/routes/` — REST routing
- `src/middleware/` — validation, error handling, and not-found handling
- `scripts/seedProducts.js` — 50,000-product seeding script
- `tests/` — Jest + Supertest coverage
- `frontend/` — Vite + React dashboard

## Prerequisites

- Node.js 18+
- MongoDB 6+ or MongoDB Atlas connection
- npm

## Installation

```bash
npm install
cp .env.example .env
```

## Environment Configuration

For a persistent database, set `MONGODB_URI` in `.env` before starting the app. Leave it empty to use the in-memory demo database; the backend seeds a small sample inventory when that database is empty. In-memory data is discarded when the server stops.

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=
CLIENT_ORIGIN=http://localhost:5173,http://localhost:5174
```

For multiple frontend origins, pass a comma-separated value:

```env
CLIENT_ORIGIN=http://localhost:5173,http://localhost:5174,https://app.example.com
```

## Database Index Creation

MongoDB indexes are created automatically by Mongoose on model initialization. A script is also available:

```bash
npm run indexes
```

## Seeding 50,000 Products

```bash
npm run seed
```

Use the explicit replacement flag to rebuild existing data:

```bash
npm run seed -- --replace
```

## Start the API

Development mode:

```bash
npm run dev
```

Production mode:

```bash
npm start
```

## Start the dashboard

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal (normally `http://localhost:5173`). If that port is already in use, Vite may choose `5174`, which is included in the default CORS origins.

The dashboard's **Export report** action downloads a CSV containing summary metrics and the currently displayed inventory page. Sidebar links navigate to dashboard, inventory, analytics, and alert sections.

## Running Automated Tests

```bash
npm test
```

## API Endpoints

### Health

```http
GET /api/health
```

### Inventory list

```http
GET /api/inventory?page=1&limit=50&search=audio&category=Electronics&sort=-price
```

### Inventory detail

```http
GET /api/inventory/:id
```

### Create product

```http
POST /api/inventory
```

Request body example:

```json
{
  "productName": "Wireless Headset",
  "sku": "AUR-1001",
  "category": "Electronics",
  "price": 149.99,
  "cost": 98.5,
  "stockQuantity": 15,
  "reorderLevel": 5
}
```

### Update product

```http
PUT /api/inventory/:id
```

### Delete product

```http
DELETE /api/inventory/:id
```

### Analytics

```http
GET /api/analytics
```

Example response:

```json
{
  "data": {
    "summary": {
      "totalSkus": 50000,
      "totalInventoryValue": 1285402.71,
      "outOfStockItems": 120
    },
    "restockPriority": [
      {
        "productName": "Alpha Speaker",
        "sku": "AUR-1245",
        "category": "Audio",
        "stockQuantity": 0,
        "reorderLevel": 8
      }
    ],
    "categoryValuation": [
      {
        "category": "Electronics",
        "totalInventoryValue": 765432.11,
        "totalItems": 18500
      }
    ]
  },
  "meta": {
    "generatedAt": "2026-10-27T00:00:00.000Z",
    "durationMs": 74
  }
}
```

## Validation Errors

Examples:

```json
{
  "success": false,
  "message": "Validation failed: price must be greater than or equal to cost."
}
```

```json
{
  "success": false,
  "message": "Validation failed: stockQuantity must be a nonnegative integer."
}
```

## Performance Measurement

Representative commands:

```bash
npm run seed
npm test
node scripts/checkIndexes.js
```

The project uses MongoDB aggregation and indexes for high-volume reporting. For live verification, use `explain('executionStats')` in Mongo Shell or Compass for representative queries.

## Deployment (Render)

1. Create a Node.js web service on Render.
2. Set environment variables:

```env
PORT=10000
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/aura-engine
CLIENT_ORIGIN=https://your-frontend-domain.com
```

3. Deploy the repository with `npm install` and `npm start`.
4. Confirm `/api/health` returns `200`.

## Common Troubleshooting

- MongoDB connection refused: verify `MONGODB_URI` and network access.
- CORS failures: ensure `CLIENT_ORIGIN` matches the frontend origin exactly.
- Duplicate SKU conflict: ensure product SKU values are unique before insert.
- Health check not reachable: confirm the app started successfully and the port is correct.

## Limitations and Future Improvements

- Skip-based pagination works for the MVP but becomes less efficient at very large offsets.
- A future cursor-based pagination strategy would improve scalability.
- A true production system should add role-based access control, logging, and monitoring.
- Demo data in in-memory mode is temporary; use a configured MongoDB database for persistent inventory.
