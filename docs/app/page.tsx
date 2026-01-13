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
      <main className="w-full">
        {/* Each section is separated with clear boundaries */}
        <div className="w-full">
          <Hero />
        </div>

        <div className="w-full">
          <ProblemSection />
        </div>

        <div className="w-full bg-primary-800/20">
          <HowItWorks />
        </div>

        <div className="w-full">
          <LiveDemo />
        </div>

        <div className="w-full bg-primary-800/30">
          <FeaturesGrid />
        </div>

        <div className="w-full">
          <ForCreators />
        </div>

        <div className="w-full bg-primary-800/20">
          <Roadmap />
        </div>

        <div className="w-full">
          <Testimonials />
        </div>

        <div className="w-full bg-primary-800/40">
          <CTASection />
        </div>
      </main>
      <Footer />
    </SmoothScrollWrapper>
  );
}
