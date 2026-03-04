import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

const BritishSEOIntroSection = () => {
  const { t } = useLanguage();

  return (
    <section className="py-16 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="font-playfair text-3xl md:text-4xl lg:text-5xl font-semibold mb-4 leading-tight">
            {t('british.heroTitle')}
          </h1>
          <p className="text-base md:text-lg text-muted-foreground mb-6">
            {t('british.heroSubtitle')}
          </p>
          <h2 className="font-playfair text-2xl md:text-3xl lg:text-4xl font-semibold mb-6 leading-tight">
            {t('british.seoIntro.title')}
          </h2>

          <div className="max-w-4xl mx-auto space-y-6 text-lg text-muted-foreground">
            <p dangerouslySetInnerHTML={{ __html: t('british.seoIntro.paragraph1') }} />
            <p dangerouslySetInnerHTML={{ __html: t('british.seoIntro.paragraph2') }} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid md:grid-cols-3 gap-6"
        >
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
              <div className="bg-amber-500/10 rounded-full p-2 mt-1">
                <Check className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">{t('british.seoIntro.feature1Title')}</h3>
                <p className="text-muted-foreground">{t('british.seoIntro.feature1Desc')}</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
              <div className="bg-amber-500/10 rounded-full p-2 mt-1">
                <Check className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">{t('british.seoIntro.feature2Title')}</h3>
                <p className="text-muted-foreground">{t('british.seoIntro.feature2Desc')}</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
              <div className="bg-amber-500/10 rounded-full p-2 mt-1">
                <Check className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">{t('british.seoIntro.feature3Title')}</h3>
                <p className="text-muted-foreground">{t('british.seoIntro.feature3Desc')}</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 text-center"
        >
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">{t('british.seoIntro.license')}</strong> |
            Регистрирани в <strong className="text-foreground">FIFe и WCF</strong> |
            Шампионски родители с високи оценки
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default BritishSEOIntroSection;
