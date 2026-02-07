'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Navigation from '@/components/Navigation';

// ─── Types ──────────────────────────────────────────────────────────────────

interface Project {
  name: string;
  status: string;
  inputSize: number;
  outputSize: number;
  lastRun: string;
}

interface Dataset {
  id: string;
  name: string;
  type: string;
  size: number;
  version: string;
  hash: string;
  created: string;
  status: string;
}

interface Run {
  id: string;
  input: string;
  output: string;
  filters: string[];
  expansionFactor: string;
  duration: string;
  status: string;
  timestamp: string;
}

interface Quality {
  duplicationRate: string;
  overlapRate: string;
  leakageChecksPassed: boolean;
}

interface DashboardData {
  project: Project;
  datasets: Dataset[];
  runs: Run[];
  quality: Quality;
}

type Tab = 'overview' | 'datasets' | 'runs' | 'quality' | 'export';

// ─── Access Gate ────────────────────────────────────────────────────────────

const PILOT_ACCESS_KEY = 'verifily_pilot_access';

function usePilotAccess() {
  const searchParams = useSearchParams();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    // Check URL param first: /dashboard?access=pilot-2025
    const accessParam = searchParams.get('access');
    if (accessParam) {
      localStorage.setItem(PILOT_ACCESS_KEY, accessParam);
      setHasAccess(true);
      return;
    }
    // Fallback: check localStorage
    const stored = localStorage.getItem(PILOT_ACCESS_KEY);
    setHasAccess(!!stored);
  }, [searchParams]);

  return hasAccess;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatNumber(n: number): string {
  return n.toLocaleString();
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Ready: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    Ingested: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    Processing: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    Success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    Failed: 'bg-red-500/10 text-red-400 border-red-500/30',
  };
  return (
    <span
      className={`inline-block px-2.5 py-0.5 text-xs font-medium rounded-full border ${
        colors[status] ?? 'bg-white/5 text-[#888] border-white/10'
      }`}
    >
      {status}
    </span>
  );
}

const EXPORT_FORMATS = [
  { label: 'JSONL', format: 'jsonl' },
  { label: 'CSV', format: 'csv' },
  { label: 'Parquet', format: 'parquet' },
  { label: 'HuggingFace Datasets', format: 'huggingface' },
];

// ─── Locked State ───────────────────────────────────────────────────────────

