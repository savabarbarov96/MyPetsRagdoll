import { useEffect, useState } from "react";
import {
  Link,
  useLocation,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useQuery } from "convex/react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  X,
  Camera,
  Heart,
  PawPrint,
} from "lucide-react";
import { api } from "../../convex/_generated/api";
import { useLanguage } from "@/hooks/useLanguage";
import type { CatData } from "@/services/convexCatService";
import { usePublicSocialLinks } from "@/hooks/usePublicContacts";
import { SITE_URL } from "@/config/site";
import {
  PublicSEO,
  PublicImage,
  PublicDataBoundary,
  WaitingCTA,
  usePublicLink,
  usePublicText,
} from "@/components/site/PublicLayout";
import InquiryDialog, {
  type InquiryContext,
} from "@/components/site/InquiryDialog";

const AUTHENTIC_BRITISH_PHOTO =
  "https://wandering-bobcat-37.convex.cloud/api/storage/2d1f6e2d-4ecb-42c3-a22e-1d45e6055786";
const AUTHENTIC_RAGDOLL_PHOTO =
  "https://wandering-bobcat-37.convex.cloud/api/storage/315a7d5f-d285-4218-8c26-f12da6c09c09";

function LoadingCards() {
  const text = usePublicText();
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setSlow(true), 15000);
    return () => window.clearTimeout(timer);
  }, []);
  return (
    <>
      <p className="public-loading-label" role="status">
        {slow
          ? text(
              "Информацията се зарежда по-бавно. Моля, проверете връзката си или опитайте отново.",
              "Loading is taking longer than usual. Please check your connection or try again.",
            )
          : text(
              "Зареждаме актуалната информация…",
              "Loading the latest information…",
            )}
      </p>
      {slow && (
        <button
          className="public-button public-button-outline"
          onClick={() => window.location.reload()}
        >
          {text("Опитайте отново", "Try again")}
        </button>
      )}
      <div
        className="public-card-grid"
        aria-busy="true"
        aria-label={text("Зареждане", "Loading")}
      >
        {[1, 2, 3].map((i) => (
          <div className="public-skeleton" key={i} />
        ))}
      </div>
    </>
  );
}
function EmptyCats() {
  const text = usePublicText();
  const url = usePublicLink();
  return (
    <div className="public-empty">
      <PawPrint size={32} />
      <h3>
        {text(
          "Очаквайте нови малки истории.",
          "More little stories are coming.",
        )}
      </h3>
      <p>
        {text(
          "В момента няма публикувани котки в тази категория. Можете да се свържете с нас или да се запишете в списъка за котенце.",
          "There are no published cats in this category right now. Contact us or join the kitten waiting list.",
        )}
      </p>
      <Link className="public-text-link" to={url("/waiting-list")}>
        {text("Към списъка за котенце", "Join the waiting list")}
        <ArrowRight size={16} />
      </Link>
    </div>
  );
}
function catContext(cat: CatData): InquiryContext {
  return { catId: cat._id, name: cat.name, url: `${SITE_URL}/cat/${cat._id}` };
}
function CatCard({
  cat,
  onReserve,
}: {
  cat: CatData;
  onReserve: (cat: CatData) => void;
}) {
  const text = usePublicText();
  const url = usePublicLink();
  return (
    <article className="public-cat-card">
      <Link className="public-cat-photo" to={url(`/cat/${cat._id}`)}>
        <PublicImage src={cat.image} alt={cat.name} />
        <span className="public-cat-status">{cat.status}</span>
        <span className="public-photo-arrow">
          <ArrowUpRight size={22} />
        </span>
      </Link>
      <div className="public-cat-info">
        <p className="public-eyebrow">
          {cat.breed === "british" ? "British" : "Ragdoll"} ·{" "}
          {cat.gender === "male"
            ? text("Мъжки", "Male")
            : text("Женска", "Female")}
        </p>
        <h3>
          <Link to={url(`/cat/${cat._id}`)}>{cat.name}</Link>
        </h3>
        <p>{cat.color}</p>
        <div className="public-card-actions">
          <Link className="public-text-link" to={url(`/cat/${cat._id}`)}>
            {text("Опознай ме", "Meet me")}
            <ArrowRight size={16} />
          </Link>
          <button
            className="public-button public-button-small"
            onClick={() => onReserve(cat)}
          >
            {text("Резервирай", "Reserve")}
          </button>
        </div>
      </div>
    </article>
  );
}
function CatDetails({ cat, reserve }: { cat: CatData; reserve: () => void }) {
  const text = usePublicText();
  const [selected, setSelected] = useState(cat.image);
  useEffect(() => setSelected(cat.image), [cat._id, cat.image]);
  const images = Array.from(
    new Set([cat.image, ...(cat.gallery || [])].filter(Boolean)),
  );
  return (
    <>
      <div className="public-cat-detail-grid">
        <div>
          <a
            className="public-detail-image"
            href={selected}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={text(
              "Отвори оригиналната снимка",
              "Open original photo",
            )}
          >
            <PublicImage
              src={selected}
              alt={cat.name}
              priority
              sizes="(max-width: 850px) 100vw, 55vw"
            />
          </a>
          {images.length > 1 && (
            <div className="public-thumbnails">
              {images.map((src, i) => (
                <button
                  key={src}
                  onClick={() => setSelected(src)}
                  aria-pressed={src === selected}
                  aria-label={`${text("Снимка", "Photo")} ${i + 1}`}
                >
                  <PublicImage
                    src={src}
                    alt={`${cat.name} — ${i + 1}`}
                    sizes="100px"
                  />
                </button>
              ))}
            </div>
          )}
          <p className="public-image-caption">
            <Camera size={14} />
            {text(
              "Изберете снимка. Кликнете върху нея за оригинала.",
              "Choose a photo. Open it to view the original.",
            )}
          </p>
        </div>
        <div className="public-cat-detail-copy">
          <p className="public-eyebrow">
            {cat.breed === "british"
              ? "British Longhair & Shorthair"
              : "Ragdoll"}
          </p>
          <h1>{cat.name}</h1>
          <p className="public-lead">{cat.subtitle}</p>
          <span className="public-status-pill">{cat.status}</span>
          <p className="public-preserve-lines">{cat.description}</p>
          <dl className="public-cat-facts">
            <div>
              <dt>{text("Пол", "Sex")}</dt>
              <dd>
                {cat.gender === "male"
                  ? text("Мъжки", "Male")
                  : text("Женска", "Female")}
              </dd>
            </div>
            <div>
              <dt>{text("Цвят", "Colour")}</dt>
              <dd>{cat.color}</dd>
            </div>
            {cat.birthDate && (
              <div>
                <dt>{text("Дата на раждане", "Date of birth")}</dt>
                <dd>{cat.birthDate}</dd>
              </div>
            )}
            {cat.age && (
              <div>
                <dt>{text("Възраст", "Age")}</dt>
                <dd>{cat.age}</dd>
              </div>
            )}
            {cat.registrationNumber && (
              <div>
                <dt>{text("Регистрационен номер", "Registration number")}</dt>
                <dd>{cat.registrationNumber}</dd>
              </div>
            )}
          </dl>
          {cat.freeText && (
            <p className="public-preserve-lines">{cat.freeText}</p>
          )}
          <button className="public-button" onClick={reserve}>
            {text("Резервирай", "Reserve")}
            <ArrowUpRight size={18} />
          </button>
          <p className="public-small-copy">
            {text(
              "Попитайте лично за наличността, родословието и документите на това коте.",
              "Ask us personally about availability, pedigree and the documents for this cat.",
            )}
          </p>
        </div>
      </div>
      <PublicParents cat={cat} />
    </>
  );
}
function PublicParents({ cat }: { cat: CatData }) {
  const parents = useQuery(api.pedigree.getPublicParents, { catId: cat._id });
  const text = usePublicText();
  if (!parents || (!parents.mother && !parents.father)) return null;
  return (
    <section className="public-parent-section" id="pedigree">
      <p className="public-eyebrow">{text("Произход", "Family")}</p>
      <h2>{text("Родителите.", "The parents.")}</h2>
      <div className="public-parent-grid">
        {(
          [
            ["mother", parents.mother],
            ["father", parents.father],
          ] as const
        ).map(
          ([role, parent]) =>
            parent && (
              <article key={role}>
                <PublicImage
                  src={parent.image}
                  alt={parent.name}
                  sizes="(max-width: 720px) 50vw, 250px"
                />
                <div>
                  <p className="public-eyebrow">
                    {role === "mother"
                      ? text("Майка", "Mother")
                      : text("Баща", "Father")}
                  </p>
                  <h3>{parent.name}</h3>
                  <p>{parent.color}</p>
                  {parent.registrationNumber && (
                    <p>
                      {text("Регистрация", "Registration")}:{" "}
                      {parent.registrationNumber}
                    </p>
                  )}
                </div>
              </article>
            ),
        )}
      </div>
    </section>
  );
}

