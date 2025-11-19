import React, { useEffect, useState } from "react";
import { apiFetch } from "../api.js";
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
} from "recharts";

export default function ReferrersPage() {
  const [data, setData] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const resp = await apiFetch("/api/analytics/top-referrers?only=redirect&limit=10");
        if (!resp.ok) throw new Error(`API ${resp.status}`);
        const body = await resp.json();
        if (!cancelled) setData(Array.isArray(body) ? body : []);
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Section title="Top Referrers" error={error}>
      <div style={{ height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="referrer" interval={0} angle={-15} textAnchor="end" height={80} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="clicks" fill="#111827" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Section>
  );
}

function Section({ title, children, error }) {
  return (
    <section>
      <h2 style={{ marginBottom: 12 }}>{title}</h2>
      <div style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid #e5e7eb" }}>
        {error ? <p style={{ color: "#dc2626" }}>{error}</p> : children}
      </div>
    </section>
  );
}

