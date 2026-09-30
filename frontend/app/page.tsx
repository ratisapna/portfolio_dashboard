'use client';

import { Fragment, useEffect, useState } from 'react';

interface Row {
  name: string;
  sec: string;
  buy: number;
  qty: number;
  code: string;
  exch: string;
  inv: number;
  cmp: number | null;
  pv: number | null;
  gl: number | null;
  pe: number | null;
  eps: number | null;
  pct: number;
}

const API = 'http://localhost:4000/api/portfolio';
const WS = 'ws://localhost:4000';

function fmt(n: number | null) {
  if (n === null || n === undefined) return 'N/A';
  return n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

export default function Home() {
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    fetch(API)
      .then((r) => r.json())
      .then(setRows)
      .catch(() => setErr('could not load initial data'));

    let sock: WebSocket;
    let timer: ReturnType<typeof setTimeout>;

    function connect() {
      sock = new WebSocket(WS);
      sock.onmessage = (e) => {
        setRows(JSON.parse(e.data));
        setErr('');
      };
      sock.onerror = () => setErr('live connection lost, retrying');
      sock.onclose = () => {
        timer = setTimeout(connect, 3000);
      };
    }
    connect();

    return () => {
      clearTimeout(timer);
      if (sock) sock.close();
    };
  }, []);

  const secs = Array.from(new Set(rows.map((r) => r.sec)));

  return (
    <main className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Portfolio Dashboard</h1>

      {err && <p className="text-red-600 mb-3">{err}</p>}

      {rows.length === 0 && !err && <p>Loading portfolio...</p>}

      {rows.length > 0 && (
        <div className="overflow-x-auto border rounded">
          <table className="w-full text-sm border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-2">Particulars</th>
                <th className="p-2">Purchase Price</th>
                <th className="p-2">Qty</th>
                <th className="p-2">Investment</th>
                <th className="p-2">Portfolio %</th>
                <th className="p-2">NSE/BSE</th>
                <th className="p-2">CMP</th>
                <th className="p-2">Present Value</th>
                <th className="p-2">Gain/Loss</th>
                <th className="p-2">P/E Ratio</th>
                <th className="p-2">Latest Earnings</th>
              </tr>
            </thead>
            <tbody>
              {secs.map((sec) => {
                const grp = rows.filter((r) => r.sec === sec);
                const tInv = grp.reduce((a, r) => a + r.inv, 0);
                const tPv = grp.reduce((a, r) => a + (r.pv ?? 0), 0);
                const tGl = tPv - tInv;

                return (
                  <Fragment key={sec}>
                    <tr className="bg-gray-200 font-semibold">
                      <td className="p-2" colSpan={11}>
                        {sec}
                      </td>
                    </tr>

                    {grp.map((r) => (
                      <tr key={r.name} className="border-b">
                        <td className="p-2">{r.name}</td>
                        <td className="p-2">{fmt(r.buy)}</td>
                        <td className="p-2">{r.qty}</td>
                        <td className="p-2">{fmt(r.inv)}</td>
                        <td className="p-2">{r.pct.toFixed(2)}%</td>
                        <td className="p-2">
                          {r.code} ({r.exch})
                        </td>
                        <td className="p-2">{fmt(r.cmp)}</td>
                        <td className="p-2">{fmt(r.pv)}</td>
                        <td
                          className={
                            'p-2 ' +
                            (r.gl === null
                              ? ''
                              : r.gl >= 0
                                ? 'text-green-600'
                                : 'text-red-600')
                          }
                        >
                          {fmt(r.gl)}
                        </td>
                        <td className="p-2">{fmt(r.pe)}</td>
                        <td className="p-2">{fmt(r.eps)}</td>
                      </tr>
                    ))}

                    <tr className="bg-gray-50 font-medium">
                      <td className="p-2">{sec} Total</td>
                      <td className="p-2"></td>
                      <td className="p-2"></td>
                      <td className="p-2">{fmt(tInv)}</td>
                      <td className="p-2"></td>
                      <td className="p-2"></td>
                      <td className="p-2"></td>
                      <td className="p-2">{fmt(tPv)}</td>
                      <td
                        className={
                          'p-2 ' + (tGl >= 0 ? 'text-green-600' : 'text-red-600')
                        }
                      >
                        {fmt(tGl)}
                      </td>
                      <td className="p-2"></td>
                      <td className="p-2"></td>
                    </tr>
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