function CatCatalog({
  breed,
  grouped = true,
  limit,
}: {
  breed?: "ragdoll" | "british";
  grouped?: boolean;
  limit?: number;
}) {
  const cats = useQuery(api.cats.getDisplayedCats);
  const text = usePublicText();
  const [params, setParams] = useSearchParams();
  const [inquiryCat, setInquiryCat] = useState<CatData | null>(null);
  const [detailCat, setDetailCat] = useState<CatData | null>(null);
  const catID = params.get("cat");
  const modal = params.get("modal");
  useEffect(() => {
    if (!cats || !catID) return;
    const cat = cats.find((c) => c._id === catID && c.isDisplayed);
    if (!cat) return;
    if (modal === "contact") setInquiryCat(cat);
    else if (modal === "gallery" || modal === "pedigree") setDetailCat(cat);
  }, [cats, catID, modal, breed]);
  const clearParams = () => {
    const updated = new URLSearchParams(params);
    updated.delete("cat");
    updated.delete("modal");
    setParams(updated, { replace: true });
  };
  if (cats === undefined) return <LoadingCards />;
  const published = cats.filter(
    (c) => c.isDisplayed && (!breed || (c.breed || "ragdoll") === breed),
  );
  const sections = grouped
    ? [
        {
          id: "males",
          title: text("Нашите мъжки", "Our males"),
          list: published.filter(
            (c) => c.gender === "male" && c.category !== "kitten",
          ),
        },
        {
          id: "females",
          title: text("Нашите женски", "Our females"),
          list: published.filter(
            (c) => c.gender === "female" && c.category !== "kitten",
          ),
        },
        {
          id: "kittens",
          title: text("Малките ни съкровища", "Our little treasures"),
          list: published.filter((c) => c.category === "kitten"),
        },
      ]
    : [
        {
          id: "featured-cats",
          title: "",
          list: limit ? published.slice(0, limit) : published,
        },
      ];
  return (
    <>
      {published.length === 0 ? (
        <EmptyCats />
      ) : (
        sections.map((section) => (
          <section
            className="public-cat-group"
            id={section.id}
            key={section.id}
          >
            {section.title && (
              <div className="public-group-heading">
                <h3>{section.title}</h3>
                <span>{section.list.length.toString().padStart(2, "0")}</span>
              </div>
            )}
            {section.list.length ? (
              <div className="public-card-grid">
                {section.list.map((cat) => (
                  <CatCard cat={cat} key={cat._id} onReserve={setInquiryCat} />
                ))}
              </div>
            ) : (
              <p className="public-empty-small">
                {text(
                  "В момента няма публикувани котки в тази категория.",
                  "No cats are currently published in this category.",
                )}
              </p>
            )}
          </section>
        ))
      )}
      <InquiryDialog
        open={!!inquiryCat}
        onOpenChange={(open) => {
          if (!open) {
            setInquiryCat(null);
            clearParams();
          }
        }}
        context={inquiryCat ? catContext(inquiryCat) : undefined}
      />
      <Dialog.Root
        open={!!detailCat}
        onOpenChange={(open) => {
          if (!open) {
            setDetailCat(null);
            clearParams();
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="public-dialog-overlay" />
          <Dialog.Content className="public-cat-dialog public-site">
            <Dialog.Close
              className="public-dialog-close"
              aria-label={text("Затвори", "Close")}
            >
              <X />
            </Dialog.Close>
            <Dialog.Title className="sr-only">{detailCat?.name}</Dialog.Title>
            <Dialog.Description className="sr-only">
              {text("Профил и снимки на котката", "Cat profile and photos")}
            </Dialog.Description>
            {detailCat && (
              <CatDetails
                cat={detailCat}
                reserve={() => {
                  setDetailCat(null);
                  setInquiryCat(detailCat);
                }}
              />
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
function PhotoGallery() {
  const gallery = useQuery(api.gallery.getPublishedGalleryItems, {
    category: "photo",
  });
  const text = usePublicText();
  if (gallery === undefined) return <LoadingCards />;
  if (!gallery.length)
    return (
      <p>
        {text(
          "Скоро тук ще споделим още снимки от нашия развъдник.",
          "More photos from our cattery will be shared here soon.",
        )}
      </p>
    );
  return (
    <div className="public-gallery-grid">
      {gallery.map((item) => (
        <a
          key={item._id}
          href={item.imageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="public-gallery-photo"
        >
          <PublicImage src={item.imageUrl} alt={item.title} />
          <span>
            {item.title}
            <ArrowUpRight size={18} />
          </span>
        </a>
      ))}
    </div>
  );
}
function NewsCards({ limit }: { limit?: number }) {
  const news = useQuery(api.announcements.getPublishedAnnouncements);
  const text = usePublicText();
  const url = usePublicLink();
  const { language } = useLanguage();
  const [page, setPage] = useState(1);
  if (news === undefined) return <LoadingCards />;
  if (!news.length)
    return (
      <div className="public-empty">
        <h3>
          {text(
            "Нашите истории тепърва предстоят.",
            "Our next stories are coming soon.",
          )}
        </h3>
        <p>
          {text(
            "Когато има публикувани новини, ще ги откриете тук.",
            "Published news will appear here.",
          )}
        </p>
      </div>
    );
  const visible = limit
    ? news.slice(0, limit)
    : news.slice((page - 1) * 9, page * 9);
  const pages = Math.ceil(news.length / 9);
  return (
    <>
      <div className="public-news-grid">
        {visible.map((article) => (
          <article className="public-news-card" key={article._id}>
            <Link
              className="public-news-image"
              to={url(`/news/${article.slug || article._id}`)}
            >
              <PublicImage src={article.featuredImage} alt={article.title} />
            </Link>
            <div>
              <time dateTime={new Date(article.publishedAt).toISOString()}>
                {new Date(article.publishedAt).toLocaleDateString(
                  language === "en" ? "en-GB" : "bg-BG",
                  { day: "numeric", month: "long", year: "numeric" },
                )}
              </time>
              <h3>
                <Link to={url(`/news/${article.slug || article._id}`)}>
                  {article.title}
                </Link>
              </h3>
              <p>
                {article.metaDescription ||
                  article.content.replace(/<[^>]*>/g, "").slice(0, 135)}
              </p>
              <Link
                className="public-text-link"
                to={url(`/news/${article.slug || article._id}`)}
              >
                {text("Прочетете историята", "Read the story")}
                <ArrowRight size={16} />
              </Link>
            </div>
          </article>
        ))}
      </div>
      {!limit && pages > 1 && (
        <nav
          className="public-pagination"
          aria-label={text("Страници с новини", "News pages")}
        >
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            aria-label={text("Предишна страница", "Previous page")}
          >
            <ChevronLeft />
          </button>
          <span>
            {page} / {pages}
          </span>
          <button
            disabled={page === pages}
            onClick={() => setPage(page + 1)}
            aria-label={text("Следваща страница", "Next page")}
          >
            <ChevronRight />
          </button>
        </nav>
      )}
    </>
  );
}
function FAQ() {
  const text = usePublicText();
  const url = usePublicLink();
  const questions = [
    [
      text("Как да попитам за котенце?", "How can I inquire about a kitten?"),
      text(
        "Разгледайте публикуваните котки и изберете „Резервирай“. Можете да ни пишете в WhatsApp, по имейл или да се обадите. Ще обсъдим лично наличността и следващите стъпки.",
        "Browse our published cats and choose “Reserve”. Contact us through WhatsApp, email or phone. We will discuss availability and next steps personally.",
      ),
    ],
    [
      text(
        "Какво става, ако няма подходящо котенце?",
        "What if a suitable kitten is not available?",
      ),
      text(
        "Запишете се в списъка за котенце с имейл или телефон. По желание добавете предпочитания. Данните се използват за личен контакт с ваше изрично съгласие.",
        "Join the kitten waiting list with an email address or phone number and optional preferences. Your details are used for a personal follow-up with your explicit permission.",
      ),
    ],
    [
      text(
        "Какви документи мога да обсъдя с вас?",
        "Which documents can I ask about?",
      ),
      text(
        "Попитайте за родословието, паспорта, ваксинационния запис и наличните здравни документи на конкретното коте. На страницата „Доверие и документи“ можете да разгледате предоставените регистрации.",
        "Ask about the pedigree, passport, vaccination record and available health documents of the specific kitten. Our “Trust & documents” page shows the supplied registrations.",
      ),
    ],
    [
      text(
        "Записването в списъка резервация ли е?",
        "Does joining the list reserve a kitten?",
      ),
      text(
        "Не. То е заявка за личен контакт. Наличността, условията и всяка конкретна резервация се уточняват с развъдника.",
        "No. It is a request for personal contact. Availability, terms and any reservation are agreed directly with the cattery.",
      ),
    ],
  ];
  return (
    <section id="faq" className="public-section public-faq-section">
      <div className="public-container public-faq-layout">
        <div>
          <p className="public-eyebrow">
            {text("С грижа за всеки въпрос", "Every question matters")}
          </p>
          <h2>{text("Нека се опознаем.", "Let’s get to know each other.")}</h2>
          <p>
            {text(
              "Първата стъпка към вашето котенце е един добър разговор.",
              "The first step towards your kitten is a thoughtful conversation.",
            )}
          </p>
          <Link className="public-text-link" to={url("/contact")}>
            {text("Попитайте ни лично", "Ask us personally")}
            <ArrowRight size={17} />
          </Link>
        </div>
        <div className="public-faq">
          {questions.map(([q, a]) => (
            <details key={q}>
              <summary>
                {q}
                <ChevronRight size={19} />
              </summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
function HomeContent() {
  const socialLinks = usePublicSocialLinks();
  const text = usePublicText();
  const url = usePublicLink();
  const cats = useQuery(api.cats.getDisplayedCats);
  const hero = cats?.find((c) => c.isDisplayed && c.image);
  const [reserve, setReserve] = useState(false);
  return (
    <>
      <PublicSEO
        title={text(
          "Ragdoll и British котки в България",
          "Ragdoll & British cats in Bulgaria",
        )}
        description={text(
          "Опознайте котките на BleuRoi в Гоце Делчев. Разгледайте снимки, попитайте за резервация или се запишете за лично обаждане за котенце.",
          "Meet BleuRoi cats in Gotse Delchev, Bulgaria. Browse photos, inquire about a reservation or join our kitten waiting list.",
        )}
        image={hero?.image}
      />
      <section className="public-home-hero" id="home">
        <div className="public-container public-hero-grid">
          <div className="public-hero-copy">
            <p className="public-eyebrow">
              BLEUROI · RAGDOLL & BRITISH CATTERY
            </p>
            <h1>
              {text("Малки лапички.", "Little paws.")}
              <em>{text("Голяма любов.", "So much love.")}</em>
            </h1>
            <p>
              {text(
                "Добре дошли в света на BleuRoi. Опознайте нашите котки и намерете място за една нова, нежна история в дома си.",
                "Welcome to the world of BleuRoi. Meet our cats and make room for a new, gentle story in your home.",
              )}
            </p>
            <div className="public-hero-actions">
              <Link className="public-button" to={url("/#kittens")}>
                {text("Разгледайте котенцата", "Meet our kittens")}
                <ArrowRight size={18} />
              </Link>
              <button
                className="public-text-link"
                onClick={() => setReserve(true)}
              >
                {text("Нека поговорим", "Let’s talk")}
                <ArrowUpRight size={17} />
              </button>
            </div>
            <div className="public-hero-location">
              <span />
              {text("Гоце Делчев, България", "Gotse Delchev, Bulgaria")}
            </div>
          </div>
          <div className="public-hero-photo">
            <PublicImage
              src={hero?.image || AUTHENTIC_RAGDOLL_PHOTO}
              alt={hero?.name || "BleuRoi Ragdoll & British"}
              priority
              sizes="(max-width: 850px) 100vw, 50vw"
            />
            <div className="public-photo-caption">
              <span>{hero?.name || "BleuRoi"}</span>
              <small>
                {text(
                  "Една история започва с поглед.",
                  "A story begins with a look.",
                )}
              </small>
            </div>
            <div className="public-hero-stamp">
              <Heart size={20} />
              {text("С любов", "With love")}
              <small>BLEUROI</small>
            </div>
          </div>
        </div>
      </section>
      <section className="public-intro-strip">
        <div className="public-container">
          <p>
            {text(
              "Две породи. Безброй причини да се влюбите.",
              "Two breeds. So many reasons to fall in love.",
            )}
          </p>
          <Link to={url("/#models")}>
            Ragdoll
            <ArrowUpRight size={17} />
          </Link>
          <Link to={url("/british")}>
            British Longhair & Shorthair
            <ArrowUpRight size={17} />
          </Link>
        </div>
      </section>
      <section className="public-section" id="models">
        <div className="public-container">
          <div className="public-section-heading">
            <div>
              <p className="public-eyebrow">
                {text("Запознайте се с нас", "Meet the family")}
              </p>
              <h2>{text("Нашите Ragdoll котки.", "Our Ragdoll cats.")}</h2>
            </div>
            <Link className="public-text-link" to={url("/all-cats")}>
              {text("Всички котки", "All cats")}
              <ArrowRight size={17} />
            </Link>
          </div>
          <CatCatalog breed="ragdoll" />
        </div>
      </section>
      <section className="public-story-section public-section">
        <div className="public-container public-story-grid">
          <div className="public-story-art">
            <PublicImage
              src={
                cats?.find(
                  (c) => c.isDisplayed && c.image && c._id !== hero?._id,
                )?.image ||
                hero?.image ||
                AUTHENTIC_RAGDOLL_PHOTO
              }
              alt={text("Котка от BleuRoi", "A BleuRoi cat")}
              sizes="(max-width: 850px) 100vw, 45vw"
            />
          </div>
          <div>
            <p className="public-eyebrow">
              {text("Хората зад BleuRoi", "The people behind BleuRoi")}
            </p>
            <h2>
              {text("Повече от красиви котки.", "More than beautiful cats.")}
            </h2>
            <p>
              {text(
                "Ние сме BleuRoi — развъдник за Ragdoll и British котки в Гоце Делчев. Вярваме, че изборът на котенце започва с доверие, ясна информация и личен разговор.",
                "We are BleuRoi, a Ragdoll and British cattery in Gotse Delchev. Choosing a kitten begins with trust, clear information and a personal conversation.",
              )}
            </p>
            <div className="public-story-links">
              <Link className="public-text-link" to={url("/about")}>
                {text("Нашата история", "Our story")}
                <ArrowRight size={17} />
              </Link>
              <Link className="public-text-link" to={url("/trust")}>
                {text("Регистрации и документи", "Registrations & documents")}
                <ArrowRight size={17} />
              </Link>
            </div>
          </div>
        </div>
      </section>
      <FAQ />
      <section className="public-section" id="news">
        <div className="public-container">
          <div className="public-section-heading">
            <div>
              <p className="public-eyebrow">
                {text("От нашия свят", "From our world")}
              </p>
              <h2>{text("Моменти и истории.", "Moments & stories.")}</h2>
            </div>
            <Link className="public-text-link" to={url("/news")}>
              {text("Всички новини", "All news")}
              <ArrowRight size={17} />
            </Link>
          </div>
          <NewsCards limit={3} />
        </div>
      </section>
      <section className="public-section public-gallery-section" id="gallery">
        <div className="public-container">
          <p className="public-eyebrow">
            {text("Дневник в снимки", "A photo diary")}
          </p>
          <h2>{text("Животът с BleuRoi.", "Life with BleuRoi.")}</h2>
          <PhotoGallery />
          <div id="tiktok" className="public-social-callout">
            <span>
              {text(
                "Още малки моменти в социалните ни мрежи.",
                "More little moments on our social pages.",
              )}
            </span>
            <a
              className="public-text-link"
              href={socialLinks.tiktok}
              target="_blank"
              rel="noopener noreferrer"
            >
              TikTok
              <ArrowUpRight size={17} />
            </a>
          </div>
        </div>
      </section>
      <WaitingCTA />
      <InquiryDialog open={reserve} onOpenChange={setReserve} />
    </>
  );
}
export function HomePage() {
  return (
    <>
      <PublicDataBoundary>
        <HomeContent />
      </PublicDataBoundary>
    </>
  );
}
function BreedContent() {
  const text = usePublicText();
  const cats = useQuery(api.cats.getDisplayedCats);
  const hero = cats?.find(
    (c) => c.breed === "british" && c.isDisplayed && c.image,
  );
  const url = usePublicLink();
  return (
    <>
      <PublicSEO
        title="British Longhair & Shorthair"
        description={text(
          "Запознайте се с British котките на BleuRoi. Снимки, индивидуални профили и личен контакт за резервация.",
          "Meet BleuRoi British cats. Photos, individual profiles and personal reservation inquiries.",
        )}
        image={hero?.image}
      />
      <section className="public-page-hero public-breed-hero" id="home">
        <div className="public-container public-hero-grid">
          <div>
            <p className="public-eyebrow">BLEUROI · BRITISH</p>
            <h1>
              British<em>Longhair & Shorthair.</em>
            </h1>
            <p className="public-lead">
              {text(
                "Характер, който очарова. Присъствие, което се помни.",
                "An enchanting character. An unforgettable presence.",
              )}
            </p>
            <Link className="public-button" to={url("/british#models")}>
              {text("Опознайте нашите котки", "Meet our cats")}
              <ArrowRight size={18} />
            </Link>
          </div>
          <div className="public-breed-image">
            <PublicImage
              src={hero?.image || AUTHENTIC_BRITISH_PHOTO}
              alt={hero?.name || "BleuRoi British"}
              priority
              sizes="(max-width: 850px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>
      <section className="public-section" id="models">
        <div className="public-container">
          <p className="public-eyebrow">
            {text("Нашето British семейство", "Our British family")}
          </p>
          <h2>{text("Запознайте се отблизо.", "Meet them up close.")}</h2>
          <CatCatalog breed="british" />
        </div>
      </section>
      <FAQ />
      <WaitingCTA />
    </>
  );
}
export function BritishPage() {
  return (
    <>
      <PublicDataBoundary>
        <BreedContent />
      </PublicDataBoundary>
    </>
  );
}
export function AllCatsPage() {
  const text = usePublicText();
  const [filter, setFilter] = useState<"all" | "ragdoll" | "british">("all");
  return (
    <>
      <PublicSEO
        title={text("Всички наши котки", "All our cats")}
        description={text(
          "Разгледайте публикуваните Ragdoll и British котки на BleuRoi и попитайте лично за резервация.",
          "Browse BleuRoi’s published Ragdoll and British cats and inquire personally about a reservation.",
        )}
      />
      <section className="public-page-hero public-container">
        <p className="public-eyebrow">
          {text("Семейството на BleuRoi", "The BleuRoi family")}
        </p>
        <h1>{text("Толкова много чар.", "So much charm.")}</h1>
        <p className="public-lead">
          {text(
            "Всяко коте има своя история. Открийте тази, която ви докосва.",
            "Every cat has a story. Discover the one that speaks to you.",
          )}
        </p>
      </section>
      <section className="public-section public-container">
        <div
          className="public-filter-row"
          aria-label={text("Филтър по порода", "Filter by breed")}
        >
          {(["all", "ragdoll", "british"] as const).map((value) => (
            <button
              key={value}
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
            >
              {value === "all"
                ? text("Всички", "All")
                : value === "ragdoll"
                  ? "Ragdoll"
                  : "British"}
            </button>
          ))}
        </div>
        <span id="ragdoll-models" />
        <span id="british-models" />
        <PublicDataBoundary>
          <CatCatalog breed={filter === "all" ? undefined : filter} />
        </PublicDataBoundary>
      </section>
      <WaitingCTA />
    </>
  );
}
export function AboutPage() {
  const text = usePublicText();
  const url = usePublicLink();
  return (
    <>
      <PublicSEO
        title={text("За BleuRoi", "About BleuRoi")}
        description={text(
          "Запознайте се с BleuRoi — развъдник за Ragdoll и British котки в Гоце Делчев. Личен контакт, снимки и предоставени регистрации.",
          "Meet BleuRoi, a Ragdoll and British cattery in Gotse Delchev. Personal contact, photos and supplied registrations.",
        )}
      />
      <section className="public-page-hero public-container">
        <p className="public-eyebrow">
          {text("Добре дошли в BleuRoi", "Welcome to BleuRoi")}
        </p>
        <h1>
          {text("Място за котки.", "A place for cats.")}
          <em>
            {text(
              "И за хората, които ги обичат.",
              "And the people who love them.",
            )}
          </em>
        </h1>
        <p className="public-lead">
          {text(
            "Нашият развъдник е в Гоце Делчев, България. Тук можете да опознаете нашите Ragdoll и British котки и да разговаряте лично с нас.",
            "Our cattery is in Gotse Delchev, Bulgaria. Here you can meet our Ragdoll and British cats and speak with us personally.",
          )}
        </p>
      </section>
      <section className="public-section public-story-section">
        <div className="public-container public-about-values">
          <article>
            <PawPrint size={25} />
            <h2>{text("Нашите котки", "Our cats")}</h2>
            <p>
              {text(
                "Индивидуални профили, снимки и информация, публикувана от развъдника. Разгледайте всяка котка и попитайте за нея.",
                "Individual profiles, photos and information published by the cattery. Explore each cat and ask about them.",
              )}
            </p>
            <Link className="public-text-link" to={url("/all-cats")}>
              {text("Запознайте се с тях", "Meet them")}
              <ArrowRight size={16} />
            </Link>
          </article>
          <article>
            <Heart size={25} />
            <h2>{text("Доверие и яснота", "Trust and clarity")}</h2>
            <p>
              {text(
                "Предоставените регистрации и оригинални документи са достъпни за разглеждане. Условията и документите на конкретното коте се уточняват лично.",
                "Supplied registrations and original documents are available to view. Terms and documents for each kitten are discussed personally.",
              )}
            </p>
            <Link className="public-text-link" to={url("/trust")}>
              {text("Разгледайте документите", "View the documents")}
              <ArrowRight size={16} />
            </Link>
          </article>
          <article>
            <Camera size={25} />
            <h2>{text("Животът отблизо", "Life up close")}</h2>
            <p>
              {text(
                "Снимки, новини и моменти от света на BleuRoi. Следете публикуваните истории или ни открийте в социалните мрежи.",
                "Photos, news and moments from the world of BleuRoi. Follow our published stories or find us on social media.",
              )}
            </p>
            <Link className="public-text-link" to={url("/news")}>
              {text("Нашите истории", "Our stories")}
              <ArrowRight size={16} />
            </Link>
          </article>
        </div>
      </section>
      <section className="public-section public-container" id="gallery">
        <p className="public-eyebrow">
          {text("Нашият свят в снимки", "Our world in photos")}
        </p>
        <h2>
          {text(
            "Малките моменти са всичко.",
            "The little moments mean everything.",
          )}
        </h2>
        <PublicDataBoundary>
          <PhotoGallery />
        </PublicDataBoundary>
      </section>
      <WaitingCTA />
    </>
  );
}
export function NewsPage() {
  const text = usePublicText();
  return (
    <>
      <PublicSEO
        title={text("Новини и истории", "News & stories")}
        description={text(
          "Публикувани новини, снимки и истории от BleuRoi Ragdoll & British Cattery.",
          "Published news, photos and stories from BleuRoi Ragdoll & British Cattery.",
        )}
      />
      <section className="public-page-hero public-container">
        <p className="public-eyebrow">
          {text("От света на BleuRoi", "From the world of BleuRoi")}
        </p>
        <h1>{text("Истории с меки лапички.", "Stories with soft paws.")}</h1>
        <p className="public-lead">
          {text(
            "Нашите новини, специални моменти и малки поводи за усмивка.",
            "Our news, special moments and little reasons to smile.",
          )}
        </p>
      </section>
      <section className="public-section public-container">
        <PublicDataBoundary>
          <NewsCards />
        </PublicDataBoundary>
      </section>
      <WaitingCTA />
    </>
  );
}
function ArticleContent() {
  const { slug = "" } = useParams();
  const article = useQuery(api.announcements.getAnnouncementBySlug, { slug });
  const text = usePublicText();
  const url = usePublicLink();
  const { language } = useLanguage();
  const [inquiry, setInquiry] = useState(false);
  const [copied, setCopied] = useState(false);
  const location = useLocation();
  if (article === undefined)
    return (
      <section className="public-section public-container">
        <LoadingCards />
      </section>
    );
  if (!article || !article.isPublished) return <MissingContent />;
  const description =
    article.metaDescription ||
    article.content.replace(/<[^>]*>/g, "").slice(0, 155);
  return (
    <>
      <PublicSEO
        title={article.title}
        description={description}
        image={article.featuredImage}
        article
      />
      <article className="public-article public-container">
        <Link className="public-text-link" to={url("/news")}>
          <ChevronLeft size={17} />
          {text("Към всички истории", "All stories")}
        </Link>
        <header>
          <p className="public-eyebrow">BLEUROI · {text("Новини", "News")}</p>
          <h1>{article.title}</h1>
          <time dateTime={new Date(article.publishedAt).toISOString()}>
            {new Date(article.publishedAt).toLocaleDateString(
              language === "en" ? "en-GB" : "bg-BG",
              { day: "numeric", month: "long", year: "numeric" },
            )}
          </time>
        </header>
        {article.featuredImage && (
          <PublicImage
            className="public-article-hero"
            src={article.featuredImage}
            alt={article.title}
            priority
            sizes="(max-width: 1000px) 100vw, 1000px"
          />
        )}
        <div className="public-article-content public-preserve-lines">
          {article.content}
        </div>
        {article.gallery?.length > 0 && (
          <div className="public-gallery-grid">
            {article.gallery.map((src, i) => (
              <a
                key={`${src}-${i}`}
                href={src}
                target="_blank"
                rel="noopener noreferrer"
              >
                <PublicImage src={src} alt={`${article.title} — ${i + 1}`} />
              </a>
            ))}
          </div>
        )}
        <div className="public-article-actions">
          <button className="public-button" onClick={() => setInquiry(true)}>
            {text("Попитайте за тази история", "Ask about this story")}
            <ArrowUpRight size={17} />
          </button>
          <button
            className="public-text-link"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(
                  `${SITE_URL}${location.pathname}`,
                );
                setCopied(true);
              } catch {
                setCopied(false);
              }
            }}
          >
            {copied
              ? text("Линкът е копиран", "Link copied")
              : text("Копирайте линк", "Copy link")}
          </button>
        </div>
      </article>
      <section className="public-section public-story-section">
        <div className="public-container">
          <h2>{text("Още от нашия свят.", "More from our world.")}</h2>
          <NewsCards limit={3} />
        </div>
      </section>
      <InquiryDialog
        open={inquiry}
        onOpenChange={setInquiry}
        context={{
          name: article.title,
          url: `${SITE_URL}/news/${article.slug || slug}`,
        }}
      />
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: article.title,
          description,
          datePublished: new Date(article.publishedAt).toISOString(),
          dateModified: new Date(article.updatedAt).toISOString(),
          author: { "@type": "Organization", name: "BleuRoi" },
          publisher: { "@type": "Organization", name: "BleuRoi" },
          ...(article.featuredImage ? { image: article.featuredImage } : {}),
        })}
      </script>
    </>
  );
}
export function NewsArticlePage() {
  return (
    <>
      <PublicDataBoundary>
        <ArticleContent />
      </PublicDataBoundary>
    </>
  );
}
function MissingContent() {
  const text = usePublicText();
  const url = usePublicLink();
  return (
    <section className="public-section public-container public-missing">
      <PublicSEO
        title={text("Страницата не е намерена", "Page not found")}
        description={text(
          "Тази страница не е налична.",
          "This page is unavailable.",
        )}
        noindex
      />
      <p className="public-eyebrow">BLEUROI · 404</p>
      <h1>{text("Тази следа не води никъде.", "This trail leads nowhere.")}</h1>
      <p>
        {text(
          "Страницата не е намерена или вече не е публикувана.",
          "The page was not found or is no longer published.",
        )}
      </p>
      <Link className="public-button" to={url("/")}>
        {text("Към началото", "Back home")}
        <ArrowRight size={18} />
      </Link>
    </section>
  );
}
function CatContent() {
  const { catId = "" } = useParams();
  const cats = useQuery(api.cats.getDisplayedCats);
  const text = usePublicText();
  const url = usePublicLink();
  const [inquiry, setInquiry] = useState(false);
  if (cats === undefined)
    return (
      <section className="public-section public-container">
        <LoadingCards />
      </section>
    );
  const cat = /^[a-z0-9]{16,64}$/.test(catId)
    ? cats.find((c) => c._id === catId && c.isDisplayed)
    : undefined;
  if (!cat) return <MissingContent />;
  return (
    <>
      <PublicSEO
        title={cat.name}
        description={cat.description.slice(0, 155)}
        image={cat.image}
      />
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: cat.name,
          description: cat.description,
          url: `${SITE_URL}/cat/${cat._id}`,
          about: { "@type": "Thing", name: cat.name, image: cat.image },
          isPartOf: { "@type": "WebSite", name: "BleuRoi", url: SITE_URL },
        })}
      </script>
      <section className="public-section public-container">
        <Link
          className="public-text-link public-back-link"
          to={url("/all-cats")}
        >
          <ChevronLeft size={17} />
          {text("Към всички котки", "All cats")}
        </Link>
        <CatDetails cat={cat} reserve={() => setInquiry(true)} />
      </section>
      <WaitingCTA />
      <InquiryDialog
        open={inquiry}
        onOpenChange={setInquiry}
        context={catContext(cat)}
      />
    </>
  );
}
export function CatPage() {
  return (
    <>
      <PublicDataBoundary>
        <CatContent />
      </PublicDataBoundary>
    </>
  );
}
export function PublicNotFoundPage() {
  return (
    <>
      <MissingContent />
    </>
  );
}
