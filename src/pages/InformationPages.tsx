import { useState, type FormEvent, type ReactNode } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import { CheckCircle2, FileText, Mail, MapPin, MessageCircle, Phone, ShieldCheck } from 'lucide-react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { useLanguage } from '@/hooks/useLanguage';
import { useConsent } from '@/components/privacy/ConsentProvider';
import { PublicImage } from '@/components/site/PublicLayout';
import { usePublicSocialLinks, usePublicLocation } from '@/hooks/usePublicContacts';
import { COMPANY, SITE_URL } from '@/config/site';
import { normalizeEmail, normalizePhone } from '../../convex/lib/waitingValidation';
import '@/styles/information.css';

const fieldClass = 'w-full rounded-xl border border-[#5A4336]/25 bg-[#FAF6F0] px-4 py-3 text-[#5A4336] placeholder:text-[#5A4336]/60 focus:outline-none focus:ring-2 focus:ring-[#5A4336]';
const actionClass = 'inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#C08A5B] px-6 py-3 font-semibold text-[#34251d] transition hover:bg-[#b97e4d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#5A4336] disabled:cursor-wait disabled:opacity-60';
const outlineClass = 'inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#5A4336]/30 px-6 py-3 font-semibold text-[#5A4336] transition hover:bg-[#EADFD0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#5A4336]';
const linkClass = 'underline underline-offset-4 hover:decoration-2';

function InformationPage({ title, description, path, draft = false, children }: { title: string; description: string; path: string; draft?: boolean; children: ReactNode }) {
  const { language } = useLanguage();
  const url = `${SITE_URL}${path}${language === 'en' ? '?lang=en' : ''}`;
  return <>
    <Helmet><title>{title} | BleuRoi</title><meta name="description" content={description} /><link rel="canonical" href={url} /><link rel="alternate" hrefLang="bg" href={`${SITE_URL}${path}`} /><link rel="alternate" hrefLang="en" href={`${SITE_URL}${path}?lang=en`} /><link rel="alternate" hrefLang="x-default" href={`${SITE_URL}${path}`} />{draft && <meta name="robots" content="noindex,follow" />}<meta property="og:title" content={`${title} | BleuRoi`} /><meta property="og:description" content={description} /><meta property="og:url" content={url} /></Helmet>
    <div className={`information-page ${draft ? 'information-legal' : ''} bg-[#FAF6F0] text-[#5A4336]`}>
      <section className="border-b border-[#5A4336]/15 bg-[#EADFD0]/60 px-5 py-14 sm:px-8 sm:py-20"><div className="mx-auto max-w-6xl"><p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em]">BleuRoi · Ragdoll & British</p><h1 className="max-w-4xl font-playfair text-4xl leading-tight sm:text-5xl lg:text-6xl">{title}</h1><p className="mt-5 max-w-2xl text-lg leading-relaxed">{description}</p></div></section>
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">{children}</div>
    </div>
  </>;
}

function DraftNotice() {
  const { language } = useLanguage();
  return <aside className="mb-8 rounded-2xl border border-[#5A4336]/25 bg-[#EADFD0] p-5" role="note"><strong>{language === 'en' ? 'Development draft — not final legal terms' : 'Работен проект — не е окончателен правен текст'}</strong><p className="mt-2 leading-relaxed">{language === 'en' ? 'Company details are confirmed. Retention periods, service-provider arrangements and the reservation contract policies still require confirmation before this document can be published as final.' : 'Фирмените данни са потвърдени. Сроковете за съхранение, отношенията с доставчиците и договорните условия за резервация трябва да бъдат потвърдени преди окончателното публикуване.'}</p></aside>;
}

function useInquiryContext() {
  const [params] = useSearchParams();
  const catId = params.get('catId') || params.get('cat');
  const label = (params.get('label') || params.get('name') || params.get('context') || '').slice(0, 160);
  const source = params.get('source') || params.get('contextUrl');
  let url = '/contact';
  if (catId) url = `/cat/${encodeURIComponent(catId)}`;
  else if (source) {
    try { const parsed = new URL(source, SITE_URL); if (parsed.origin === new URL(SITE_URL).origin) url = parsed.pathname; } catch { /* Ignore invalid context URLs. */ }
  }
  return catId || label || source ? { ...(catId ? { catId: catId as Id<'cats'> } : {}), ...(label ? { label } : {}), url } : undefined;
}

