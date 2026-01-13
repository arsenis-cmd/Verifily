import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import Problem from '@/components/Problem';
import HowItWorks from '@/components/HowItWorks';
import LiveDemo from '@/components/LiveDemo';
import Features from '@/components/Features';
import ForCreators from '@/components/ForCreators';
import Roadmap from '@/components/Roadmap';
import Testimonials from '@/components/Testimonials';
import CTA from '@/components/CTA';
import Footer from '@/components/Footer';
import SmoothScroll from '@/components/SmoothScroll';

export default function Home() {
  return (
    <>
      <SmoothScroll />
      <Navigation />
      <main>
        <Hero />
        <Problem />
        <HowItWorks />
        <LiveDemo />
        <Features />
        <ForCreators />
        <Roadmap />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
