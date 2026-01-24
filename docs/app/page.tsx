import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import ProductDemo from '@/components/ProductDemo';
import Features from '@/components/Features';
import HowItWorks from '@/components/HowItWorks';
import Stats from '@/components/Stats';
import WhyItMatters from '@/components/WhyItMatters';
import Testimonials from '@/components/Testimonials';
import Newsletter from '@/components/Newsletter';
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
        <ProductDemo />
        <Features />
        <HowItWorks />
        <Stats />
        <WhyItMatters />
        <Testimonials />
        <Newsletter />
        <ForCreators />
        <CTASection />
      </main>

      {/* Footer */}
      <Footer />
    </SmoothScrollWrapper>
  );
}
