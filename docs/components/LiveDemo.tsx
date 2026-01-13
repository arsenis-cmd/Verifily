'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, CheckCircle, AlertTriangle } from 'lucide-react';

export default function LiveDemo() {
  const [selectedExample, setSelectedExample] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const examples = [
    {
      title: 'AI-Generated Article',
      text: 'The implementation of artificial intelligence in modern business practices has fundamentally transformed organizational paradigms. Leveraging machine learning algorithms, companies can optimize workflows and facilitate data-driven decision-making processes.',
      isAI: true,
      probability: 0.94,
    },
    {
      title: 'Human-Written Post',
      text: "Just spent 3 hrs debugging a weird CSS issue and it was literally just a missing semicolon lmao. Why am I like this? Anyway, coffee break time ☕",
      isAI: false,
      probability: 0.08,
    },
    {
      title: 'Mixed Content',
      text: 'Climate change is one of the biggest challenges of our time. Recent studies indicate that global temperatures have risen by approximately 1.1°C since pre-industrial times. This necessitates immediate action to mitigate further environmental degradation.',
      isAI: true,
      probability: 0.67,
    },
  ];

  const handleAnalyze = () => {
    setAnalyzing(true);
    setShowResult(false);

    setTimeout(() => {
      setAnalyzing(false);
      setShowResult(true);
    }, 2000);
  };

  const handleReset = () => {
    setShowResult(false);
    setAnalyzing(false);
  };

  const currentExample = examples[selectedExample];

  return (
    <section id="demo" className="py-24 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-cyan text-sm font-semibold uppercase tracking-wider">
            Live Demo
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6">
            Try It
            <span className="gradient-text"> Right Now</span>
          </h2>
          <p className="text-xl text-foreground/70">
            See Verifily in action with real examples
          </p>
        </motion.div>

        <div className="max-w-5xl mx-auto">
          {/* Example Selector */}
          <div className="flex flex-wrap gap-4 justify-center mb-8">
            {examples.map((example, index) => (
              <button
                key={index}
                onClick={() => {
                  setSelectedExample(index);
                  handleReset();
                }}
                className={`px-6 py-3 rounded-full font-semibold transition-all ${
                  selectedExample === index
                    ? 'bg-cyan text-navy'
                    : 'glass hover:bg-white/5'
                }`}
              >
                {example.title}
              </button>
            ))}
          </div>

          {/* Demo Interface */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="glass p-8 rounded-3xl space-y-6"
          >
            {/* Text Display */}
            <div className="bg-navy-light rounded-2xl p-6 min-h-[200px] relative">
              <p className="text-lg leading-relaxed">
                {currentExample.text}
              </p>

              {/* Analysis Overlay */}
              <AnimatePresence>
                {analyzing && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-navy/90 backdrop-blur-sm rounded-2xl flex items-center justify-center"
                  >
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 border-4 border-cyan border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="text-cyan font-semibold">Analyzing text...</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Results */}
            <AnimatePresence>
              {showResult && (
                <motion.div
                  initial={{ opacity: 0, y: 20, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -20, height: 0 }}
                  className="space-y-4"
                >
                  {/* Probability Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">AI Probability</span>
                      <span className="text-2xl font-bold gradient-text">
                        {(currentExample.probability * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-3 bg-navy-light rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${currentExample.probability * 100}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className={`h-full rounded-full ${
                          currentExample.probability > 0.5
                            ? 'bg-gradient-to-r from-purple to-cyan'
                            : 'bg-gradient-to-r from-green-500 to-cyan'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Classification */}
                  <div className="glass p-6 rounded-xl flex items-start gap-4">
                    {currentExample.isAI ? (
                      <AlertTriangle className="w-6 h-6 text-purple flex-shrink-0 mt-1" />
                    ) : (
                      <CheckCircle className="w-6 h-6 text-cyan flex-shrink-0 mt-1" />
                    )}
                    <div>
                      <h4 className="font-bold text-lg mb-1">
                        {currentExample.probability > 0.5 ? 'Likely AI-Generated' : 'Likely Human-Written'}
                      </h4>
                      <p className="text-foreground/70">
                        {currentExample.probability > 0.8
                          ? 'This text shows strong indicators of AI generation with formal language patterns and structured composition.'
                          : currentExample.probability > 0.5
                          ? 'This text contains mixed signals, showing both AI and human characteristics.'
                          : 'This text displays natural human writing patterns with informal language and authentic expression.'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              {!showResult ? (
                <button
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="px-8 py-4 bg-cyan text-navy rounded-full font-semibold hover:bg-cyan-dark transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Play className="w-5 h-5" />
                  Analyze Text
                </button>
              ) : (
                <button
                  onClick={handleReset}
                  className="px-8 py-4 glass rounded-full font-semibold hover:bg-white/5 transition-all flex items-center gap-2"
                >
                  <RotateCcw className="w-5 h-5" />
                  Try Again
                </button>
              )}
            </div>
          </motion.div>

          {/* Note */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center text-foreground/60 mt-8"
          >
            This is a simulation. The real extension analyzes any text on any website in real-time.
          </motion.p>
        </div>
      </div>
    </section>
  );
}
