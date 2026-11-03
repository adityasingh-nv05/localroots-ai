import type { Metadata } from 'next';
import { Heart, Landmark, Sparkles, TrendingUp, Users, type LucideIcon } from 'lucide-react';
import HeroSection from '@/components/home/HeroSection';
import CategoryCard from '@/components/home/CategoryCard';
import BusinessCard from '@/components/home/BusinessCard';
import ProductCard from '@/components/home/ProductCard';
import DestinationCard from '@/components/home/DestinationCard';
import BenefitCard from '@/components/home/BenefitCard';
import VendorCTA from '@/components/home/VendorCTA';
import SectionHeading from '@/components/ui/SectionHeading';
import ScrollRow from '@/components/ui/ScrollRow';
import DemoBadge from '@/components/ui/DemoBadge';
import {
  CATEGORIES,
  DEMO_NOTE,
  DESTINATIONS,
  FEATURED_BUSINESSES,
  TRENDING_PRODUCTS,
} from '@/lib/data/demo';

export const metadata: Metadata = {
  title: { absolute: 'LocalRoots AI — Discover the Heart of Local India' },
};

const BENEFITS: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: Users,
    title: 'Reach local customers',
    description: 'Get found by people actively searching for authentic, nearby experiences.',
  },
  {
    icon: TrendingUp,
    title: 'Grow your visibility',
    description: 'Give your shop, studio or stall a full profile with photos, story and products.',
  },
  {
    icon: Sparkles,
    title: 'AI-powered discovery',
    description: 'Smart search helps the right customers find the right craft, dish or service.',
  },
  {
    icon: Heart,
    title: 'Keep traditions alive',
    description: 'Showcase heritage skills and family recipes that deserve a wider audience.',
  },
];

function DemoNote() {
  return (
    <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-gray-400">
      <DemoBadge />
      <span>{DEMO_NOTE}</span>
    </p>
  );
}

export default function HomePage() {
  return (
    <>
      <HeroSection />

      {/* Popular categories */}
      <section id="categories" className="scroll-mt-20 bg-gray-50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Popular categories"
            title="What are you looking for today?"
            description="From filter coffee to handwoven silk, browse by what you love."
          />
          <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3 xl:grid-cols-6">
            {CATEGORIES.map((c) => (
              <CategoryCard key={c.id} id={c.id} label={c.label} blurb={c.blurb} />
            ))}
          </div>
        </div>
      </section>

      {/* Featured businesses */}
      <section id="featured" className="scroll-mt-20 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Featured businesses"
            title="Meet a few local favourites"
            description="A taste of the kinds of places you can discover on LocalRoots."
          />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURED_BUSINESSES.map((b) => (
              <BusinessCard key={b.id} business={b} />
            ))}
          </div>
          <DemoNote />
        </div>
      </section>

      {/* Explore Karnataka */}
      <section id="experiences" className="scroll-mt-20 bg-gradient-to-b from-amber-50/60 to-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Cultural experiences"
            title="Explore Karnataka"
            description="Five destinations to start with, each rich in craft, cuisine and history."
          />
          <div className="mt-10">
            <ScrollRow className="md:grid-cols-2 lg:grid-cols-5">
              {DESTINATIONS.map((d) => (
                <DestinationCard key={d.slug} destination={d} />
              ))}
            </ScrollRow>
          </div>
        </div>
      </section>

      {/* Trending products */}
      <section id="trending" className="scroll-mt-20 bg-gray-50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Trending now"
            title="Trending local products and artisans"
            description="Handmade favourites from makers across the state."
          />
          <div className="mt-10">
            <ScrollRow className="md:grid-cols-3">
              {TRENDING_PRODUCTS.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </ScrollRow>
          </div>
          <DemoNote />
        </div>
      </section>

      {/* Benefits for business owners */}
      <section id="benefits" className="scroll-mt-20 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="For business owners"
            title="Why local businesses grow with LocalRoots"
            description="Built for artisans, food makers and small shops that are the heart of their neighbourhoods."
          />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map((b) => (
              <BenefitCard key={b.title} icon={b.icon} title={b.title} description={b.description} />
            ))}
          </div>
        </div>
      </section>

      <VendorCTA />
    </>
  );
}
