import { useParams, Link, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, ArrowLeft, ArrowRight, Share2, Eye } from 'lucide-react';
import ModernNavigation from '@/components/ModernNavigation';
import Footer from '@/components/Footer';
import LocationMap from '@/components/LocationMap';
import { useAnnouncementBySlug, useLatestAnnouncements } from '@/services/convexAnnouncementService';
import { useLanguage } from '@/hooks/useLanguage';
import { toast } from '@/hooks/use-toast';

const NewsArticle = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useLanguage();
  
  const article = useAnnouncementBySlug(slug || '');
  const relatedArticles = useLatestAnnouncements(3);

  // Filter out current article from related articles
  const filteredRelatedArticles = relatedArticles?.filter(
    item => item._id !== article?._id
  ).slice(0, 2) || [];

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

  const handleShare = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: article?.title,
          text: article?.content.substring(0, 150) + '...',
          url: url,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(url);
        toast({
          title: "Успех",
          description: "Линкът е копиран в клипборда",
        });
      } catch (err) {
        console.log('Error copying to clipboard:', err);
      }
    }
  };

  // Show loading state
  if (article === undefined) {
    return (
      <div className="min-h-screen bg-background">
        <ModernNavigation />
        <main className="pt-20">
          <div className="container mx-auto px-4 py-16">
            <div className="max-w-4xl mx-auto">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-64 bg-muted rounded"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Article not found
  if (article === null) {
    return <Navigate to="/news" replace />;
  }

  const articleUrl = `${window.location.origin}/news/${slug}`;
  const metaDescription = article.metaDescription || 
    (article.content.length > 160 ? article.content.substring(0, 157) + '...' : article.content);

  return (
    <>
      <Helmet>
        <title>{article.title} | BleuRoi Ragdoll Cattery</title>
        <meta name="description" content={metaDescription} />
        <meta name="keywords" content={article.metaKeywords || `рагдол новини, ${article.title}, BleuRoi`} />
        
        {/* Open Graph tags */}
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={articleUrl} />
        {article.featuredImage && (
          <meta property="og:image" content={article.featuredImage} />
        )}
        <meta property="article:published_time" content={new Date(article.publishedAt).toISOString()} />
        <meta property="article:modified_time" content={new Date(article.updatedAt).toISOString()} />
        <meta property="article:author" content="BleuRoi Ragdoll Cattery" />
        
        {/* Twitter Card tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={article.title} />
        <meta name="twitter:description" content={metaDescription} />
        {article.featuredImage && (
          <meta name="twitter:image" content={article.featuredImage} />
        )}

        {/* Canonical URL */}
        <link rel="canonical" href={articleUrl} />

        {/* Structured data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": article.title,
            "description": metaDescription,
            "url": articleUrl,
            "datePublished": new Date(article.publishedAt).toISOString(),
            "dateModified": new Date(article.updatedAt).toISOString(),
            "author": {
              "@type": "Organization",
              "name": "BleuRoi Ragdoll Cattery"
            },
            "publisher": {
              "@type": "Organization",
              "name": "BleuRoi Ragdoll Cattery"
            },
            ...(article.featuredImage && {
              "image": {
                "@type": "ImageObject",
                "url": article.featuredImage
              }
            })
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <ModernNavigation />
        
        <main className="pt-20">
          {/* Breadcrumbs */}
          <section className="py-4 px-4 sm:px-6 lg:px-8 border-b border-border">
            <div className="max-w-4xl mx-auto">
              <nav className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link to="/" className="hover:text-foreground transition-colors">
                  Начало
                </Link>
                <span>›</span>
                <Link to="/news" className="hover:text-foreground transition-colors">
                  Новини
                </Link>
                <span>›</span>
                <span className="text-foreground line-clamp-1">{article.title}</span>
              </nav>
            </div>
          </section>

          {/* Article Content */}
          <article className="py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              {/* Article Header */}
              <motion.header 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mb-8"
              >
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <Calendar className="h-4 w-4" />
                  <time dateTime={new Date(article.publishedAt).toISOString()}>
                    {formatDate(article.publishedAt)}
                  </time>
                  {article.updatedAt !== article.publishedAt && (
                    <>
                      <span>•</span>
                      <span>Обновена {formatDate(article.updatedAt)}</span>
                    </>
                  )}
                </div>
                
                <h1 className="font-playfair text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6 leading-tight">
                  {article.title}
                </h1>

                {/* Share Button */}
                <div className="flex items-center gap-4 mb-8">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShare}
                    className="min-h-[40px]"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Споделете
                  </Button>
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    <Eye className="h-3 w-3 mr-1" />
                    Публикувана
                  </Badge>
                </div>
              </motion.header>

              {/* Featured Image */}
              {article.featuredImage && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="mb-8"
                >
                  <div className="aspect-video rounded-2xl overflow-hidden bg-muted">
                    <img
                      src={article.featuredImage}
                      alt={article.title}
                      className="w-full h-full object-cover"
                      loading="eager"
                    />
                  </div>
                </motion.div>
              )}

              {/* Article Body */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="prose prose-lg max-w-none mb-12"
              >
                <div className="text-foreground leading-relaxed whitespace-pre-line">
                  {article.content}
                </div>
              </motion.div>

              {/* Navigation */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="border-t border-border pt-8 mb-12"
              >
                <Link to="/news">
                  <Button variant="outline" className="min-h-[44px]">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Обратно към новините
                  </Button>
                </Link>
              </motion.div>

              {/* Related Articles */}
              {filteredRelatedArticles.length > 0 && (
                <motion.section 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="border-t border-border pt-12"
                >
                  <h2 className="font-playfair text-2xl font-bold text-foreground mb-6">
                    Други новини
                  </h2>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {filteredRelatedArticles.map((relatedArticle) => (
                      <Link 
                        key={relatedArticle._id}
                        to={`/news/${relatedArticle.slug || generateSlug(relatedArticle.title, relatedArticle._id)}`}
                      >
                        <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-[1.02] h-full">
                          {relatedArticle.featuredImage && (
                            <div className="aspect-video overflow-hidden">
                              <img
                                src={relatedArticle.featuredImage}
                                alt={relatedArticle.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                              />
                            </div>
                          )}
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                              <Calendar className="h-3 w-3" />
                              <time>{formatDate(relatedArticle.publishedAt)}</time>
                            </div>
                            
                            <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                              {relatedArticle.title}
                            </h3>
                            
                            <p className="text-muted-foreground text-sm line-clamp-2 mt-2">
                              {('content' in relatedArticle ? relatedArticle.content : '')}
                            </p>

                            <div className="flex items-center text-primary text-xs font-medium mt-3 group-hover:gap-1 transition-all duration-200">
                              <span>Прочети</span>
                              <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform duration-200" />
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </motion.section>
              )}
            </div>
          </article>
        </main>

        <LocationMap />
        <Footer />
      </div>
    </>
  );
};

export default NewsArticle;