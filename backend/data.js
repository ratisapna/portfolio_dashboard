const YahooFinance = require('yahoo-finance2').default;
const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

const stks = [
  { name: 'HDFC Bank', sec: 'Financial Sector', buy: 1490, qty: 50, code: 'HDFCBANK', exch: 'NSE', sym: 'HDFCBANK.NS' },
  { name: 'Bajaj Finance', sec: 'Financial Sector', buy: 6466, qty: 15, code: 'BAJFINANCE', exch: 'NSE', sym: 'BAJFINANCE.NS' },
  { name: 'ICICI Bank', sec: 'Financial Sector', buy: 780, qty: 84, code: 'ICICIBANK', exch: 'NSE', sym: 'ICICIBANK.NS' },
  { name: 'Bajaj Housing', sec: 'Financial Sector', buy: 130, qty: 504, code: 'BAJAJHFL', exch: 'NSE', sym: 'BAJAJHFL.NS' },
  { name: 'Savani Financials', sec: 'Financial Sector', buy: 24, qty: 1080, code: '511577', exch: 'BSE', sym: null },

  { name: 'Affle India', sec: 'Tech Sector', buy: 1151, qty: 50, code: 'AFFLE', exch: 'NSE', sym: 'AFFLE.NS' },
  { name: 'LTIMindtree', sec: 'Tech Sector', buy: 4775, qty: 16, code: 'LTIM', exch: 'NSE', sym: null },
  { name: 'KPIT Tech', sec: 'Tech Sector', buy: 672, qty: 61, code: 'KPITTECH', exch: 'NSE', sym: 'KPITTECH.NS' },
  { name: 'Tata Tech', sec: 'Tech Sector', buy: 1072, qty: 63, code: 'TATATECH', exch: 'NSE', sym: 'TATATECH.NS' },
  { name: 'BLS E-Services', sec: 'Tech Sector', buy: 232, qty: 191, code: 'BLSE', exch: 'NSE', sym: 'BLSE.NS' },
  { name: 'Tanla', sec: 'Tech Sector', buy: 1134, qty: 45, code: 'TANLA', exch: 'NSE', sym: 'TANLA.NS' },

  { name: 'Dmart', sec: 'Consumer', buy: 3777, qty: 27, code: 'DMART', exch: 'NSE', sym: 'DMART.NS' },
  { name: 'Tata Consumer', sec: 'Consumer', buy: 845, qty: 90, code: 'TATACONSUM', exch: 'NSE', sym: 'TATACONSUM.NS' },
  { name: 'Pidilite', sec: 'Consumer', buy: 2376, qty: 36, code: 'PIDILITIND', exch: 'NSE', sym: 'PIDILITIND.NS' },

  { name: 'Tata Power', sec: 'Power', buy: 224, qty: 225, code: 'TATAPOWER', exch: 'NSE', sym: 'TATAPOWER.NS' },
  { name: 'KPI Green', sec: 'Power', buy: 875, qty: 50, code: 'KPIGREEN', exch: 'NSE', sym: 'KPIGREEN.NS' },
  { name: 'Suzlon', sec: 'Power', buy: 44, qty: 450, code: 'SUZLON', exch: 'NSE', sym: 'SUZLON.NS' },
  { name: 'Gensol', sec: 'Power', buy: 998, qty: 45, code: 'GENSOL', exch: 'NSE', sym: 'GENSOL.NS' },

  { name: 'Hariom Pipes', sec: 'Pipe Sector', buy: 580, qty: 60, code: 'HARIOMPIPE', exch: 'NSE', sym: 'HARIOMPIPE.NS' },
  { name: 'Astral', sec: 'Pipe Sector', buy: 1517, qty: 56, code: 'ASTRAL', exch: 'NSE', sym: 'ASTRAL.NS' },
  { name: 'Polycab', sec: 'Pipe Sector', buy: 2818, qty: 28, code: 'POLYCAB', exch: 'NSE', sym: 'POLYCAB.NS' },

  { name: 'Clean Science', sec: 'Others', buy: 1610, qty: 32, code: 'CLEAN', exch: 'NSE', sym: 'CLEAN.NS' },
  { name: 'Deepak Nitrite', sec: 'Others', buy: 2248, qty: 27, code: 'DEEPAKNTR', exch: 'NSE', sym: 'DEEPAKNTR.NS' },
  { name: 'Fine Organic', sec: 'Others', buy: 4284, qty: 16, code: 'FINEORG', exch: 'NSE', sym: 'FINEORG.NS' },
  { name: 'Gravita', sec: 'Others', buy: 2037, qty: 8, code: 'GRAVITA', exch: 'NSE', sym: 'GRAVITA.NS' },
  { name: 'SBI Life', sec: 'Others', buy: 1197, qty: 49, code: 'SBILIFE', exch: 'NSE', sym: 'SBILIFE.NS' },
];

async function getData() {
  const syms = stks.filter(x => x.sym).map(x => x.sym);
  const qts = await yf.quote(syms);
  const qMap = {};
  qts.forEach(q => { qMap[q.symbol] = q; });

  const rows = stks.map(x => {
    const q = x.sym ? qMap[x.sym] : null;
    const inv = x.buy * x.qty;
    const cmp = q ? q.regularMarketPrice : null;
    const pv = cmp !== null && cmp !== undefined ? cmp * x.qty : null;
    const gl = pv !== null ? pv - inv : null;
    const pe = q ? q.trailingPE : null;
    const eps = q ? q.epsTrailingTwelveMonths : null;
    return { name: x.name, sec: x.sec, buy: x.buy, qty: x.qty, code: x.code, exch: x.exch, inv, cmp, pv, gl, pe, eps };
  });

  const tot = rows.reduce((a, r) => a + r.inv, 0);
  rows.forEach(r => { r.pct = (r.inv / tot) * 100; });

  return rows;
}

module.exports = { getData };
