'use client';

import { useState, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, AlertCircle, CheckCircle2, Zap } from 'lucide-react';

export default function LiveDemo() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const [text, setText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<{
    classification: 'human' | 'ai' | 'mixed';
    confidence: number;
    perplexity: number;
    burstiness: number;
  } | null>(null);

  const examples = [
    {
      label: 'AI-Generated',
      text: 'The implementation of artificial intelligence in modern business practices has fundamentally transformed organizational paradigms. Leveraging machine learning algorithms, companies can optimize workflows and facilitate data-driven decision-making processes.',
      expectedResult: { classification: 'ai' as const, confidence: 0.94, perplexity: 2.1, burstiness: 0.15 },
    },
    {
      label: 'Human-Written',
      text: "Just spent 3 hrs debugging a weird CSS issue and it was literally just a missing semicolon lmao. Why am I like this? Anyway, coffee break time ☕",
      expectedResult: { classification: 'human' as const, confidence: 0.92, perplexity: 8.7, burstiness: 0.81 },
    },
    {
      label: 'Mixed Content',
      text: 'Climate change is one of the biggest challenges of our time. Recent studies indicate that global temperatures have risen by approximately 1.1°C since pre-industrial times. This necessitates immediate action to mitigate further environmental degradation.',
      expectedResult: { classification: 'mixed' as const, confidence: 0.67, perplexity: 4.8, burstiness: 0.42 },
    },
  ];

  const handleAnalyze = () => {
    if (!text.trim()) return;

    setAnalyzing(true);
    setResult(null);

    // Simulate analysis
    setTimeout(() => {
      // Find matching example or use default
      const example = examples.find(ex => ex.text === text) || examples[0];
      setResult(example.expectedResult);
      setAnalyzing(false);
    }, 2500);
  };

  const handleReset = () => {
    setText('');
    setResult(null);
    setAnalyzing(false);
  };

  const loadExample = (exampleText: string) => {
    setText(exampleText);
    setResult(null);
    setAnalyzing(false);
  };

  const getResultColor = (classification: string) => {
    switch (classification) {
      case 'human':
        return 'text-success-500';
      case 'ai':
        return 'text-danger-500';
      default:
        return 'text-purple-400';
    }
  };

  const getResultLabel = (classification: string) => {
    switch (classification) {
      case 'human':
        return 'Likely Human-Written';
      case 'ai':
        return 'Likely AI-Generated';
      default:
        return 'Mixed Content';
    }
  };

  return (
    <section id="demo" ref={ref} className="py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 dot-pattern opacity-20" />
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-accent-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6 }}
            className="inline-block px-6 py-2 glass rounded-full mb-6"
          >
            <span className="text-accent-500 font-semibold text-sm uppercase tracking-wider">Live Demo</span>
          </motion.div>

          <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold font-heading mb-6">
            Try It{' '}
            <span className="gradient-text">Right Now</span>
          </h2>
          <p className="text-xl text-white/60">
            See Verifily in action with real examples
          </p>
        </motion.div>

        {/* Demo Interface */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-5xl mx-auto"
        >
          {/* Example Buttons */}
          <div className="flex flex-wrap gap-4 justify-center mb-8">
            {examples.map((example, index) => (
              <button
                key={index}
                onClick={() => loadExample(example.text)}
                className="px-6 py-3 glass rounded-full text-sm font-medium hover:glass-strong transition-all hover:scale-105"
              >
                {example.label}
              </button>
            ))}
          </div>

          {/* Demo Card */}
          <div className="glass-strong rounded-3xl p-8 md:p-12 space-y-8">
            {/* Text Input */}
            <div className="relative">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste any text to check if it's AI-generated..."
                disabled={analyzing}
                className="w-full min-h-[200px] bg-primary-800/50 border border-white/10 rounded-2xl p-6 text-white placeholder-white/30 focus:outline-none focus:border-accent-500/50 focus:ring-2 focus:ring-accent-500/20 transition-all resize-none disabled:opacity-50"
              />

              {/* Analysis Overlay */}
              <AnimatePresence>
                {analyzing && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-primary-900/90 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center space-y-4"
                  >
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-accent-500/30 border-t-accent-500 rounded-full animate-spin" />
                      <Zap className="w-6 h-6 text-accent-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                    </div>
                    <p className="text-accent-500 font-semibold">Analyzing text...</p>
                    <p className="text-white/50 text-sm">Running detection algorithms</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Results */}
            <AnimatePresence>
              {result && !analyzing && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Classification */}
                  <div className="glass p-6 rounded-2xl">
                    <div className="flex items-start gap-4">
                      {result.classification === 'human' ? (
                        <CheckCircle2 className={`w-6 h-6 ${getResultColor(result.classification)} flex-shrink-0 mt-1`} />
                      ) : (
                        <AlertCircle className={`w-6 h-6 ${getResultColor(result.classification)} flex-shrink-0 mt-1`} />
                      )}
                      <div className="flex-1">
                        <h4 className={`font-bold text-xl mb-2 ${getResultColor(result.classification)}`}>
                          {getResultLabel(result.classification)}
                        </h4>
                        <p className="text-white/70 text-sm leading-relaxed">
                          {result.classification === 'human'
                            ? 'This text displays natural human writing patterns with varied sentence structure and authentic expression.'
                            : result.classification === 'ai'
                            ? 'This text shows strong indicators of AI generation with formal language patterns and structured composition.'
                            : 'This text contains mixed signals, showing both AI and human characteristics.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Confidence */}
                    <div className="glass p-6 rounded-2xl">
                      <div className="text-sm text-white/60 mb-2">Confidence</div>
                      <div className="text-3xl font-bold gradient-text">
                        {(result.confidence * 100).toFixed(0)}%
                      </div>
                      <div className="mt-3 h-2 bg-primary-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${result.confidence * 100}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                          className="h-full bg-gradient-to-r from-accent-500 to-purple-500"
                        />
                      </div>
                    </div>

                    {/* Perplexity */}
                    <div className="glass p-6 rounded-2xl">
                      <div className="text-sm text-white/60 mb-2">Perplexity</div>
                      <div className="text-3xl font-bold text-white">
                        {result.perplexity.toFixed(1)}
                      </div>
                      <div className="text-xs text-white/50 mt-2">
                        {result.perplexity < 3 ? 'Low (AI-like)' : result.perplexity > 7 ? 'High (Human-like)' : 'Medium'}
                      </div>
                    </div>

                    {/* Burstiness */}
                    <div className="glass p-6 rounded-2xl">
                      <div className="text-sm text-white/60 mb-2">Burstiness</div>
                      <div className="text-3xl font-bold text-white">
                        {(result.burstiness * 100).toFixed(0)}%
                      </div>
                      <div className="text-xs text-white/50 mt-2">
                        {result.burstiness < 0.3 ? 'Low (AI-like)' : result.burstiness > 0.7 ? 'High (Human-like)' : 'Medium'}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!result ? (
                <button
                  onClick={handleAnalyze}
                  disabled={!text.trim() || analyzing}
                  className="btn btn-primary text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
                >
                  <Play className="w-5 h-5" />
                  Analyze Text
                </button>
              ) : (
                <button
                  onClick={handleReset}
                  className="btn btn-ghost text-lg"
                >
                  <RotateCcw className="w-5 h-5" />
                  Try Again
                </button>
              )}
            </div>

            {/* Note */}
            <p className="text-center text-white/40 text-sm">
              This is a simulation. The real extension analyzes any text on any website in real-time.
            </p>
          </div>

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-center mt-12"
          >
            <p className="text-white/60 mb-6">
              Want to verify your own content? Get the extension to unlock full verification features.
            </p>
            <a href="#cta" className="btn btn-primary glow-hover-cyan">
              Get the Extension
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
