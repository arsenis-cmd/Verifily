import { NextResponse } from 'next/server';

/**
 * GET /api/dashboard
 *
 * Returns all dashboard data for the pilot UI.
 * Currently serves mock data. Replace with real data source
 * (database, internal API, etc.) when backend is implemented.
 */

const MOCK_PROJECT = {
  name: 'Internal Support Data → Synthetic QA',
  status: 'Ready',
  inputSize: 20_000,
  outputSize: 95_000,
  lastRun: '2025-06-12T14:32:00Z',
};

const MOCK_DATASETS = [
  {
    id: 'ds-a1b2c3',
    name: 'support-tickets-raw',
    type: 'Human seed',
    size: 20_000,
    version: 'v1.0',
    hash: 'sha256:9f86d0…4a7b2c',
    created: '2025-06-10',
    status: 'Ingested',
  },
  {
    id: 'ds-d4e5f6',
    name: 'support-tickets-synthetic',
    type: 'Synthetic output',
    size: 95_000,
    version: 'v1.0',
    hash: 'sha256:3c7a1e…8d9f02',
    created: '2025-06-12',
    status: 'Ready',
  },
  {
    id: 'ds-g7h8i9',
    name: 'product-faq-raw',
    type: 'Human seed',
    size: 5_200,
    version: 'v1.0',
    hash: 'sha256:b4e2a1…6c3d78',
    created: '2025-06-08',
    status: 'Ingested',
  },
  {
    id: 'ds-j0k1l2',
    name: 'product-faq-synthetic',
    type: 'Synthetic output',
    size: 31_200,
    version: 'v1.0',
    hash: 'sha256:e8f1c9…2a5b34',
    created: '2025-06-11',
    status: 'Processing',
  },
];

const MOCK_RUNS = [
  {
    id: 'run-001',
    input: 'support-tickets-raw (v1.0)',
    output: 'support-tickets-synthetic (v1.0)',
    filters: ['Deduplication', 'N-gram overlap removal', 'PII redaction'],
    expansionFactor: '4.75×',
    duration: '14m 32s',
    status: 'Success',
    timestamp: '2025-06-12T14:32:00Z',
  },
  {
    id: 'run-002',
    input: 'product-faq-raw (v1.0)',
    output: 'product-faq-synthetic (v1.0)',
    filters: ['Deduplication', 'N-gram overlap removal'],
    expansionFactor: '6.0×',
    duration: '8m 11s',
    status: 'Processing',
    timestamp: '2025-06-11T09:15:00Z',
  },
  {
    id: 'run-003',
    input: 'legacy-docs-raw (v0.9)',
    output: '—',
    filters: ['Deduplication'],
    expansionFactor: '—',
    duration: '2m 04s',
    status: 'Failed',
    timestamp: '2025-06-09T11:42:00Z',
  },
];

const MOCK_QUALITY = {
  duplicationRate: '1.2%',
  overlapRate: '0.8%',
  leakageChecksPassed: true,
};

export async function GET() {
  // TODO: Replace with real data fetching when backend is available
  return NextResponse.json({
    project: MOCK_PROJECT,
    datasets: MOCK_DATASETS,
    runs: MOCK_RUNS,
    quality: MOCK_QUALITY,
    _meta: {
      source: 'mock',
      note: 'Pilot UI — replace with production data source',
    },
  });
}
