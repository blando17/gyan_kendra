import React, { useEffect, useState } from "react";
import { Users, StickyNote, Link2, CheckCircle2 } from "lucide-react";

import { stats as statsApi } from "../api/endpoints";
import useCountUp from "../hooks/useCountUp";

// One tile. Each has its own hook so the numbers stagger slightly.
function Stat({ icon: Icon, label, value, tint, delay }) {
  const { ref, value: shown } = useCountUp(value, { delay });

  return (
    <div ref={ref} className="flex flex-col items-center text-center">
      <span
        className={`mb-3 flex h-11 w-11 items-center justify-center rounded-2xl ${tint}`}
      >
        <Icon className="h-5 w-5" />
      </span>

      <span className="text-3xl font-extrabold tabular-nums tracking-tight text-gray-900 sm:text-4xl dark:text-white">
        {value === null ? "—" : shown.toLocaleString()}
      </span>

      <span className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {label}
      </span>
    </div>
  );
}

export default function StatsBand() {
  const [data, setData] = useState(null);

  // Public endpoint: totals only, no account details.
  useEffect(() => {
    let active = true;

    statsApi
      .public()
      .then((res) => active && setData(res.data.stats))
      .catch(() => active && setData(null));

    return () => {
      active = false;
    };
  }, []);

  const tiles = [
    {
      icon: Users,
      label: data?.users === 1 ? "Learner on board" : "Learners on board",
      value: data?.users ?? null,
      tint: "bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300",
      delay: 0,
    },
    {
      icon: StickyNote,
      label: "Topics tracked",
      value: data?.topics ?? null,
      tint: "bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300",
      delay: 100,
    },
    {
      icon: Link2,
      label: "Resources saved",
      value: data?.resources ?? null,
      tint: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300",
      delay: 200,
    },
    {
      icon: CheckCircle2,
      label: "Topics mastered",
      value: data?.completedTopics ?? null,
      tint: "bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300",
      delay: 300,
    },
  ];

  return (
    <section className="bg-gradient-to-b from-indigo-50/60 to-white py-12 dark:from-gray-900/40 dark:to-gray-950">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 rounded-3xl border border-white bg-white/70 px-6 py-9 shadow-lg shadow-violet-500/5 backdrop-blur md:grid-cols-4 dark:border-gray-800 dark:bg-gray-900/70">
          {tiles.map((tile) => (
            <Stat key={tile.label} {...tile} />
          ))}
        </div>

        <p className="mt-5 text-center text-xs text-gray-400 dark:text-gray-600">
          GyanKendra in numbers
        </p>
      </div>
    </section>
  );
}
