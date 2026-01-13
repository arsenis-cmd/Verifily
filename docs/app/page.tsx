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
      <main className="relative overflow-x-hidden">
        <Hero />
        <ProblemSection />
        <HowItWorks />
        <LiveDemo />
        <FeaturesGrid />
        <ForCreators />
        <Roadmap />
        <Testimonials />
        <CTASection />
      </main>
      <Footer />
    </SmoothScrollWrapper>
  );
}
