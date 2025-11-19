import React, { useEffect, useState } from "react";
import { apiFetch } from "../api.js";
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Line,
} from "recharts";

const fmtDay = (s) => (s ? new Date(s).toLocaleDateString() : "");

export default function ClicksPage() {
  const [data, setData] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const resp = await apiFetch("/api/analytics/by-day?only=redirect");
        if (!resp.ok) throw new Error(`API ${resp.status}`);
        const body = await resp.json();
        if (!cancelled) {
          setData(Array.isArray(body) ? body : []);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const chartData = data.map((d) => ({ ...d, day: fmtDay(d.day) }));

  return (
    <Section title="Clicks by Day" error={error}>
      <div style={{ height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="clicks" stroke="#111827" strokeWidth={2} dot={false} />
          </LineChart>
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

