// src/pages/HomePage.tsx
// Full luxury homepage — all sections assembled in correct order
import SEO from '@/components/shared/SEO'
import { motion } from 'framer-motion'
import { pageTransition } from '@/lib/animations'
import { useHomepageProducts, useFlashSaleProducts } from '@/hooks/useProducts'
import type { Product } from '@/types'

// Layout & Section components
import HeroSlider from '@/components/home/HeroSlider'
import CategoryGrid from '@/components/home/CategoryGrid'
import ProductSection from '@/components/home/ProductSection'
import FlashSaleSection from '@/components/home/FlashSaleSection'
import BrandStory from '@/components/home/BrandStory'
import WhyChooseUs from '@/components/home/WhyChooseUs'
import ReviewsCarousel from '@/components/home/ReviewsCarousel'
import NewsletterSection from '@/components/home/NewsletterSection'

export default function HomePage() {
  const { data: homepageData, isLoading: homepageLoading } = useHomepageProducts()
  const { data: flashData, isLoading: flashLoading } = useFlashSaleProducts()

  const content = homepageData?.content
  const featured = homepageData?.featured ?? []
  const newArrivals = homepageData?.newArrivals ?? []
  const bestSellers = homepageData?.bestSellers ?? []
  const trending = homepageData?.trending ?? []

  return (
    <>
      <SEO 
        title="PUSPALOY – Luxury Beauty & Gifts Bangladesh"
        description="Discover luxury cosmetics, elegant women's shoes, personalized gifts, and trendy accessories at Puspaloy. Premium quality, exclusive collections, and fast delivery across Bangladesh."
        image={content?.heroBanners[0]?.image || "https://puspaloygiftzone.shop/og-image.jpg"}
        url="https://puspaloygiftzone.shop/"
      />

      <motion.div variants={pageTransition} initial="hidden" animate="visible">

        {/* ── 1. Hero Slider ─────────────────────────────────── */}
        <HeroSlider banners={content?.heroBanners} />

        {/* ── 2. Category Grid ───────────────────────────────── */}
        <CategoryGrid />

        {/* ── 3. Featured Products ───────────────────────────── */}
        <ProductSection
          label="Handpicked for You"
          title="Featured Collection"
          subtitle="Our most-loved pieces, carefully curated for elegance and quality"
          products={featured as Product[]}
          isLoading={homepageLoading}
          viewAllHref="/catalog"
          bgColor="primary"
          maxItems={8}
        />

        {/* ── 4. Flash Sale ──────────────────────────────────── */}
        <FlashSaleSection
          flashSale={flashData?.flashSale}
          products={flashData?.products ?? []}
          isLoading={flashLoading}
        />

        {/* ── 5. New Arrivals ────────────────────────────────── */}
        <ProductSection
          label="Just Landed"
          title="New Arrivals"
          subtitle="Fresh additions to our luxury collection — be the first to discover them"
          products={newArrivals as Product[]}
          isLoading={homepageLoading}
          viewAllHref="/category/cosmetics"
          bgColor="muted"
          maxItems={8}
        />

        {/* ── 6. Best Sellers ────────────────────────────────── */}
        <ProductSection
          label="Customer Favorites"
          title="Best Sellers"
          subtitle="The products our customers love most — bestselling for good reason"
          products={bestSellers as Product[]}
          isLoading={homepageLoading}
          viewAllHref="/category/gifts"
          bgColor="primary"
          maxItems={8}
        />

        {/* ── 7. Trending Products ───────────────────────────── */}
        <ProductSection
          label="What's Hot"
          title="Trending Now"
          subtitle="The most talked-about products this season"
          products={trending as Product[]}
          isLoading={homepageLoading}
          viewAllHref="/category/accessories"
          bgColor="muted"
          maxItems={4}
        />

        {/* ── 8. Brand Story ─────────────────────────────────── */}
        <BrandStory />

        {/* ── 9. Why Choose Us ───────────────────────────────── */}
        <WhyChooseUs />

        {/* ── 10. Customer Reviews ───────────────────────────── */}
        <ReviewsCarousel />

        {/* ── 11. Newsletter ─────────────────────────────────── */}
        <NewsletterSection />

      </motion.div>
    </>
  )
}
