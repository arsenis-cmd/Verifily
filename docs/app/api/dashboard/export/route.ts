import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/dashboard/export?format=jsonl
 *
 * Returns a downloadable mock synthetic dataset file.
 * Supported formats: jsonl (default), csv, parquet-stub.
 *
 * In production, this would generate a signed URL pointing
 * to the actual synthetic dataset in object storage.
 */

const MOCK_EXAMPLES = [
  {
    id: 'syn-0001',
    input: 'How do I reset my password?',
    output: 'To reset your password, go to Settings > Account > Reset Password. You will receive a confirmation email within 2 minutes.',
    source_dataset: 'support-tickets-raw',
    synthetic: true,
  },
  {
    id: 'syn-0002',
    input: 'My payment was declined, what should I do?',
    output: 'If your payment was declined, please verify your card details and try again. If the issue persists, contact your bank or try an alternative payment method.',
    source_dataset: 'support-tickets-raw',
    synthetic: true,
  },
  {
    id: 'syn-0003',
    input: 'Can I change my subscription plan mid-cycle?',
    output: 'Yes, you can upgrade or downgrade your subscription at any time. Changes take effect at the start of your next billing cycle. Upgrades are prorated.',
    source_dataset: 'support-tickets-raw',
    synthetic: true,
  },
  {
    id: 'syn-0004',
    input: 'How do I export my data?',
    output: 'Navigate to Settings > Data > Export. Select the format (CSV or JSON) and the date range. Your export will be ready for download within a few minutes.',
    source_dataset: 'support-tickets-raw',
    synthetic: true,
  },
  {
    id: 'syn-0005',
    input: 'Is my data encrypted?',
    output: 'All data is encrypted in transit using TLS 1.3 and at rest using AES-256. Encryption keys are managed through a dedicated key management service.',
    source_dataset: 'support-tickets-raw',
    synthetic: true,
  },
];

export async function GET(request: NextRequest) {
  const format = request.nextUrl.searchParams.get('format') || 'jsonl';

  if (format === 'jsonl') {
    const content = MOCK_EXAMPLES.map((ex) => JSON.stringify(ex)).join('\n') + '\n';
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'application/jsonl',
        'Content-Disposition': 'attachment; filename="verifily-synthetic-sample.jsonl"',
      },
    });
  }

  if (format === 'csv') {
    const header = 'id,input,output,source_dataset,synthetic';
    const rows = MOCK_EXAMPLES.map(
      (ex) =>
        `"${ex.id}","${ex.input.replace(/"/g, '""')}","${ex.output.replace(/"/g, '""')}","${ex.source_dataset}",${ex.synthetic}`
    );
    const content = [header, ...rows].join('\n') + '\n';
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="verifily-synthetic-sample.csv"',
      },
    });
  }

  // Parquet and HF Datasets — return a stub message
  return NextResponse.json(
    {
      message: `Export format "${format}" is available in production. In the pilot UI, use JSONL or CSV.`,
      available_formats: ['jsonl', 'csv'],
      production_formats: ['jsonl', 'csv', 'parquet', 'huggingface'],
    },
    { status: 200 }
  );
}
