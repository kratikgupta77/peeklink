import React, { useEffect, useState } from "react";
import { apiFetch } from "../api";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, BarChart, Bar
} from "recharts";

const Q = "?only=redirect";                 // count real clicks (redirects) by default
const fmtDay = (s) => (s ? new Date(s).toLocaleDateString() : "");

export default function Dashboard() {
  const [summary, setSummary]   = useState({ clicks: 0, blocked: 0, warning: 0, safe: 0 });
  const [byDay, setByDay]       = useState([]);
  const [verdicts, setVerdicts] = useState([]);
  const [referrers, setReferrers] = useState([]);
  const [links, setLinks]       = useState([]);
  
  useEffect(() => {
  const token = localStorage.getItem("access") || "";
  const H = token ? { Authorization: `Bearer ${token}` } : {};

  const safeJson = async (res, fallback) => {
    if (!res.ok) return fallback;
    try { return await res.json(); } catch { return fallback; }
  };

  (async () => {
    const summary = await apiFetch("/api/analytics/summary" + Q, { headers: H })
      .then(r => safeJson(r, { clicks: 0, blocked: 0, warning: 0, safe: 0 }));

    const byDay = await apiFetch("/api/analytics/by-day" + Q, { headers: H })
      .then(r => safeJson(r, []));
    const verdicts = await apiFetch("/api/analytics/verdict-breakdown" + Q, { headers: H })
      .then(r => safeJson(r, []));
    const referrers = await apiFetch("/api/analytics/top-referrers" + Q + "&limit=8", { headers: H })
      .then(r => safeJson(r, []));
    const links = await apiFetch("/api/links", { headers: H })
      .then(r => safeJson(r, []));

    setSummary(summary);
    setByDay(Array.isArray(byDay) ? byDay : []);
    setVerdicts(Array.isArray(verdicts) ? verdicts : []);
    setReferrers(Array.isArray(referrers) ? referrers : []);
    setLinks(Array.isArray(links) ? links : []);
  })();
}, []);



  return (
    <div className="p-6 space-y-10">
      <div className="grid md:grid-cols-3 gap-4">
        <Stat title="Total Clicks" value={summary.clicks} />
        <Stat title="Active Links" value={links.length} />
        <Stat title="Blocked Attempts" value={summary.blocked} />
      </div>

      <Section title="Clicks by Day">
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
              <LineChart data={(Array.isArray(byDay) ? byDay : []).map(d => ({ ...d, day: fmtDay(d.day) }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="clicks" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Section>

      <div className="grid md:grid-cols-2 gap-4">
        <Section title="Verdict Breakdown">
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={verdicts} dataKey="count" nameKey="label" outerRadius={90} label />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Section>

        <Section title="Top Referrers">
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={referrers}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="referrer" interval={0} angle={-15} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="clicks" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>
      </div>

      <Section title="My Links">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th className="text-left py-2 pr-4">Short</th>
                <th className="text-left py-2 pr-4">Target</th>
                <th className="text-left py-2 pr-4">Clicks</th>
                <th className="text-left py-2 pr-4">Password</th>
                <th className="text-left py-2 pr-4">Analytics</th>
              </tr>
            </thead>
            <tbody>
              {links.map(l => (
                <tr key={l.id} className="border-t">
                  <td className="py-2 pr-4 font-mono">/{l.id}</td>
                  <td className="py-2 pr-4 truncate max-w-[480px]">{l.target}</td>
                  <td className="py-2 pr-4">{l.clicks}</td>
                  <td className="py-2 pr-4">{l.require_password ? "on" : "off"}</td>
                  <td className="py-2 pr-4">{l.analytics_opt_in ? "on" : "off"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section>
      <h2 className="text-lg font-semibold mb-2">{title}</h2>
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">{children}</div>
    </section>
  );
}

function Stat({ title, value }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="text-sm text-zinc-500">{title}</div>
      <div className="text-3xl font-semibold">{value}</div>
    </div>
  );
}