function LockedDashboard() {
  return (
    <div className="min-h-screen bg-[#000000] text-white">
      <Navigation />
      <main className="max-w-2xl mx-auto px-6 pt-48 pb-24 text-center">
        <div className="bg-[#0a0a0a] border border-[#222] rounded-xl p-12">
          <div className="text-4xl mb-6 opacity-40">&#x1F512;</div>
          <h1 className="text-2xl font-bold tracking-tight mb-4">
            Pilot access required
          </h1>
          <p className="text-sm text-[#888] mb-8 leading-relaxed">
            The Verifily Data Operations dashboard is available only to
            pilot customers. If you are evaluating Verifily, request a
            pilot and we will provision your access.
          </p>
          <Link
            href="/pilot"
            className="inline-block px-6 py-3 bg-[#3b82f6] hover:bg-[#2563eb] text-white text-sm font-medium rounded-lg transition-colors"
          >
            Request a pilot
          </Link>
          <p className="text-xs text-[#555] mt-8">
            Already have an access link? Open the URL your pilot lead shared with you.
          </p>
        </div>
      </main>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#000000] flex items-center justify-center">
          <p className="text-[#666] text-sm">Loading...</p>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const hasAccess = usePilotAccess();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasAccess) fetchDashboard();
  }, [hasAccess, fetchDashboard]);

  // Still checking access
  if (hasAccess === null) {
    return (
      <div className="min-h-screen bg-[#000000] flex items-center justify-center">
        <p className="text-[#666] text-sm">Loading...</p>
      </div>
    );
  }

  // No access — show locked state
  if (!hasAccess) {
    return <LockedDashboard />;
  }

  // Loading data
  if (loading || !data) {
    return (
      <div className="min-h-screen bg-[#000000] flex items-center justify-center">
        <p className="text-[#666] text-sm">Loading dashboard...</p>
      </div>
    );
  }

  const { project, datasets, runs, quality } = data;

  const handleExport = (format: string) => {
    if (format === 'jsonl' || format === 'csv') {
      window.open(`/api/dashboard/export/?format=${format}`, '_blank');
    } else {
      alert(`${format.toUpperCase()} export is available in production. Use JSONL or CSV in the pilot.`);
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'datasets', label: 'Datasets' },
    { key: 'runs', label: 'Pipeline / Runs' },
    { key: 'quality', label: 'Quality & Safety' },
    { key: 'export', label: 'Export' },
  ];

  return (
    <div className="min-h-screen bg-[#000000] text-white">
      <Navigation />

      {/* Pilot banner */}
      <div className="bg-[#0a0a0a] border-b border-[#222]">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <p className="text-xs text-[#888] tracking-wide uppercase">
            Pilot-only dashboard &mdash; available to evaluation customers
          </p>
          <Link
            href="/pilot"
            className="text-xs text-[#3b82f6] hover:text-[#60a5fa] transition-colors"
          >
            Request access &rarr;
          </Link>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 pt-28 pb-24">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Data Operations
          </h1>
          <p className="text-[#888] text-sm">
            Monitor datasets, transformation runs, and synthetic output quality.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-10 border-b border-[#222] overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-5 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === t.key
                  ? 'text-white border-b-2 border-[#3b82f6]'
                  : 'text-[#666] hover:text-[#aaa]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Overview ─────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <section className="space-y-8">
            <div className="bg-[#0a0a0a] border border-[#222] rounded-xl p-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                  <p className="text-xs text-[#666] uppercase tracking-wider mb-1">
                    Project
                  </p>
                  <h2 className="text-xl font-semibold mb-3">
                    {project.name}
                  </h2>
                  <StatusBadge status={project.status} />
                </div>
                <button
                  onClick={() => setActiveTab('export')}
                  className="self-start md:self-center px-5 py-2.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Export synthetic dataset
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Input examples', value: formatNumber(project.inputSize) },
                { label: 'Synthetic output', value: formatNumber(project.outputSize) },
                {
                  label: 'Expansion ratio',
                  value: `${(project.outputSize / project.inputSize).toFixed(1)}×`,
                },
                { label: 'Last run', value: formatDate(project.lastRun) },
              ].map((kpi) => (
                <div
                  key={kpi.label}
                  className="bg-[#0a0a0a] border border-[#222] rounded-xl p-5"
                >
                  <p className="text-xs text-[#666] uppercase tracking-wider mb-2">
                    {kpi.label}
                  </p>
                  <p className="text-lg font-semibold">{kpi.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-[#0a0a0a] border border-[#222] rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[#888]">
                  Recent runs
                </h3>
                <button
                  onClick={() => setActiveTab('runs')}
                  className="text-xs text-[#3b82f6] hover:text-[#60a5fa] transition-colors"
                >
                  View all &rarr;
                </button>
              </div>
              <div className="space-y-3">
                {runs.slice(0, 2).map((run) => (
                  <div
                    key={run.id}
                    className="flex items-center justify-between py-2 border-b border-[#1a1a1a] last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium">{run.input}</p>
                      <p className="text-xs text-[#666] mt-0.5">
                        {run.expansionFactor} expansion &middot; {run.duration}
                      </p>
                    </div>
                    <StatusBadge status={run.status} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Datasets ─────────────────────────────────────── */}
        {activeTab === 'datasets' && (
          <section>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#222] text-xs text-[#666] uppercase tracking-wider">
                    <th className="pb-3 pr-4 font-medium">Name</th>
                    <th className="pb-3 pr-4 font-medium">Type</th>
                    <th className="pb-3 pr-4 font-medium">Examples</th>
                    <th className="pb-3 pr-4 font-medium">Version</th>
                    <th className="pb-3 pr-4 font-medium">Hash</th>
                    <th className="pb-3 pr-4 font-medium">Created</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {datasets.map((ds) => (
                    <tr
                      key={ds.id}
                      className="border-b border-[#1a1a1a] hover:bg-[#0a0a0a] transition-colors"
                    >
                      <td className="py-4 pr-4 font-medium">{ds.name}</td>
                      <td className="py-4 pr-4 text-[#aaa]">{ds.type}</td>
                      <td className="py-4 pr-4 font-mono text-[#aaa]">
                        {formatNumber(ds.size)}
                      </td>
                      <td className="py-4 pr-4 text-[#aaa]">{ds.version}</td>
                      <td className="py-4 pr-4 font-mono text-xs text-[#666]">
                        {ds.hash}
                      </td>
                      <td className="py-4 pr-4 text-[#aaa]">{ds.created}</td>
                      <td className="py-4">
                        <StatusBadge status={ds.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-[#555] mt-6">
              Metadata only &mdash; raw data is not displayed in this interface.
            </p>
          </section>
        )}

        {/* ── Pipeline / Runs ──────────────────────────────── */}
        {activeTab === 'runs' && (
          <section className="space-y-4">
            {runs.map((run) => (
              <div
                key={run.id}
                className="bg-[#0a0a0a] border border-[#222] rounded-xl p-6"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                  <div>
                    <p className="text-xs text-[#666] font-mono mb-1">
                      {run.id}
                    </p>
                    <p className="text-sm font-medium">
                      {run.input}{' '}
                      <span className="text-[#555]">&rarr;</span>{' '}
                      {run.output}
                    </p>
                  </div>
                  <StatusBadge status={run.status} />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-[#666] mb-1">Expansion</p>
                    <p className="font-medium">{run.expansionFactor}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#666] mb-1">Duration</p>
                    <p className="font-medium">{run.duration}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#666] mb-1">Timestamp</p>
                    <p className="font-medium">{formatDate(run.timestamp)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#666] mb-1">Filters</p>
                    <div className="flex flex-wrap gap-1.5">
                      {run.filters.map((f) => (
                        <span
                          key={f}
                          className="inline-block px-2 py-0.5 text-xs bg-white/5 border border-white/10 rounded text-[#aaa]"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* ── Quality & Safety ─────────────────────────────── */}
        {activeTab === 'quality' && (
          <section className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#0a0a0a] border border-[#222] rounded-xl p-6">
                <p className="text-xs text-[#666] uppercase tracking-wider mb-2">
                  Duplication rate
                </p>
                <p className="text-2xl font-semibold">
                  {quality.duplicationRate}
                </p>
              </div>
              <div className="bg-[#0a0a0a] border border-[#222] rounded-xl p-6">
                <p className="text-xs text-[#666] uppercase tracking-wider mb-2">
                  N-gram overlap rate
                </p>
                <p className="text-2xl font-semibold">
                  {quality.overlapRate}
                </p>
              </div>
              <div className="bg-[#0a0a0a] border border-[#222] rounded-xl p-6">
                <p className="text-xs text-[#666] uppercase tracking-wider mb-2">
                  Leakage checks
                </p>
                <p className="text-2xl font-semibold text-emerald-400">
                  {quality.leakageChecksPassed ? 'Passed' : 'Action needed'}
                </p>
              </div>
            </div>

            <div className="bg-[#0a0a0a] border border-[#222] rounded-xl p-6">
              <h3 className="text-sm font-semibold mb-3">About these metrics</h3>
              <ul className="space-y-2 text-sm text-[#888]">
                <li>
                  <strong className="text-[#aaa]">Duplication rate</strong> &mdash;
                  percentage of synthetic examples that are near-duplicates of
                  seed data.
                </li>
                <li>
                  <strong className="text-[#aaa]">Overlap rate</strong> &mdash;
                  n-gram overlap between synthetic output and original seed corpus.
                </li>
                <li>
                  <strong className="text-[#aaa]">Leakage checks</strong> &mdash;
                  automated checks for PII leakage and verbatim memorization.
                </li>
              </ul>
              <p className="text-xs text-[#555] mt-4">
                These controls are designed to reduce memorization risk.
                They do not guarantee zero leakage &mdash; review outputs
                before production use.
              </p>
            </div>
          </section>
        )}

        {/* ── Export / Integration ─────────────────────────── */}
        {activeTab === 'export' && (
          <section className="space-y-6">
            <div className="bg-[#0a0a0a] border border-[#222] rounded-xl p-8">
              <h3 className="text-lg font-semibold mb-4">
                Download synthetic dataset
              </h3>
              <div className="flex flex-wrap gap-3 mb-6">
                {EXPORT_FORMATS.map((fmt) => (
                  <button
                    key={fmt.format}
                    onClick={() => handleExport(fmt.format)}
                    className="px-4 py-2 text-sm border border-[#333] rounded-lg text-[#aaa] hover:text-white hover:border-[#3b82f6] transition-colors"
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-[#555]">
                JSONL and CSV downloads contain sample synthetic data.
                In production, files are generated on demand and delivered via signed URL.
              </p>
            </div>

            <div className="bg-[#0a0a0a] border border-[#222] rounded-xl p-8">
              <h3 className="text-lg font-semibold mb-4">Integration</h3>
              <p className="text-sm text-[#888] mb-4">
                Synthetic datasets integrate with existing training pipelines.
                Supported targets include:
              </p>
              <ul className="space-y-2 text-sm text-[#aaa]">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#3b82f6] rounded-full" />
                  HuggingFace Datasets
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#3b82f6] rounded-full" />
                  PyTorch DataLoaders
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#3b82f6] rounded-full" />
                  Internal training infrastructure (custom adapters)
                </li>
              </ul>
              <p className="text-xs text-[#555] mt-4">
                Need a custom integration? Contact your pilot lead or{' '}
                <Link
                  href="/pilot"
                  className="text-[#3b82f6] hover:underline"
                >
                  request a pilot
                </Link>
                .
              </p>
            </div>
          </section>
        )}

        {/* Footer note */}
        <div className="mt-16 pt-8 border-t border-[#1a1a1a] text-center">
          <p className="text-xs text-[#555]">
            This dashboard is available only to pilot customers evaluating
            Verifily. Data shown is representative.
          </p>
          <p className="text-xs text-[#444] mt-2">
            Questions?{' '}
            <a
              href="mailto:pilot@verifily.io"
              className="text-[#3b82f6] hover:underline"
            >
              pilot@verifily.io
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
