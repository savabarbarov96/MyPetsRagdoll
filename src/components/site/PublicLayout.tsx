import {
  Component,
  useEffect,
  useState,
  type ReactNode,
  type ImgHTMLAttributes,
} from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Helmet } from "react-helmet-async";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Menu,
  X,
  ChevronDown,
  ArrowUpRight,
  ArrowRight,
  Phone,
  Instagram,
  MessageCircle,
  Music2,
  Facebook,
} from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { CONTACT_PHONE_E164, CONTACT_PHONE_DISPLAY } from "@/config/contact";
import { SITE_URL, COMPANY } from "@/config/site";
import {
  usePublicSocialLinks,
  usePublicLocation,
} from "@/hooks/usePublicContacts";
import responsiveImages from "@/data/responsiveImages.json";
import InquiryDialog from "./InquiryDialog";
import "@/styles/public.css";

export function usePublicText() {
  const { language } = useLanguage();
  return (bg: string, en: string) => (language === "en" ? en : bg);
}
export function usePublicLink() {
  const { language } = useLanguage();
  return (path: string) => {
    const u = new URL(path, SITE_URL);
    if (language === "en") u.searchParams.set("lang", "en");
    else u.searchParams.delete("lang");
    return `${u.pathname}${u.search}${u.hash}`;
  };
}
export function PublicImage({
  src,
  alt,
  priority = false,
  sizes = "(max-width: 640px) 100vw, (max-width: 1000px) 50vw, 33vw",
  ...props
}: ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean }) {
  const item = (
    responsiveImages as Record<
      string,
      { src: string; srcSet: string; width: number; height: number }
    >
  )[src || ""];
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  if (!src || failed)
    return (
      <div
        className={`public-image-empty ${props.className || ""}`}
        role="img"
        aria-label={alt}
      >
        <span>BleuRoi</span>
      </div>
    );
  return (
    <img
      {...props}
      src={item?.src || src}
      srcSet={item?.srcSet}
      sizes={item ? sizes : undefined}
      width={item?.width || props.width}
      height={item?.height || props.height}
      alt={alt || ""}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
export function PublicSEO({
  title,
  description,
  image,
  article = false,
  noindex = false,
}: {
  title: string;
  description: string;
  image?: string;
  article?: boolean;
  noindex?: boolean;
}) {
  const { language } = useLanguage();
  const location = useLocation();
  const path = location.pathname;
  const bgURL = `${SITE_URL}${path}`;
  const enURL = `${bgURL}?lang=en`;
  const canonical = language === "en" ? enURL : bgURL;
  return (
    <Helmet>
      <html lang={language} />
      <title>{title} | BleuRoi</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      <link rel="alternate" hrefLang="bg" href={bgURL} />
      <link rel="alternate" hrefLang="en" href={enURL} />
      <link rel="alternate" hrefLang="x-default" href={bgURL} />
      <meta property="og:title" content={`${title} | BleuRoi`} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={article ? "article" : "website"} />
      <meta property="og:url" content={canonical} />
      <meta
        property="og:locale"
        content={language === "en" ? "en_GB" : "bg_BG"}
      />
      {image && (
        <meta property="og:image" content={new URL(image, SITE_URL).href} />
      )}
      <meta name="twitter:card" content="summary_large_image" />
      {noindex && <meta name="robots" content="noindex,follow" />}
    </Helmet>
  );
}
function PublicDataFailure({ onRetry }: { onRetry: () => void }) {
  const text = usePublicText();
  return (
    <section className="public-container public-data-error" role="alert">
      <h2>{text("Съдържанието не е достъпно.", "Content is unavailable.")}</h2>
      <p>
        {text(
          "Не успяхме да заредим информацията. Моля, опитайте отново.",
          "We could not load the information. Please try again.",
        )}
      </p>
      <button className="public-button" onClick={onRetry}>
        {text("Опитайте отново", "Try again")}
      </button>
    </section>
  );
}
export class PublicDataBoundary extends Component<
  { children: ReactNode },
  { error: boolean; retry: number }
> {
  state = { error: false, retry: 0 };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    if (this.state.error)
      return (
        <PublicDataFailure
          onRetry={() =>
            this.setState({ error: false, retry: this.state.retry + 1 })
          }
        />
      );
    return <div key={this.state.retry}>{this.props.children}</div>;
  }
}
export function PublicLayout({ children }: { children?: ReactNode }) {
  const socialLinks = usePublicSocialLinks();
  const contactLocation = usePublicLocation();
  const { language, setLanguage } = useLanguage();
  const text = usePublicText();
  const url = usePublicLink();
  const location = useLocation();
  const [mobile, setMobile] = useState(false);
  const [inquiry, setInquiry] = useState(false);
  const contextID = location.pathname.startsWith("/cat/")
    ? location.pathname.split("/")[2]
    : new URLSearchParams(location.search).get("cat");
  const contextCats = useQuery(
    api.cats.getDisplayedCats,
    contextID ? {} : "skip",
  );
  const articleSlug = location.pathname.startsWith("/news/")
    ? location.pathname.split("/")[2]
    : undefined;
  const contextArticle = useQuery(
    api.announcements.getAnnouncementBySlug,
    articleSlug ? { slug: articleSlug } : "skip",
  );
  const contextCat = contextCats?.find(
    (cat) => cat._id === contextID && cat.isDisplayed,
  );
  const inquiryContext = contextCat
    ? {
        catId: contextCat._id,
        name: contextCat.name,
        url: `${SITE_URL}/cat/${contextCat._id}`,
      }
    : contextArticle?.isPublished
      ? { name: contextArticle.title, url: `${SITE_URL}${location.pathname}` }
      : undefined;
  useEffect(() => {
    setMobile(false);
    if (!location.hash) {
      window.scrollTo({ top: 0, behavior: "instant" });
      return;
    }
    let id: string;
    try {
      id = decodeURIComponent(location.hash.slice(1));
    } catch {
      return;
    }
    const scroll = () => {
      const element = document.getElementById(id);
      if (!element) return false;
      element.scrollIntoView();
      return true;
    };
    if (scroll()) return;
    const observer = new MutationObserver(() => {
      if (scroll()) observer.disconnect();
    });
    observer.observe(document.getElementById("main-content") || document.body, {
      childList: true,
      subtree: true,
    });
    const timer = window.setTimeout(() => observer.disconnect(), 15000);
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, [location.pathname, location.hash]);
  const groups = [
    {
      label: text("Нашите котки", "Our cats"),
      links: [
        [text("Ragdoll", "Ragdoll"), "/#models"],
        ["British Longhair & Shorthair", "/british"],
        [text("Всички котки", "All cats"), "/all-cats"],
        [text("Котенца", "Kittens"), "/#kittens"],
        [text("Мъжки", "Males"), "/#males"],
        [text("Женски", "Females"), "/#females"],
      ],
    },
    {
      label: text("Развъдникът", "The cattery"),
      links: [
        [text("За нас", "About us"), "/about"],
        [text("Доверие и документи", "Trust & documents"), "/trust"],
        [text("Галерия", "Gallery"), "/about#gallery"],
      ],
    },
    {
      label: text("Полезно", "Good to know"),
      links: [
        [text("Новини и истории", "News & stories"), "/news"],
        [text("Въпроси и отговори", "Questions & answers"), "/#faq"],
        [text("Списък за котенце", "Kitten waiting list"), "/waiting-list"],
      ],
    },
  ];
  return (
    <div className="public-site">
      <a className="public-skip" href="#main-content">
        {text("Към съдържанието", "Skip to content")}
      </a>
      <header className="public-header">
        <div className="public-company-strip">
          <div className="public-company-inner public-container">
            <Link className="public-company-name" to={url("/contact")}>
              {COMPANY.name}
              <ArrowUpRight size={13} aria-hidden="true" />
            </Link>
            <a
              className="public-company-phone"
              href={`tel:${CONTACT_PHONE_E164}`}
            >
              <Phone size={13} aria-hidden="true" />
              {CONTACT_PHONE_DISPLAY}
            </a>
          </div>
        </div>
        <div className="public-header-main public-container">
          <Link
            to={url("/")}
            className="public-brand"
            aria-label="BleuRoi — начало"
          >
            <img src="/bleuroi-logo-nav.webp" width="48" height="48" alt="" />
            <span>
              BleuRoi<small>RAGDOLL & BRITISH CATTERY</small>
            </span>
          </Link>
          <nav
            className="public-desktop-nav"
            aria-label={text("Основна навигация", "Main navigation")}
          >
            {groups.map((group) => (
              <DropdownMenu.Root key={group.label}>
                <DropdownMenu.Trigger className="public-nav-trigger">
                  {group.label}
                  <ChevronDown size={14} />
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    className="public-nav-dropdown"
                    sideOffset={14}
                  >
                    {group.links.map(([label, path]) => (
                      <DropdownMenu.Item asChild key={path}>
                        <Link to={url(path)}>{label}</Link>
                      </DropdownMenu.Item>
                    ))}
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            ))}
            <Link to={url("/contact")}>{text("Контакти", "Contact")}</Link>
          </nav>
          <div className="public-header-actions">
            <div
              className="public-language"
              aria-label={text("Език", "Language")}
            >
              <button
                aria-pressed={language === "bg"}
                onClick={() => setLanguage("bg")}
              >
                BG
              </button>
              <span>/</span>
              <button
                aria-pressed={language === "en"}
                onClick={() => setLanguage("en")}
              >
                EN
              </button>
            </div>
            <button
              className="public-button public-reserve"
              onClick={() => setInquiry(true)}
            >
              {text("Резервирай", "Reserve")}
              <ArrowUpRight size={16} />
            </button>
            <button
              className="public-mobile-toggle"
              aria-expanded={mobile}
              aria-controls="public-mobile-menu"
              aria-label={
                mobile
                  ? text("Затвори менюто", "Close menu")
                  : text("Отвори менюто", "Open menu")
              }
              onClick={() => setMobile(!mobile)}
            >
              {mobile ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        {mobile && (
          <nav
            id="public-mobile-menu"
            className="public-mobile-nav"
            aria-label={text("Мобилна навигация", "Mobile navigation")}
          >
            {groups.map((group) => (
              <details key={group.label}>
                <summary>
                  {group.label}
                  <ChevronDown size={17} />
                </summary>
                {group.links.map(([label, path]) => (
                  <Link
                    key={path}
                    to={url(path)}
                    onClick={() => setMobile(false)}
                  >
                    {label}
                  </Link>
                ))}
              </details>
            ))}
            <Link to={url("/contact")}>{text("Контакти", "Contact")}</Link>
          </nav>
        )}
      </header>
      <main id="main-content">{children ?? <Outlet />}</main>
      <footer className="public-footer" id="contact">
        <div className="public-container">
          <div className="public-footer-invitation">
            <div>
              <h2>
                {text(
                  "Нека намерим вашето котенце.",
                  "Let’s find your kitten.",
                )}
              </h2>
              <p>
                {text(
                  "Попитайте за котенце или предстоящо котило. Изберете удобен за вас начин да се свържете с нас.",
                  "Ask about a kitten or an upcoming litter. Choose the contact channel that suits you.",
                )}
              </p>
            </div>
            <button className="public-button" onClick={() => setInquiry(true)}>
              {text("Резервирай", "Reserve")}
              <ArrowUpRight size={18} aria-hidden="true" />
            </button>
          </div>
          <div className="public-footer-top">
            <div className="public-footer-identity">
              <Link className="public-footer-brand" to={url("/")}>
                BleuRoi
              </Link>
              <p>Ragdoll & British Longhair / Shorthair</p>
              <p>{contactLocation.address}</p>
              <a
                className="public-footer-phone"
                href={`tel:${CONTACT_PHONE_E164}`}
              >
                {CONTACT_PHONE_DISPLAY}
              </a>
              <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
            </div>
            <div className="public-footer-explore">
              <h3>{text("Разгледайте", "Explore")}</h3>
              <Link to={url("/all-cats")}>
                {text("Нашите котки", "Our cats")}
              </Link>
              <Link to={url("/about")}>{text("За нас", "About us")}</Link>
              <Link to={url("/trust")}>
                {text("Доверие и документи", "Trust & documents")}
              </Link>
              <Link to={url("/news")}>{text("Новини", "News")}</Link>
              <Link to={url("/waiting-list")}>
                {text("Списък за котенце", "Waiting list")}
              </Link>
              <Link to={url("/contact")}>{text("Контакти", "Contact")}</Link>
            </div>
            <div className="public-footer-channels">
              <h3>{text("Пишете ни", "Message us")}</h3>
              <a
                href="https://wa.me/359894474966"
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle size={18} aria-hidden="true" />
                <span>WhatsApp</span>
                <ArrowUpRight size={16} aria-hidden="true" />
              </a>
              <a
                href={socialLinks.instagram}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Instagram size={18} aria-hidden="true" />
                <span>Instagram</span>
                <ArrowUpRight size={16} aria-hidden="true" />
              </a>
              <a
                href={socialLinks.tiktok}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Music2 size={18} aria-hidden="true" />
                <span>TikTok</span>
                <ArrowUpRight size={16} aria-hidden="true" />
              </a>
              <a
                href={socialLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Facebook size={18} aria-hidden="true" />
                <span>Facebook</span>
                <ArrowUpRight size={16} aria-hidden="true" />
              </a>
            </div>
          </div>
          <div className="public-company-details">
            <p>
              <strong>РЕД ХАВАЛЕ ЕООД</strong> · ЕИК 202955527 · МОЛ СААДЕТИН
              ХАВАЛЕ
            </p>
            <p>{COMPANY.address}</p>
            <p>ragdollbleuroi.eu</p>
          </div>
          <div className="public-footer-bottom">
            <span>© {new Date().getFullYear()} BleuRoi</span>
            <div>
              <Link to={url("/terms")}>{text("Общи условия", "Terms")}</Link>
              <Link to={url("/privacy")}>
                {text("Поверителност", "Privacy")}
              </Link>
              <button
                onClick={() =>
                  window.dispatchEvent(new Event("open-cookie-settings"))
                }
              >
                {text("Настройки на бисквитките", "Cookie settings")}
              </button>
            </div>
            <a
              href="https://automationaid.eu"
              target="_blank"
              rel="noopener noreferrer"
            >
              AutomationAid ↗
            </a>
          </div>
        </div>
      </footer>
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "@id": `${SITE_URL}/#organization`,
          name: COMPANY.brand,
          legalName: COMPANY.name,
          identifier: COMPANY.registrationNumber,
          url: SITE_URL,
          email: COMPANY.email,
          telephone: COMPANY.phone,
          address: {
            "@type": "PostalAddress",
            streetAddress: "Сестри Дукови 4",
            addressLocality: "Гоце Делчев",
            postalCode: "2900",
            addressCountry: "BG",
          },
          sameAs: Object.values(socialLinks),
        })}
      </script>
      <InquiryDialog
        open={inquiry}
        onOpenChange={setInquiry}
        context={inquiryContext}
      />
    </div>
  );
}

export function WaitingCTA() {
  const text = usePublicText();
  const url = usePublicLink();
  return (
    <section className="public-section public-waiting-cta">
      <div className="public-container">
        <p className="public-eyebrow">
          {text("Нещо хубаво предстои", "Something lovely is coming")}
        </p>
        <h2>
          {text(
            "Вашето котенце си заслужава чакането.",
            "Your kitten is worth waiting for.",
          )}
        </h2>
        <p>
          {text(
            "Споделете какво търсите. Ще се свържем лично с вас, когато можем да обсъдим подходящо котенце.",
            "Tell us what you are looking for. We will contact you personally when we can discuss a suitable kitten.",
          )}
        </p>
        <Link className="public-button" to={url("/waiting-list")}>
          {text("Запиши се в списъка", "Join the waiting list")}
          <ArrowRight size={18} />
        </Link>
      </div>
    </section>
  );
}

export default PublicLayout;
