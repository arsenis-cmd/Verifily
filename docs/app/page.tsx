import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import HowItWorks from '@/components/HowItWorks';
import WhyItMatters from '@/components/WhyItMatters';
import Stats from '@/components/Stats';
import Testimonials from '@/components/Testimonials';
import ForCreators from '@/components/ForCreators';
import CTASection from '@/components/CTASection';
import Footer from '@/components/Footer';
import SmoothScrollWrapper from '@/components/SmoothScrollWrapper';

export default function Home() {
  return (
    <SmoothScrollWrapper>
      {/* Fixed Navigation */}
      <Navigation />

      {/* Main Content - Minimal Black Design */}
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <WhyItMatters />
        <Stats />
        <Testimonials />
        <ForCreators />
        <CTASection />
      </main>

      {/* Footer */}
      <Footer />
    </SmoothScrollWrapper>
  );
}
