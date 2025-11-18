import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, ArrowRight, ArrowLeft, Newspaper } from 'lucide-react';
import ModernNavigation from '@/components/ModernNavigation';
import Footer from '@/components/Footer';
import LocationMap from '@/components/LocationMap';
import { usePublishedAnnouncements } from '@/services/convexAnnouncementService';
import { useLanguage } from '@/hooks/useLanguage';

const News = () => {
  const { t } = useLanguage();
  const announcements = usePublishedAnnouncements();
  const [currentPage, setCurrentPage] = useState(1);
  
  const itemsPerPage = 9;
  const totalPages = Math.ceil((announcements?.length || 0) / itemsPerPage);
  
  const paginatedNews = announcements?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  ) || [];

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('bg-BG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const generateSlug = (title: string, id: string) => {
    const slug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    return slug || id;
  };

  return (
    <>
      <Helmet>
        <title>Новини и Събития | BleuRoi Ragdoll Cattery България</title>
        <meta
          name="description"
          content="Последни новини, събития и информация от развъдник BleuRoi Ragdoll. Нови котила, изложби, шампионски титли и актуална информация за Рагдол котки."
        />
        <meta name="keywords" content="ragdoll новини българия, котила ragdoll, изложби котки, блеурои новини, рагдол събития" />
        <link rel="canonical" href={`${window.location.origin}/news`} />
        
        {/* Open Graph tags */}
        <meta property="og:title" content="Новини от BleuRoi Ragdoll Cattery" />
        <meta property="og:description" content="Последните новини, събития и постижения от BleuRoi Ragdoll Cattery" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${window.location.origin}/news`} />
        
        {/* Twitter Card tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Новини от BleuRoi Ragdoll Cattery" />
        <meta name="twitter:description" content="Последните новини, събития и постижения от BleuRoi Ragdoll Cattery" />

        {/* Structured data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Blog",
            "name": "BleuRoi Ragdoll Cattery Новини",
            "description": "Новини и събития от BleuRoi Ragdoll Cattery",
            "url": `${window.location.origin}/news`,
            "publisher": {
              "@type": "Organization",
              "name": "BleuRoi Ragdoll Cattery"
            }
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <ModernNavigation />
        
        <main className="pt-20">
          {/* Hero Section */}
          <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-primary/5 to-background">
            <div className="max-w-4xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6"
              >
                <Newspaper className="h-4 w-4" />
                Новини и събития
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="font-playfair text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6"
              >
                Новини от
                <span className="text-primary"> BleuRoi</span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-xl text-muted-foreground max-w-2xl mx-auto"
              >
                Следете последните новини, събития и постижения от нашето семейство от красиви рагдол котки
              </motion.p>
            </div>
          </section>

          {/* News Grid */}
          <section className="py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              {paginatedNews.length > 0 ? (
                <>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12"
                  >
                    {paginatedNews.map((article, index) => (
                      <motion.div
                        key={article._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                      >
                        <Link to={`/news/${article.slug || generateSlug(article.title, article._id)}`}>
                          <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer hover:scale-[1.02] h-full">
                            {article.featuredImage && (
                              <div className="aspect-video overflow-hidden">
                                <img
                                  src={article.featuredImage}
                                  alt={article.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  loading="lazy"
                                />
                              </div>
                            )}
                            <CardContent className="p-6 flex flex-col h-full">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                                <Calendar className="h-4 w-4" />
                                <time dateTime={new Date(article.publishedAt).toISOString()}>
                                  {formatDate(article.publishedAt)}
                                </time>
                              </div>
                              
                              <h2 className="font-playfair text-xl font-semibold text-foreground mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                                {article.title}
                              </h2>
                              
                              <p className="text-muted-foreground text-sm leading-relaxed line-clamp-4 mb-4 flex-grow">
                                {article.content}
                              </p>

                              <div className="flex items-center text-primary text-sm font-medium group-hover:gap-2 transition-all duration-200">
                                <span>Прочети повече</span>
                                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      </motion.div>
                    ))}
                  </motion.div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.6, delay: 0.4 }}
                      className="flex items-center justify-center gap-2"
                    >
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="min-h-[44px]"
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Предишна
                      </Button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className="min-w-[44px] min-h-[44px]"
                          >
                            {page}
                          </Button>
                        ))}
                      </div>
                      
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="min-h-[44px]"
                      >
                        Следваща
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </motion.div>
                  )}
                </>
              ) : (
                <div className="text-center py-16">
                  <Newspaper className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
                  <h2 className="font-playfair text-2xl font-semibold text-foreground mb-4">
                    Все още няма публикувани новини
                  </h2>
                  <p className="text-muted-foreground mb-8">
                    Скоро ще споделим интересни новини и събития с вас
                  </p>
                  <Link to="/">
                    <Button size="lg" className="min-h-[44px]">
                      Обратно към началото
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </section>
        </main>

        <LocationMap />
        <Footer />
      </div>
    </>
  );
};

export default News;