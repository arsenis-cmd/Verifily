'use client';

import { motion } from 'framer-motion';

export default function ProductDemo() {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <div className="container">
        <div className="w-full mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-white mb-20 text-center text-7xl font-bold">
              See it in <span className="text-[#3b82f6]">action</span>
            </h2>

            {/* Video Container */}
            <div className="w-full max-w-5xl mx-auto">
              <div className="relative rounded-2xl overflow-hidden border border-[#222222] shadow-2xl">
                <video
                  className="w-full h-auto"
                  controls
                  autoPlay
                  muted
                  loop
                  playsInline
                >
                  <source src="/videos/Verifily.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