export function TrustPage() {
  const { language } = useLanguage();
  const en = language === 'en';
  const certificates = useQuery(api.gallery.getPublishedGalleryItems, { category: 'certificate' });
  const topics = en ? [
    ['Cattery-name registration', 'A registration document establishes the name or entry described by its issuer. It does not by itself establish a business licence, current club membership or health results.'],
    ['Pedigree', 'Pedigree records describe ancestry and their issuing registry. Ask which document applies to the individual kitten before making a reservation.'],
    ['Passport and vaccination record', 'Veterinary records identify the animal and record the procedures actually performed. Requirements for travel depend on the destination and should be checked for each journey.'],
    ['Health documentation', 'Discuss the available veterinary and test documents for the kitten and its parents. No unspecified genetic results or health guarantees are asserted on this page.'],
  ] : [
    ['Регистрация на име на развъдник', 'Регистрационният документ удостоверява името или вписването, описано от издателя. Сам по себе си той не удостоверява бизнес лиценз, текущо клубно членство или здравни резултати.'],
    ['Родословие', 'Родословието описва произхода и организацията, която го е издала. Преди резервация уточнете кой документ се отнася до конкретното котенце.'],
    ['Паспорт и ваксинационен запис', 'Ветеринарните документи идентифицират животното и отразяват реално извършените процедури. Изискванията за пътуване зависят от дестинацията и се уточняват за всяко пътуване.'],
    ['Здравни документи', 'Обсъдете наличните ветеринарни документи и изследвания за котенцето и родителите. Тази страница не заявява непотвърдени генетични резултати или здравни гаранции.'],
  ];
  return <InformationPage path="/trust" title={en ? 'Trust begins with clear information' : 'Доверието започва с ясна информация'} description={en ? 'Meet the company behind BleuRoi and understand the documents to discuss before a reservation.' : 'Запознайте се с фирмата зад BleuRoi и документите, които да обсъдите преди резервация.'}>
    <section className="grid gap-8 lg:grid-cols-[1.2fr_1fr]"><div><ShieldCheck className="mb-4 h-9 w-9" /><h2 className="font-playfair text-3xl">{en ? 'A conversation before a commitment' : 'Разговор преди решение'}</h2><p className="mt-4 text-lg leading-relaxed">{en ? 'Every inquiry starts with the kitten and your questions. Request current details about availability, care, documents and the individual reservation conditions.' : 'Всяко запитване започва с котенцето и Вашите въпроси. Поискайте актуална информация за наличността, грижите, документите и конкретните условия за резервация.'}</p><Link to={`/contact${en ? '?lang=en' : ''}`} className={`${actionClass} mt-6`}>{en ? 'Talk to us' : 'Свържете се с нас'}</Link></div><CompanyDetails /></section>
    <section className="mt-14 grid gap-5 md:grid-cols-2" aria-label={en ? 'Understanding documents' : 'Информация за документите'}>{topics.map(([title, body]) => <article key={title} className="rounded-2xl border border-[#5A4336]/15 bg-white/40 p-6"><FileText className="mb-4 h-6 w-6" /><h2 className="font-playfair text-2xl">{title}</h2><p className="mt-3 leading-relaxed">{body}</p></article>)}</section>
    <section className="mt-14"><h2 className="font-playfair text-3xl">{en ? 'Published documents' : 'Публикувани документи'}</h2><p className="mt-3 max-w-3xl leading-relaxed">{en ? 'Documents are shown as supplied. Open the full image to read the issuer, registration type and date; no text, seals or signatures are rewritten.' : 'Документите се показват във вида, в който са предоставени. Отворете пълното изображение, за да прочетете издателя, вида на регистрацията и датата; текст, печати и подписи не се променят.'}</p>
      {certificates === undefined ? <p className="mt-5" role="status">{en ? 'Loading documents…' : 'Зареждане на документите…'}</p> : certificates.length ? <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{certificates.map((item) => <article key={item._id} className="overflow-hidden rounded-2xl border border-[#5A4336]/20 bg-white/50"><a href={item.imageUrl} target="_blank" rel="noopener noreferrer" className="block p-4"><PublicImage src={item.imageUrl} alt={item.title} width={600} height={450} sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw" className="h-64 w-full object-contain" /></a><div className="p-5"><h3 className="font-semibold">{item.title}</h3><a className={`${linkClass} mt-3 inline-block`} href={item.imageUrl} target="_blank" rel="noopener noreferrer">{en ? 'Open readable original' : 'Отворете четимия оригинал'}</a></div></article>)}</div> : <p className="mt-5 rounded-2xl bg-[#EADFD0]/60 p-6">{en ? 'No registration documents have been supplied for publication in this section yet. Ask us about the documents for the kitten that interests you.' : 'В тази секция все още няма предоставени регистрационни документи за публикуване. Попитайте за документите на котенцето, което Ви интересува.'}</p>}
    </section>
  </InformationPage>;
}

function CompanyDetails() {
  const { language } = useLanguage();
  const en = language === 'en';
  return <section className="information-company min-w-0 rounded-2xl bg-[#EADFD0] p-6 sm:p-8"><h2 className="font-playfair text-2xl">{en ? 'Company details' : 'Фирмени данни'}</h2><dl className="mt-5 space-y-4 text-sm leading-relaxed">{[[en ? 'Legal name' : 'Юридическо наименование', COMPANY.name], [en ? 'Registration number' : 'ЕИК', COMPANY.registrationNumber], [en ? 'Representative' : 'МОЛ', COMPANY.representative], [en ? 'Address' : 'Адрес', COMPANY.address]].map(([term, value]) => <div key={term}><dt className="font-semibold">{term}</dt><dd>{value}</dd></div>)}<div><dt className="font-semibold">{en ? 'Website' : 'Уебсайт'}</dt><dd className="break-words">www.ragdollbleuroi.eu</dd></div><div><dt className="font-semibold">{en ? 'Contact' : 'Контакт'}</dt><dd><a className={linkClass} href={`tel:${COMPANY.phone}`}>{COMPANY.phone}</a><br /><a className={`${linkClass} break-all`} href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a></dd></div></dl></section>;
}

export function ContactPage() {
  const socialLinks = usePublicSocialLinks();
  const contactLocation = usePublicLocation();
  const { language } = useLanguage();
  const { externalContent, openSettings } = useConsent();
  const en = language === 'en';
  const context = useInquiryContext();
  const text = context ? `${en ? 'Hello! I would like to ask about' : 'Здравейте! Искам да попитам за'} ${context.label || (en ? 'this kitten' : 'това котенце')}: ${SITE_URL}${context.url}` : en ? 'Hello! I would like to ask about reserving a kitten.' : 'Здравейте! Искам да попитам за резервация на котенце.';
  const channels = [
    { name: 'WhatsApp', detail: en ? 'Start a conversation' : 'Започнете разговор', href: `https://wa.me/${COMPANY.phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, icon: MessageCircle },
    { name: en ? 'Phone' : 'Телефон', detail: COMPANY.phone, href: `tel:${COMPANY.phone}`, icon: Phone },
    { name: 'Email', detail: COMPANY.email, href: `mailto:${COMPANY.email}?subject=${encodeURIComponent(en ? 'Kitten inquiry' : 'Запитване за котенце')}&body=${encodeURIComponent(text)}`, icon: Mail },
    { name: 'Viber', detail: en ? 'Open Viber' : 'Отворете Viber', href: `viber://chat?number=${encodeURIComponent(COMPANY.phone)}`, icon: MessageCircle },
    { name: 'Facebook', detail: 'BleuRoi', href: socialLinks.facebook, icon: MessageCircle },
    { name: 'Instagram', detail: 'BleuRoi', href: socialLinks.instagram, icon: MessageCircle },
    { name: 'TikTok', detail: 'BleuRoi', href: socialLinks.tiktok, icon: MessageCircle },
  ];
  return <InformationPage path="/contact" title={en ? 'Let’s find your companion' : 'Да открием Вашия любимец'} description={en ? 'Choose the contact channel that suits you. We will discuss availability and the next steps together.' : 'Изберете удобния за Вас начин за контакт. Ще обсъдим наличността и следващите стъпки заедно.'}>
    {context && <aside className="mb-8 rounded-2xl bg-[#EADFD0] p-5"><strong>{en ? 'Your inquiry' : 'Вашето запитване'}: {context.label || (en ? 'Selected kitten' : 'Избрано котенце')}</strong><p className="mt-2 break-all text-sm">{context.url}</p><p className="mt-2 text-sm">{en ? 'WhatsApp and email include this reference. When using another channel, share the link above.' : 'WhatsApp и имейлът включват този контекст. При друг канал споделете линка по-горе.'}</p></aside>}
    <div className="grid items-start gap-8 lg:grid-cols-[1.2fr_1fr]"><section className="grid gap-4 sm:grid-cols-2" aria-label={en ? 'Contact channels' : 'Канали за контакт'}>{channels.map(({ name, detail, href, icon: Icon }) => <a key={name} href={href} {...(href.startsWith('https:') ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className="min-w-0 rounded-2xl border border-[#5A4336]/20 bg-white/40 p-6 transition hover:bg-[#EADFD0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#5A4336]"><Icon className="mb-4 h-6 w-6" /><h2 className="font-playfair text-2xl">{name}</h2><p className="mt-2 break-words text-sm">{detail}</p></a>)}</section><div className="space-y-5"><CompanyDetails /><Link to={`/waiting-list${en ? '?lang=en' : ''}`} className={`${outlineClass} w-full`}>{en ? 'Join the kitten waiting list' : 'Запишете се в списъка за котенца'}</Link></div></div>
    <section className="mt-14"><h2 className="flex items-center gap-3 font-playfair text-3xl"><MapPin className="h-7 w-7" />{en ? 'Find us' : 'Къде сме'}</h2><p className="mt-3">{contactLocation.address}</p><div className="mt-5 overflow-hidden rounded-2xl border border-[#5A4336]/20">{externalContent ? <iframe title={en ? 'BleuRoi location on Google Maps' : 'Местоположение на BleuRoi в Google Maps'} src={`https://www.google.com/maps?q=${encodeURIComponent(contactLocation.address)}&output=embed`} loading="lazy" referrerPolicy="no-referrer" className="h-[350px] w-full" /> : <div className="bg-[#EADFD0]/60 p-8 text-center"><p>{en ? 'The Google Maps embed is disabled until you allow external content.' : 'Вградената карта е изключена, докато не разрешите външно съдържание.'}</p><div className="mt-5 flex flex-wrap justify-center gap-3"><button className={outlineClass} onClick={openSettings}>{en ? 'Privacy settings' : 'Настройки за поверителност'}</button><a className={outlineClass} href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contactLocation.address)}`} target="_blank" rel="noopener noreferrer">{en ? 'Open Google Maps' : 'Отворете Google Maps'}</a></div></div>}</div></section>
  </InformationPage>;
}

export function WaitingListPage() {
  const { language } = useLanguage();
  const en = language === 'en';
  const context = useInquiryContext();
  const submit = useMutation(api.waitingList.submit);
  const [form, setForm] = useState({ email: '', phone: '', name: '', preferences: '', followUpConsent: false, honeypot: '' });
  const [startedAt] = useState(() => Date.now());
  const [pending, setPending] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState('');
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    setError('');
    let email: string | undefined;
    let phone: string | undefined;
    try { email = normalizeEmail(form.email); }
    catch { setError(en ? 'Please check your email address.' : 'Проверете имейл адреса.'); return; }
    try { phone = normalizePhone(form.phone); }
    catch { setError(en ? 'Enter a valid phone number with a country code (or a Bulgarian mobile number starting with 0).' : 'Въведете валиден телефон с код на държавата (или български мобилен номер, започващ с 0).'); return; }
    if (!email && !phone) { setError(en ? 'Enter an email address or phone number.' : 'Въведете имейл адрес или телефонен номер.'); return; }
    if (!form.followUpConsent) { setError(en ? 'Please explicitly allow personal follow-up about your request.' : 'Дайте изрично разрешение за личен контакт по Вашето запитване.'); return; }
    setPending(true);
    try {
      const result = await submit({ ...(email ? { email } : {}), ...(phone ? { phone } : {}), ...(form.name.trim() ? { name: form.name.trim() } : {}), ...(form.preferences.trim() ? { preferences: form.preferences.trim() } : {}), followUpConsent: true, noticeVersion: '2026-10-02', ...(context ? { context } : {}), honeypot: form.honeypot, startedAt });
      if (result.accepted !== true) throw new Error('Submission was not accepted');
      setAccepted(true);
    } catch {
      setError(en ? 'Your request could not be accepted. Your details are still here; please try again or contact us directly.' : 'Заявката не беше приета. Въведените данни са запазени във формата; опитайте отново или се свържете с нас директно.');
    } finally { setPending(false); }
  };
  const edit = (key: 'email' | 'phone' | 'name' | 'preferences' | 'honeypot', value: string) => setForm((previous) => ({ ...previous, [key]: value }));
  return <InformationPage path="/waiting-list" title={en ? 'Your next companion, in time' : 'Вашият бъдещ любимец'} description={en ? 'Leave an email address or a phone number for personal follow-up about kittens. Joining is an expression of interest, not a confirmed reservation.' : 'Оставете имейл адрес или телефон за личен контакт относно котенца. Записването е израз на интерес, а не потвърдена резервация.'}>
    <div className="grid items-start gap-10 lg:grid-cols-[0.85fr_1.15fr]"><aside><h2 className="font-playfair text-3xl">{en ? 'Tell us what you have in mind' : 'Споделете какво търсите'}</h2><p className="mt-4 text-lg leading-relaxed">{en ? 'You may add your name and preferences, such as breed or colour. No automatic messages or newsletter subscription are created.' : 'По желание добавете име и предпочитания, например порода или цвят. Не се изпращат автоматични съобщения и не се създава абонамент за бюлетин.'}</p>{context && <div className="mt-6 rounded-2xl bg-[#EADFD0] p-5"><strong>{en ? 'Regarding' : 'Относно'}: {context.label || (en ? 'Selected kitten' : 'Избрано котенце')}</strong><p className="mt-2 break-all text-sm">{context.url}</p></div>}<Link className={`${linkClass} mt-6 inline-block`} to={`/contact${en ? '?lang=en' : ''}`}>{en ? 'Prefer to talk directly?' : 'Предпочитате директен разговор?'}</Link></aside>
      <section className="rounded-3xl border border-[#5A4336]/20 bg-white/40 p-6 sm:p-8" aria-label={en ? 'Waiting-list form' : 'Форма за списъка за котенца'}>{accepted ? <div role="status" className="py-8 text-center"><CheckCircle2 className="mx-auto mb-5 h-12 w-12" /><h2 className="font-playfair text-3xl">{en ? 'Your request has been accepted' : 'Заявката Ви е приета'}</h2><p className="mt-4 leading-relaxed">{en ? 'Your details are saved for personal follow-up about your interest in kittens. Thank you.' : 'Данните Ви са записани за личен контакт относно интереса Ви към котенца. Благодарим Ви.'}</p><Link to={`/${en ? '?lang=en' : ''}`} className={`${outlineClass} mt-6`}>{en ? 'Back to the cattery' : 'Към развъдника'}</Link></div> : <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <p className="text-sm">{en ? 'Provide at least one contact method. Both may be entered.' : 'Посочете поне един начин за контакт. Можете да попълните и двата.'}</p>
        <div className="grid gap-5 sm:grid-cols-2"><label className="block text-sm font-semibold" htmlFor="wait-email">{en ? 'Email address' : 'Имейл адрес'}<input id="wait-email" className={`${fieldClass} mt-2 font-normal`} type="email" autoComplete="email" maxLength={254} value={form.email} onChange={(event) => edit('email', event.target.value)} aria-describedby={error ? 'waiting-error' : undefined} /></label><label className="block text-sm font-semibold" htmlFor="wait-phone">{en ? 'Phone number' : 'Телефонен номер'}<input id="wait-phone" className={`${fieldClass} mt-2 font-normal`} type="tel" autoComplete="tel" maxLength={40} placeholder="+359…" value={form.phone} onChange={(event) => edit('phone', event.target.value)} aria-describedby={error ? 'waiting-error' : undefined} /></label></div>
        <label className="block text-sm font-semibold" htmlFor="wait-name">{en ? 'Name (optional)' : 'Име (по желание)'}<input id="wait-name" className={`${fieldClass} mt-2 font-normal`} autoComplete="name" maxLength={100} value={form.name} onChange={(event) => edit('name', event.target.value)} /></label>
        <label className="block text-sm font-semibold" htmlFor="wait-preferences">{en ? 'Kitten preferences (optional)' : 'Предпочитания за котенце (по желание)'}<textarea id="wait-preferences" className={`${fieldClass} mt-2 resize-y font-normal`} rows={4} maxLength={1000} value={form.preferences} onChange={(event) => edit('preferences', event.target.value)} placeholder={en ? 'Breed, colour, timing or questions…' : 'Порода, цвят, период или въпроси…'} /><span className="mt-1 block text-xs font-normal">{en ? 'Please do not include sensitive personal information.' : 'Не включвайте чувствителна лична информация.'}</span></label>
        <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden"><label htmlFor="wait-website">Website<input id="wait-website" tabIndex={-1} autoComplete="off" value={form.honeypot} onChange={(event) => edit('honeypot', event.target.value)} /></label></div>
        <label className="flex gap-3 rounded-xl bg-[#EADFD0]/60 p-4 text-sm leading-relaxed"><input type="checkbox" required className="mt-1 h-5 w-5 shrink-0 accent-[#5A4336]" checked={form.followUpConsent} onChange={(event) => setForm((previous) => ({ ...previous, followUpConsent: event.target.checked }))} /><span>{en ? 'I explicitly allow РЕД ХАВАЛЕ ЕООД to use my contact details for personal follow-up about this kitten request. This permission is separate from marketing and cookie consent, and I may withdraw it by contacting the company.' : 'Изрично разрешавам на РЕД ХАВАЛЕ ЕООД да използва контактните ми данни за личен контакт по това запитване за котенце. Това разрешение е отделно от маркетинг и съгласие за бисквитки и мога да го оттегля чрез контакт с фирмата.'}</span></label>
        <p className="text-sm leading-relaxed">{en ? 'Read how your details are used in the ' : 'Прочетете как се използват данните Ви в '}<Link to={`/privacy${en ? '?lang=en' : ''}`} className={linkClass}>{en ? 'Privacy Policy (development draft)' : 'Политиката за поверителност (работен проект)'}</Link>.</p>
        {error && <p id="waiting-error" role="alert" className="rounded-xl border border-[#8f3328]/30 bg-[#8f3328]/5 p-4 text-[#8f3328]">{error}</p>}
        <button className={`${actionClass} w-full`} type="submit" disabled={pending}>{pending ? (en ? 'Submitting…' : 'Изпращане…') : (en ? 'Join the waiting list' : 'Запишете се в списъка')}</button>
      </form>}</section>
    </div>
  </InformationPage>;
}

export function TermsPage() {
  const { language } = useLanguage();
  const en = language === 'en';
  const sections = en ? [
    ['1. Operator and website', `The website www.ragdollbleuroi.eu is operated by ${COMPANY.name}, registration number ${COMPANY.registrationNumber}, representative ${COMPANY.representative}, address ${COMPANY.address}. Contact: ${COMPANY.email}, ${COMPANY.phone}.`],
    ['2. Information and enquiries', 'The website presents cattery information, cats, published documents and articles. Availability must be discussed with the cattery. Contact links let visitors initiate a conversation using their preferred service.'],
    ['3. Waiting list and reservation', 'Submitting the waiting-list form requests personal follow-up. It does not conclude a sale, take payment, allocate a kitten or guarantee availability. Any reservation is confirmed separately with the company after the individual conditions are discussed.'],
    ['4. Individual contract conditions', 'Price, payment, any deposit, cancellation, handover, transport and the documents for an individual kitten must be confirmed before a binding agreement. This draft does not establish those missing policies or exclude statutory consumer rights.'],
    ['5. Website use and third-party services', 'Use accurate contact information and do not submit abusive content or another person’s data without authority. Outbound contact services have their own terms. Optional embedded content is controlled through privacy settings.'],
    ['6. Questions and complaints', `Contact ${COMPANY.email} or ${COMPANY.phone} with questions or complaints. Applicable consumer rights are preserved. The final contract and any applicable dispute-resolution information require confirmation before final publication.`],
  ] : [
    ['1. Оператор и уебсайт', `Уебсайтът www.ragdollbleuroi.eu се управлява от ${COMPANY.name}, ЕИК ${COMPANY.registrationNumber}, МОЛ ${COMPANY.representative}, адрес ${COMPANY.address}. Контакт: ${COMPANY.email}, ${COMPANY.phone}.`],
    ['2. Информация и запитвания', 'Сайтът представя информация за развъдника, котките, публикуваните документи и статии. Наличността се уточнява с развъдника. Линковете за контакт позволяват посетителите да започнат разговор през предпочитаната услуга.'],
    ['3. Списък за котенца и резервация', 'Изпращането на формата за списъка представлява искане за личен контакт. То не сключва договор за продажба, не приема плащане, не запазва котенце и не гарантира наличност. Резервацията се потвърждава отделно с фирмата след обсъждане на конкретните условия.'],
    ['4. Условия по индивидуалния договор', 'Цената, плащането, евентуалният депозит, отказът, предаването, транспортът и документите за конкретното котенце се потвърждават преди обвързващо споразумение. Този проект не определя липсващите политики и не изключва законови права на потребителите.'],
    ['5. Използване на сайта и външни услуги', 'Използвайте точни контакти и не изпращайте злоупотребяващо съдържание или данни на друго лице без основание. Външните канали за контакт имат собствени условия. Незадължителното вградено съдържание се управлява от настройките за поверителност.'],
    ['6. Въпроси и жалби', `За въпроси и жалби се свържете чрез ${COMPANY.email} или ${COMPANY.phone}. Приложимите права на потребителите се запазват. Окончателният договор и информацията за приложимо разрешаване на спорове се уточняват преди окончателно публикуване.`],
  ];
  return <InformationPage path="/terms" draft title={en ? 'Terms and Conditions' : 'Общи условия'} description={en ? 'Development draft for the information, inquiry and waiting-list services on this website.' : 'Работен проект за информационните услуги, запитванията и списъка за котенца на този сайт.'}><div className="mx-auto max-w-3xl"><DraftNotice /><p className="mb-8 text-sm">{en ? 'Draft date: 2 October 2026' : 'Дата на проекта: 2 октомври 2026 г.'}</p>{sections.map(([title, text]) => <section key={title} className="mb-8"><h2 className="font-playfair text-2xl">{title}</h2><p className="mt-3 leading-relaxed">{text}</p></section>)}<p className="text-sm leading-relaxed">{en ? 'Legal reference: ' : 'Правна основа: '}<a className={linkClass} href="https://www.mi.government.bg/file/2026/05/zet_03_02_26.pdf" target="_blank" rel="noopener noreferrer">{en ? 'Bulgarian Electronic Commerce Act' : 'Закон за електронната търговия'}</a>.</p></div></InformationPage>;
}

export function PrivacyPage() {
  const { language } = useLanguage();
  const { openSettings } = useConsent();
  const en = language === 'en';
  const sections = en ? [
    ['1. Controller', `${COMPANY.name}, registration number ${COMPANY.registrationNumber}, representative ${COMPANY.representative}, address ${COMPANY.address}, is the controller of the website’s enquiry and waiting-list data. Contact: ${COMPANY.email}, ${COMPANY.phone}.`],
    ['2. Enquiries and waiting-list data', 'The waiting-list form accepts an email address or phone number, optional name and kitten preferences, explicit personal-follow-up permission and, where applicable, the selected cat or inquiry reference. Staff may record status and internal notes. The backend also records submission and consent timestamps, notice version and identifiers needed to prevent duplicate or abusive submissions. Do not submit sensitive information.'],
    ['3. Purposes and lawful bases', 'Waiting-list data is used for the requested personal follow-up on the basis of your consent (GDPR Article 6(1)(a)). Answering an individual reservation inquiry may involve steps at your request before entering a contract (Article 6(1)(b)). Proportionate security and abuse prevention rely on legitimate interests (Article 6(1)(f)); the final documentation must record that assessment. Waiting-list permission is not permission for unrelated marketing. No automatic follow-up messages are sent by this website.'],
    ['4. Storage and recipients', 'Waiting-list submissions and internal management are stored in the existing Convex backend and accessed by authenticated authorized administrators. Hosting providers necessarily process technical request information. Their deployment region, processing agreements, subprocessors and any international-transfer safeguards require confirmation before this draft becomes final. External contact channels such as WhatsApp, Viber, Facebook, Instagram and TikTok operate under their own privacy policies when you choose to use them.'],
    ['5. Cookies and optional services', 'Necessary local storage remembers language, privacy choices and authenticated administrator sessions. The consent preference is renewed after approximately six months. Optional visitor analytics, including the site’s Convex analytics and Google Analytics when configured, remain off without analytics consent. Meta Pixel remains off without marketing consent. Google Maps and any external social embeds remain off without external-content consent. A site visitor session identifier is created only with analytics consent. Withdrawal stops future optional processing and clears optional identifiers and cookies controlled by this site.'],
    ['6. Retention', 'An exact waiting-list retention period has not yet been approved. It must be limited to the follow-up purpose and documented before final publication, together with periods for closed enquiries, security records, analytics and backups. Authorized staff can delete waiting-list records. Contact the company to request withdrawal or deletion; this draft does not promise that closing a record automatically erases it or that backup copies disappear immediately.'],
    ['7. Your rights', `You may ask for access, correction, deletion, restriction and, where applicable, portability or object to processing. You may withdraw follow-up consent at any time using ${COMPANY.email} or ${COMPANY.phone}; withdrawal does not affect prior lawful processing. Optional-service consent may be changed using the footer’s privacy settings. You may lodge a complaint with the Bulgarian Commission for Personal Data Protection (CPDP). Requests are handled within applicable GDPR time limits and identity is verified proportionately.`],
    ['8. Decisions and changes', 'The waiting list is managed by people; the website does not make automated decisions allocating a kitten. No customer data is sold by the site functionality. The final policy must document the confirmed hosting arrangements and retention periods, and material changes must be explained before new processing begins.'],
  ] : [
    ['1. Администратор на данните', `${COMPANY.name}, ЕИК ${COMPANY.registrationNumber}, МОЛ ${COMPANY.representative}, адрес ${COMPANY.address}, е администратор на данните за запитванията и списъка за котенца. Контакт: ${COMPANY.email}, ${COMPANY.phone}.`],
    ['2. Данни от запитванията и списъка', 'Формата приема имейл адрес или телефон, незадължителни име и предпочитания, изрично разрешение за личен контакт и, когато е приложимо, избраното котенце или контекст на запитването. Екипът може да записва статус и вътрешни бележки. Сървърът записва датите на заявката и съгласието, версията на уведомлението и идентификатори, необходими за предотвратяване на дублирани или злоупотребяващи заявки. Не изпращайте чувствителна информация.'],
    ['3. Цели и правни основания', 'Данните от списъка се използват за поискания личен контакт въз основа на съгласие (чл. 6, пар. 1, буква „а“ ОРЗД). Отговорът на индивидуално запитване за резервация може да включва действия по Ваше искане преди сключване на договор (буква „б“). Пропорционалната защита от злоупотреби се основава на легитимен интерес (буква „е“); оценката му трябва да се документира окончателно. Разрешението за списъка не е разрешение за несвързан маркетинг. Сайтът не изпраща автоматични последващи съобщения.'],
    ['4. Съхранение и получатели', 'Заявките и вътрешното им управление се съхраняват в съществуващия сървър Convex и са достъпни за удостоверени упълномощени администратори. Хостинг доставчиците обработват техническа информация за заявките. Регионът на услугите, договорите за обработване, подизпълнителите и евентуалните гаранции за международен трансфер се потвърждават преди окончателното публикуване. Външните канали WhatsApp, Viber, Facebook, Instagram и TikTok прилагат собствените си политики, когато изберете да ги използвате.'],
    ['5. Бисквитки и незадължителни услуги', 'Необходимото локално съхранение запомня езика, избора за поверителност и удостоверените администраторски сесии. Изборът за съгласие се подновява след приблизително шест месеца. Незадължителната статистика, включително тази в Convex и Google Analytics при настройване, остава изключена без съгласие за статистика. Meta Pixel остава изключен без съгласие за маркетинг. Google Maps и външните социални вграждания остават изключени без съгласие за външно съдържание. Идентификатор за посетителска сесия се създава само след съгласие за статистика. Оттеглянето спира бъдещото незадължително обработване и изчиства контролираните от сайта незадължителни идентификатори и бисквитки.'],
    ['6. Срокове за съхранение', 'Точен срок за данните от списъка все още не е одобрен. Той трябва да бъде ограничен до целта за последващ контакт и документиран преди окончателното публикуване, заедно със срокове за приключени запитвания, записи за сигурност, статистика и резервни копия. Упълномощеният екип може да изтрива заявки. Свържете се с фирмата за оттегляне или изтриване; този проект не обещава, че приключването на заявка автоматично я изтрива или че резервните копия се заличават веднага.'],
    ['7. Вашите права', `Можете да поискате достъп, поправка, изтриване, ограничаване и, когато е приложимо, преносимост или да възразите срещу обработването. Можете да оттеглите разрешението за личен контакт по всяко време чрез ${COMPANY.email} или ${COMPANY.phone}; това не засяга предходното законосъобразно обработване. Съгласието за незадължителните услуги се променя от настройките в долната част на сайта. Можете да подадете жалба до Комисията за защита на личните данни (КЗЛД). Исканията се обработват в приложимите срокове по ОРЗД, с пропорционална проверка на самоличността.`],
    ['8. Решения и промени', 'Списъкът се управлява от хора; сайтът не взема автоматизирани решения за разпределяне на котенце. Функционалността на сайта не продава клиентски данни. Окончателната политика трябва да включва потвърдените хостинг отношения и срокове за съхранение, а съществените промени се обясняват преди ново обработване.'],
  ];
  return <InformationPage path="/privacy" draft title={en ? 'Privacy Policy' : 'Политика за поверителност'} description={en ? 'How enquiries, waiting-list requests and privacy choices are handled. Development draft.' : 'Как се обработват запитванията, заявките за котенца и изборът за поверителност. Работен проект.'}><div className="mx-auto max-w-3xl"><DraftNotice /><p className="mb-8 text-sm">{en ? 'Draft date and notice version: 2 October 2026 / 2026-10-02' : 'Дата на проекта и версия на уведомлението: 2 октомври 2026 г. / 2026-10-02'}</p>{sections.map(([title, text]) => <section key={title} className="mb-8"><h2 className="font-playfair text-2xl">{title}</h2><p className="mt-3 leading-relaxed">{text}</p></section>)}<button className={outlineClass} onClick={openSettings}>{en ? 'Change / withdraw optional consent' : 'Промяна / оттегляне на незадължителното съгласие'}</button><p className="mt-8 text-sm leading-relaxed">{en ? 'Information and complaint authority: ' : 'Информация и надзорен орган за жалби: '}<a className={linkClass} href="https://cpdp.bg/" target="_blank" rel="noopener noreferrer">{en ? 'Bulgarian CPDP' : 'КЗЛД'}</a>. {en ? 'Rights reference: ' : 'Информация за правата: '}<a className={linkClass} href="https://www.edpb.europa.eu/sme/be-compliant/respect-individuals-rights_en" target="_blank" rel="noopener noreferrer">EDPB</a>.</p></div></InformationPage>;
}
