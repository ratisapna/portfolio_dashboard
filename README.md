# Portfolio Dashboard

A dashboard that shows a stock portfolio with live price updates, built for the
Octa Byte AI full stack intern assignment.

## Stack

- Frontend: Next.js, TypeScript, Tailwind CSS, Recharts
- Backend: Node.js, Express, ws (websockets)
- Data source: Yahoo Finance (via the `yahoo-finance2` npm package)

## Folder structure

```
backend/   Express + websocket server, stock data, yahoo fetch logic
frontend/  Next.js dashboard UI
```

## Running it

You need two terminals, one for each app.

**Backend**

```
cd backend
npm install
npm run dev
```

Runs on http://localhost:4000. It exposes:
- `GET /api/portfolio` - current portfolio data (JSON)
- a websocket on the same port that pushes updated data every 15 seconds

**Frontend**

```
cd frontend
npm install
npm run dev
```

Runs on http://localhost:3000. Open that in the browser. The backend must
already be running, otherwise the page shows a connection error until it
comes up (it keeps retrying on its own).

## What the dashboard shows

- All holdings grouped by sector, with a subtotal row per sector
- Purchase price, qty, investment, portfolio %, CMP, present value, gain/loss,
  P/E ratio and latest earnings for each stock
- Gain is shown in green, loss in red
- Three summary cards (total investment, total present value, total gain/loss)
- A sector allocation pie chart and an investment vs present value bar chart
- Live updates every 15 seconds over a websocket, no page refresh needed

See [TECHNICAL.md](TECHNICAL.md) for the reasoning behind the API and
architecture choices, and known limitations.
