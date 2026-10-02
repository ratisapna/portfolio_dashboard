const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const { fetchYahoo, fetchGoogle, build } = require('./data');

const app = express();
app.use(cors());

const Y_TTL = 15000;
const G_TTL = 60000;

let yCache = null;
let gCache = null;
let yBusy = false;
let gBusy = false;

function rows() {
  if (!yCache) return null;
  return build(yCache, gCache);
}

function broadcast() {
  const r = rows();
  if (!r) return;
  const msg = JSON.stringify(r);
  wss.clients.forEach((c) => {
    if (c.readyState === WebSocket.OPEN) c.send(msg);
  });
}

async function refreshYahoo() {
  if (yBusy) return;
  yBusy = true;
  try {
    yCache = await fetchYahoo();
    broadcast();
  } catch (e) {
    console.log('yahoo refresh failed', e.message);
  }
  yBusy = false;
}

async function refreshGoogle() {
  if (gBusy) return;
  gBusy = true;
  try {
    gCache = await fetchGoogle();
    broadcast();
  } catch (e) {
    console.log('google refresh failed', e.message);
  }
  gBusy = false;
}

app.get('/api/portfolio', async (req, res) => {
  if (!yCache) await refreshYahoo();
  const r = rows();
  if (!r) return res.status(500).json({ error: 'failed to load portfolio data' });
  res.json(r);
});

const PORT = 4000;
const srv = app.listen(PORT, () => {
  console.log('server listening on port ' + PORT);
});

const wss = new WebSocket.Server({ server: srv });

wss.on('connection', (sock) => {
  const r = rows();
  if (r) sock.send(JSON.stringify(r));
});

refreshYahoo();
refreshGoogle();

setInterval(refreshYahoo, Y_TTL);
setInterval(refreshGoogle, G_TTL);
