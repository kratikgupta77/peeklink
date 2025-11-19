import React, { useEffect, useState } from "react";
import { apiFetch } from "../api.js";
import { ResponsiveContainer, PieChart, Pie, Tooltip, Cell } from "recharts";

const COLORS = ["#16a34a", "#f59e0b", "#dc2626", "#0ea5e9", "#7c3aed"];

export default function VerdictsPage() {
  const [data, setData] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const resp = await apiFetch("/api/analytics/verdict-breakdown?only=redirect");
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
    <Section title="Verdict Breakdown" error={error}>
      <div style={{ height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie dataKey="count" data={data} label>
              {data.map((entry, idx) => (
                <Cell key={entry.label} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
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

