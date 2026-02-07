'use client';

export default function ForCreators() {
  return (
    <section className="relative min-h-[50vh] flex items-center justify-center bg-[#000000] border-t border-[#111111]">
      <div className="container max-w-5xl mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div className="card">
            <h3 className="text-xl font-semibold text-white mb-3">Integrates with Your Stack</h3>
            <p className="text-sm text-[#888888] leading-relaxed">
              Works with HuggingFace, PyTorch, internal trainers. Outputs JSONL/Parquet. Versioning and reproducibility built-in.
            </p>
          </div>

          <div className="card border-[#3b82f6]/30">
            <h3 className="text-xl font-semibold text-white mb-3">Security & Privacy</h3>
            <p className="text-sm text-[#888888] leading-relaxed">
              Raw data stays private. Synthetic output is what leaves. Controls: dedup, n-gram overlap, similarity filtering, redaction.
            </p>
          </div>

          <div className="card">
            <h3 className="text-xl font-semibold text-white mb-3">Pilot-Based Pricing</h3>
            <p className="text-sm text-[#888888] leading-relaxed">
              Priced per dataset size. Start with a pilot to validate fit. No long-term contracts required.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
