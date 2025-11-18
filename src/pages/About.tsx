import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import ModernNavigation from '@/components/ModernNavigation';
import Footer from '@/components/Footer';
import LocationMap from '@/components/LocationMap';
import SocialSidebar from '@/components/SocialSidebar';
import AboutHero from '../components/about/AboutHero';
import CatteryIntro from '../components/about/CatteryIntro';
import BreedHistory from '../components/about/BreedHistory';
import RagdollInfo from '../components/about/RagdollInfo';
import CTASection from '../components/about/CTASection';
import BusinessGallery from '@/components/BusinessGallery';
import GallerySection from '@/components/GallerySection';

const About = () => {
  const [mounted, setMounted] = useState(true);

  return (
    <>
      <Helmet>
        <title>За Нас | Лицензиран Развъдник Ragdoll Котки BleuRoi | FIFe WCF</title>
        <meta name="description" content="BleuRoi Ragdoll Cattery - професионален развъдник на породисти Рагдол котки в България. Регистрирани в FIFe и WCF. Лиценз 47090/2024. Шампионски родители от Европа." />
        <meta name="keywords" content="развъдник ragdoll българия, bleuroi ragdoll, лицензиран развъдник котки, FIFe WCF, породисти котки, професионален развъдник, ragdoll cattery" />
        <meta property="og:title" content="За Нас | Лицензиран Развъдник Ragdoll Котки BleuRoi" />
        <meta property="og:description" content="BleuRoi Ragdoll Cattery - професионален развъдник на породисти Рагдол котки в България. Регистрирани в FIFe и WCF." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${window.location.origin}/about`} />
        <link rel="canonical" href={`${window.location.origin}/about`} />
      </Helmet>

      <div className="min-h-screen bg-background relative">
        {/* Navigation */}
        <ModernNavigation />

        {/* Decorative background similar to homepage */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        </div>

        <main className="pt-24">
          {/* Page Hero */}
          <AboutHero />

          {/* Intro / Cattery section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <CatteryIntro />
          </motion.section>

          {/* Subtle divider */}
          <div className="flex items-center justify-center my-12">
            <div className="w-12 h-px bg-muted-foreground/30" />
            <div className="w-2 h-2 rounded-full bg-muted-foreground/50 mx-3" />
            <div className="w-12 h-px bg-muted-foreground/30" />
          </div>

          {/* Breed History */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6 }}
          >
            <BreedHistory />
          </motion.section>

          {/* Awards & Business gallery */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <BusinessGallery />
          </motion.section>

          {/* Ragdoll information */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6 }}
          >
            <RagdollInfo />
          </motion.section>

          {/* Image gallery from site */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6 }}
          >
            <GallerySection />
          </motion.section>

          {/* CTA */}
          <CTASection />
        </main>

        {/* Sticky Social Sidebar */}
        {mounted && <SocialSidebar />}

        {/* Footer */}
        <LocationMap />
        <Footer />

        {/* Structured Data for Organization */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "BleuRoi Ragdoll Cattery",
            "alternateName": "БлюРоа Рагдол Развъдник",
            "url": "https://www.ragdollbleuroi.eu",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "Сестри Дукови 4",
              "addressLocality": "Гоце Делчев",
              "postalCode": "2900",
              "addressCountry": "BG"
            },
            "sameAs": [
              "https://www.facebook.com/bleuroi.ragdoll",
              "https://www.instagram.com/bleuroi.ragdoll",
              "https://www.tiktok.com/@bleuroi.ragdol.cattery"
            ]
          })}
        </script>
      </div>
    </>
  );
};

export default About;


