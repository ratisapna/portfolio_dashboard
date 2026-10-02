'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

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

const CLRS = ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#2dd4bf'];

function fmt(n: number | null) {
  if (n === null || n === undefined) return 'N/A';
  return n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

export default function Home() {
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState('');
  const [upd, setUpd] = useState('');

  useEffect(() => {
    fetch(API)
      .then((r) => {
        if (!r.ok) throw new Error('bad status');
        return r.json();
      })
      .then((d) => {
        setRows(d);
        setUpd(new Date().toLocaleTimeString());
      })
      .catch(() => setErr('could not load initial data'));

    let sock: WebSocket;
    let timer: ReturnType<typeof setTimeout>;

    function connect() {
      sock = new WebSocket(WS);
      sock.onmessage = (e) => {
        try {
          setRows(JSON.parse(e.data));
          setUpd(new Date().toLocaleTimeString());
          setErr('');
        } catch {
          setErr('received bad data from server');
        }
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

  const secData = useMemo(() => {
    return secs.map((sec) => {
      const grp = rows.filter((r) => r.sec === sec);
      const inv = grp.reduce((a, r) => a + r.inv, 0);
      const pv = grp.reduce((a, r) => a + (r.pv ?? 0), 0);
      return { sec, inv, pv, gl: pv - inv };
    });
  }, [rows]);

  const totInv = secData.reduce((a, s) => a + s.inv, 0);
  const totPv = secData.reduce((a, s) => a + s.pv, 0);
  const totGl = totPv - totInv;

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-baseline justify-between mb-1">
          <h1 className="text-2xl font-bold">Portfolio Dashboard</h1>
          {upd && <p className="text-xs text-gray-400">Last updated {upd}</p>}
        </div>

        <p className="text-xs text-gray-400 mb-6">
          CMP from Yahoo Finance (updates every 15 seconds), P/E ratio and
          latest earnings from Google Finance (updates every 60 seconds,
          since those don&apos;t change intraday). Prices may be delayed and
          a few stocks may show N/A if a source has no data for them.
        </p>

        {err && <p className="text-red-600 mb-3">{err}</p>}

        {rows.length === 0 && !err && <p>Loading portfolio...</p>}

        {rows.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <p className="text-sm text-gray-500">Total Investment</p>
              <p className="text-xl font-semibold">{fmt(totInv)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <p className="text-sm text-gray-500">Total Present Value</p>
              <p className="text-xl font-semibold">{fmt(totPv)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <p className="text-sm text-gray-500">Total Gain/Loss</p>
              <p
                className={
                  'text-xl font-semibold ' +
                  (totGl >= 0 ? 'text-green-600' : 'text-red-600')
                }
              >
                {fmt(totGl)}
              </p>
            </div>
          </div>
        )}

        {rows.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <p className="font-semibold mb-2">Sector Allocation</p>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={secData} dataKey="inv" nameKey="sec" outerRadius={90} label>
                  {secData.map((s, i) => (
                    <Cell key={s.sec} fill={CLRS[i % CLRS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="font-semibold mb-2">Investment vs Present Value</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={secData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="sec" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="inv" fill="#60a5fa" name="Investment" />
                <Bar dataKey="pv" fill="#34d399" name="Present Value" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        )}

        {rows.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[950px]">
            <thead className="sticky top-0 bg-gray-800">
              <tr className="text-left text-white">
                <th className="p-4">Particulars</th>
                <th className="p-4">Purchase Price</th>
                <th className="p-4">Qty</th>
                <th className="p-4">Investment</th>
                <th className="p-4">Portfolio %</th>
                <th className="p-4">NSE/BSE</th>
                <th className="p-4">CMP</th>
                <th className="p-4">Present Value</th>
                <th className="p-4">Gain/Loss</th>
                <th className="p-4">P/E Ratio</th>
                <th className="p-4">Latest Earnings</th>
              </tr>
            </thead>
            <tbody>
              {secData.map(({ sec, inv: tInv, pv: tPv, gl: tGl }) => {
                const grp = rows.filter((r) => r.sec === sec);

                return (
                  <Fragment key={sec}>
                    <tr className="bg-gray-50">
                      <td className="pt-6 pb-2 px-3 font-semibold text-gray-700" colSpan={11}>
                        {sec}
                      </td>
                    </tr>

                    {grp.map((r) => (
                      <tr key={r.name} className="border-b hover:bg-gray-50">
                        <td className="p-3">{r.name}</td>
                        <td className="p-3">{fmt(r.buy)}</td>
                        <td className="p-3">{r.qty}</td>
                        <td className="p-3">{fmt(r.inv)}</td>
                        <td className="p-3 w-28">
                          <div className="flex items-center gap-2">
                            <span>{r.pct.toFixed(2)}%</span>
                          </div>
                          <div className="h-1 bg-gray-100 rounded-full mt-1">
                            <div
                              className="h-1 bg-blue-400 rounded-full"
                              style={{ width: Math.min(r.pct, 100) + '%' }}
                            />
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs">
                            {r.code} · {r.exch}
                          </span>
                        </td>
                        <td className="p-3">{fmt(r.cmp)}</td>
                        <td className="p-3">{fmt(r.pv)}</td>
                        <td
                          className={
                            'p-3 ' +
                            (r.gl === null
                              ? ''
                              : r.gl >= 0
                                ? 'text-green-600'
                                : 'text-red-600')
                          }
                        >
                          {fmt(r.gl)}
                        </td>
                        <td className="p-3">{fmt(r.pe)}</td>
                        <td className="p-3">{fmt(r.eps)}</td>
                      </tr>
                    ))}

                    <tr className="bg-gray-50 font-medium border-b-4 border-gray-300">
                      <td className="p-3">{sec} Total</td>
                      <td className="p-3"></td>
                      <td className="p-3"></td>
                      <td className="p-3">{fmt(tInv)}</td>
                      <td className="p-3"></td>
                      <td className="p-3"></td>
                      <td className="p-3"></td>
                      <td className="p-3">{fmt(tPv)}</td>
                      <td
                        className={
                          'p-3 ' + (tGl >= 0 ? 'text-green-600' : 'text-red-600')
                        }
                      >
                        {fmt(tGl)}
                      </td>
                      <td className="p-3"></td>
                      <td className="p-3"></td>
                    </tr>
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        )}
      </div>
    </main>
  );
}
