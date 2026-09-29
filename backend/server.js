const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const { getData } = require('./data');

const app = express();
app.use(cors());

const TTL = 15000;
let cche = { data: null, time: 0 };

async function load() {
  const now = Date.now();
  if (cche.data && now - cche.time < TTL) return cche.data;
  const rows = await getData();
  cche = { data: rows, time: now };
  return rows;
}

app.get('/api/portfolio', async (req, res) => {
  try {
    const rows = await load();
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'failed to load portfolio data' });
  }
});

const PORT = 4000;
const srv = app.listen(PORT, () => {
  console.log('server listening on port ' + PORT);
});

const wss = new WebSocket.Server({ server: srv });

wss.on('connection', (sock) => {
  if (cche.data) sock.send(JSON.stringify(cche.data));
});

setInterval(async () => {
  try {
    const rows = await getData();
    cche = { data: rows, time: Date.now() };
    const msg = JSON.stringify(rows);
    wss.clients.forEach((c) => {
      if (c.readyState === WebSocket.OPEN) c.send(msg);
    });
  } catch (e) {
    console.log('refresh failed', e.message);
  }
}, TTL);
