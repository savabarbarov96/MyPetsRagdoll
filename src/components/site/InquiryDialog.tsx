import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Phone, Mail, Copy, MessageCircle, ArrowRight, Instagram, Facebook, Music2, ArrowUpRight } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { usePublicSocialLinks } from "@/hooks/usePublicContacts";
import { COMPANY } from "@/config/site";
import {
  CONTACT_PHONE_E164,
  CONTACT_PHONE_DISPLAY,
  WHATSAPP_LINK,
} from "@/config/contact";
import "@/styles/inquiry.css";

export interface InquiryContext {
  catId?: string;
  name?: string;
  url?: string;
}
export interface InquiryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context?: InquiryContext;
}

export default function InquiryDialog({
  open,
  onOpenChange,
  context,
}: InquiryDialogProps) {
  const { language } = useLanguage();
  const socialLinks = usePublicSocialLinks();
  const en = language === "en";
  const opener = useRef<HTMLElement | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const subject = en
    ? `Reservation inquiry${context?.name ? `: ${context.name}` : ""}`
    : `Запитване за резервация${context?.name ? `: ${context.name}` : ""}`;
  const text = `${en ? "Hello! I would like to ask about reserving" : "Здравейте! Бих искал/а да попитам за резервация на"} ${context?.name || (en ? "a kitten" : "котенце")}.${context?.url ? `\n${context.url}` : ""}`;
  const params = new URLSearchParams();
  if (context?.catId) params.set("cat", context.catId);
  if (context?.name) params.set("context", context.name);
  if (context?.url) {
    const source = new URL(context.url, window.location.origin);
    params.set("contextUrl", `${source.pathname}${source.search}`);
  }
  if (en) params.set("lang", "en");
  const waitingURL = `/waiting-list${params.size ? `?${params}` : ""}`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setCopyError(false);
    } catch {
      setCopyError(true);
    }
  };
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(value) => {
        setCopied(false);
        setCopyError(false);
        onOpenChange(value);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="public-dialog-overlay" />
        <Dialog.Content className="public-inquiry-sheet public-site"
          onOpenAutoFocus={() => { opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null; }}
          onCloseAutoFocus={(event) => { event.preventDefault(); if (opener.current?.isConnected) opener.current.focus(); }}
        >
          <Dialog.Close className="inquiry-close" aria-label={en ? "Close" : "Затвори"}>
            <X size={20} />
          </Dialog.Close>
          <div className="inquiry-heading">
            <p className="inquiry-kicker">BleuRoi · {en ? "Reservations" : "Резервации"}</p>
            <Dialog.Title className="inquiry-title">
              {en ? "Let’s talk." : "Нека поговорим."}
            </Dialog.Title>
            <Dialog.Description className="inquiry-description">
              {en ? "Choose a channel that suits you. We confirm availability and reservation details personally." : "Изберете удобен начин за връзка. Наличността и резервацията се уточняват лично."}
            </Dialog.Description>
          </div>
          {context?.name && <div className="inquiry-selection">
            <span>{en ? "Your inquiry" : "Вашето запитване"}</span><strong>{context.name}</strong>
          </div>}
          <div className="inquiry-channels" aria-label={en ? "Reservation contact channels" : "Канали за резервация"}>
            <a className="inquiry-channel inquiry-channel-primary" href={`${WHATSAPP_LINK}?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="inquiry-channel-icon" size={21} /><span><strong>WhatsApp</strong><small>{en ? "Write to us" : "Пишете ни"}</small></span><ArrowUpRight size={16} />
            </a>
            <a className="inquiry-channel" href={socialLinks.instagram} target="_blank" rel="noopener noreferrer">
              <Instagram className="inquiry-channel-icon" size={21} /><span><strong>Instagram</strong><small>{en ? "Message our profile" : "Пишете в профила ни"}</small></span><ArrowUpRight size={16} />
            </a>
            <a className="inquiry-channel" href={socialLinks.tiktok} target="_blank" rel="noopener noreferrer">
              <Music2 className="inquiry-channel-icon" size={21} /><span><strong>TikTok</strong><small>{en ? "Visit our profile" : "Отворете профила ни"}</small></span><ArrowUpRight size={16} />
            </a>
            <a className="inquiry-channel" href={socialLinks.facebook} target="_blank" rel="noopener noreferrer">
              <Facebook className="inquiry-channel-icon" size={21} /><span><strong>Facebook</strong><small>{en ? "Message our page" : "Пишете на страницата ни"}</small></span><ArrowUpRight size={16} />
            </a>
            <a className="inquiry-channel" href={`tel:${CONTACT_PHONE_E164}`}>
              <Phone className="inquiry-channel-icon" size={21} /><span><strong>{en ? "Call us" : "Обадете се"}</strong><small>{CONTACT_PHONE_DISPLAY}</small></span><ArrowUpRight size={16} />
            </a>
            <a className="inquiry-channel" href={`mailto:${COMPANY.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`}>
              <Mail className="inquiry-channel-icon" size={21} /><span><strong>{en ? "Send an email" : "Изпратете имейл"}</strong><small>{en ? "Send your inquiry" : "Изпратете запитване"}</small></span><ArrowUpRight size={16} />
            </a>
          </div>
          {context?.name && <details className="inquiry-context-details">
            <summary>{en ? "Inquiry details for social messages" : "Данни за запитване в социалните мрежи"}</summary>
            <p>{en ? "Copy these details into your message so we know which cat you are asking about." : "Копирайте тези данни в съобщението си, за да знаем за коя котка питате."}</p>
            <textarea aria-label={en ? "Inquiry details" : "Данни за запитването"} readOnly value={text} />
            <button className="inquiry-copy" onClick={copy}><Copy size={16} />{copied ? (en ? "Copied" : "Копирано") : (en ? "Copy inquiry" : "Копирайте запитването")}</button>
            {copied && <span role="status" className="inquiry-copy-status">{en ? "Ready to paste into your message." : "Готово за поставяне в съобщението ви."}</span>}
            {copyError && <p role="alert">{en ? "Please select and copy the text above." : "Моля, маркирайте и копирайте текста по-горе."}</p>}
          </details>}
          <div className="inquiry-waiting">
            <span>{en ? "Planning ahead?" : "Планирате занапред?"}</span>
            <Link to={waitingURL} onClick={() => onOpenChange(false)}>{en ? "Join the kitten waiting list" : "Запишете се в списъка за котенце"}<ArrowRight size={17} /></Link>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
