import { useState } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Button } from '@/components/ui/button';
import AdminLogin from './AdminLogin';
import CatManager from '@/components/admin/CatManager';
import PedigreeCanvas from '@/components/admin/PedigreeCanvas';
import TikTokVideoManager from '@/components/admin/TikTokVideoManager';
import SocialMediaSettings from '@/components/admin/SocialMediaSettings';
import NewsManager from '@/components/admin/NewsManager';
import GalleryManager from '@/components/admin/GalleryManager';
import AnalyticsManager from '@/components/admin/AnalyticsManager';
import HeroVideoManager from '@/components/admin/HeroVideoManager';
import QRCodeGenerator from '@/components/admin/QRCodeGenerator';
import { CatData } from '@/services/convexCatService';
import ragdollLogo from '@/assets/ragdoll-logo.png';
import { Menu, X } from 'lucide-react';

type AdminTab = 'pedigree' | 'news' | 'gallery' | 'tiktok' | 'social' | 'herovideo' | 'qr' | 'analytics';

const Admin = () => {
  const { isAuthenticated, isLoading, logout } = useAdminAuth();
  const [selectedCat, setSelectedCat] = useState<CatData | null>(null);
  const [canvasInstance, setCanvasInstance] = useState<{ addCatToCanvas: (cat: CatData, position?: { x: number; y: number }) => void } | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>('pedigree');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const adminTabs = [
    { id: 'pedigree' as AdminTab, label: 'Родословие', icon: '🌳' },
    { id: 'news' as AdminTab, label: 'Новини', icon: '📰' },
    { id: 'gallery' as AdminTab, label: 'Галерия', icon: '🖼️' },
    { id: 'tiktok' as AdminTab, label: 'TikTok видеа', icon: '🎵' },
    { id: 'social' as AdminTab, label: 'Социални мрежи', icon: '📱' },
    { id: 'herovideo' as AdminTab, label: 'Hero Видео', icon: '🎬' },
    { id: 'qr' as AdminTab, label: 'QR Код', icon: '📊' },
    { id: 'analytics' as AdminTab, label: 'Аналитика', icon: '📈' }
  ];

  const handleTabChange = (tab: AdminTab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false); // Close mobile menu when tab is selected
  };

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Зареждане...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin />;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'pedigree':
        return (
          <div className="flex flex-col lg:flex-row min-h-0 flex-1">
            {/* Left Panel - Cat Manager */}
            <div className="w-full lg:w-2/5 bg-white lg:border-r border-b lg:border-b-0">
              <CatManager
                onCatSelect={setSelectedCat}
                selectedCat={selectedCat}
                onAddToCanvas={(cat) => {
                  setSelectedCat(cat);
                }}
                onDropCatToCanvas={(cat, position) => {
                  canvasInstance?.addCatToCanvas(cat, position);
                }}
              />
            </div>

            {/* Right Panel - Pedigree Canvas */}
            <div className="flex-1 bg-background min-h-[400px] lg:min-h-0">
              <PedigreeCanvas 
                selectedCat={selectedCat} 
                onCanvasReady={setCanvasInstance}
              />
            </div>
          </div>
        );
      case 'news':
        return <NewsManager />;
      case 'gallery':
        return <GalleryManager />;
      case 'tiktok':
        return <TikTokVideoManager />;
      case 'social':
        return <SocialMediaSettings />;

      case 'herovideo':
        return <HeroVideoManager />;
      case 'qr':
        return <QRCodeGenerator />;
      case 'analytics':
        return <AnalyticsManager />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex flex-col">
      {/* Header */}
      <div className="bg-card shadow-sm border-b border-border">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4">
          <div className="flex items-center space-x-3">
            <img 
              src={ragdollLogo} 
              alt="My Pets Ragdoll Logo" 
              className="w-10 h-10 object-contain"
            />
            <h1 className="font-playfair text-xl sm:text-2xl font-semibold text-foreground">
              Admin Dashboard
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden w-10 h-10 rounded-lg border border-border bg-background hover:bg-muted flex items-center justify-center touch-manipulation"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-foreground" />
              ) : (
                <Menu className="w-5 h-5 text-foreground" />
              )}
            </button>
            
            {/* Logout Button */}
            <Button
              onClick={logout}
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground min-h-[44px] px-4 touch-manipulation"
            >
              Изход
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="fixed top-0 left-0 w-80 max-w-[85vw] h-full bg-card shadow-xl border-r border-border" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-8">
                <h2 className="font-playfair text-lg font-semibold text-foreground">Навигация</h2>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center"
                >
                  <X className="w-5 h-5 text-foreground" />
                </button>
              </div>
              
              <nav className="space-y-2">
                {adminTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors touch-manipulation ${
                      activeTab === tab.id
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span className="text-lg">{tab.icon}</span>
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Tab Navigation */}
      <div className="hidden lg:block bg-card border-b border-border">
        <div className="flex px-4 sm:px-6 overflow-x-auto">
          {adminTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap min-h-[60px] touch-manipulation ${
                activeTab === tab.id
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
              }`}
            >
              <span className="text-base">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Active Tab Indicator */}
      <div className="lg:hidden bg-card border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{adminTabs.find(tab => tab.id === activeTab)?.icon}</span>
          <span className="font-medium text-foreground">{adminTabs.find(tab => tab.id === activeTab)?.label}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default Admin;