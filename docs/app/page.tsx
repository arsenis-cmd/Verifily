import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import ProblemSection from '@/components/ProblemSection';
import HowItWorks from '@/components/HowItWorks';
import LiveDemo from '@/components/LiveDemo';
import FeaturesGrid from '@/components/FeaturesGrid';
import ForCreators from '@/components/ForCreators';
import Roadmap from '@/components/Roadmap';
import Testimonials from '@/components/Testimonials';
import CTASection from '@/components/CTASection';
import Footer from '@/components/Footer';
import SmoothScrollWrapper from '@/components/SmoothScrollWrapper';

export default function Home() {
  return (
    <SmoothScrollWrapper>
      <Navigation />
      <main className="w-full relative">
        {/* Hero - Full viewport height */}
        <div className="w-full relative z-10 mb-0">
          <Hero />
        </div>

        {/* Problem Section - Clear separation */}
        <div className="w-full relative z-10 bg-primary-900">
          <ProblemSection />
        </div>

        {/* How It Works - Alternating background */}
        <div className="w-full relative z-10 bg-primary-800/20">
          <HowItWorks />
        </div>

        {/* Live Demo */}
        <div className="w-full relative z-10 bg-primary-900">
          <LiveDemo />
        </div>

        {/* Features Grid - Darker background */}
        <div className="w-full relative z-10 bg-primary-800/30">
          <FeaturesGrid />
        </div>

        {/* For Creators */}
        <div className="w-full relative z-10 bg-primary-900">
          <ForCreators />
        </div>

        {/* Roadmap */}
        <div className="w-full relative z-10 bg-primary-800/20">
          <Roadmap />
        </div>

        {/* Testimonials */}
        <div className="w-full relative z-10 bg-primary-900">
          <Testimonials />
        </div>

        {/* CTA Section - Final call to action */}
        <div className="w-full relative z-10 bg-primary-800/40">
          <CTASection />
        </div>
      </main>
      <Footer />
    </SmoothScrollWrapper>
  );
}
