import { useState } from "react";
import { Link } from "react-router-dom";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Phone, Mail, Copy, MessageCircle, ArrowRight } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { usePublicSocialLinks } from "@/hooks/usePublicContacts";
import { COMPANY } from "@/config/site";
import {
  CONTACT_PHONE_E164,
  CONTACT_PHONE_DISPLAY,
  WHATSAPP_LINK,
} from "@/config/contact";

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
        <Dialog.Content className="public-inquiry public-site">
          <Dialog.Close
            className="public-dialog-close"
            aria-label={en ? "Close" : "Затвори"}
          >
            <X size={22} />
          </Dialog.Close>
          <p className="public-eyebrow">
            BleuRoi · {en ? "Let’s talk" : "Нека поговорим"}
          </p>
          <Dialog.Title className="public-dialog-title">
            {en
              ? "Your next chapter starts here."
              : "Тук започва вашата история."}
          </Dialog.Title>
          <Dialog.Description>
            {context?.name
              ? `${en ? "Inquiry about" : "Запитване за"} ${context.name}. `
              : ""}
            {en
              ? "Choose how you would like to contact us. Availability and reservation details are confirmed personally."
              : "Изберете удобен начин за връзка. Наличността и условията за резервация се уточняват лично."}
          </Dialog.Description>
          <div className="public-contact-options">
            <a
              className="public-button"
              href={`${WHATSAPP_LINK}?text=${encodeURIComponent(text)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle size={19} /> WhatsApp <ArrowRight size={18} />
            </a>
            <a
              className="public-button public-button-outline"
              href={`mailto:${COMPANY.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`}
            >
              <Mail size={19} />
              {en ? "Send an email" : "Изпратете имейл"}
            </a>
            <a
              className="public-button public-button-outline"
              href={`tel:${CONTACT_PHONE_E164}`}
            >
              <Phone size={19} />
              {CONTACT_PHONE_DISPLAY}
            </a>
          </div>
          {context?.name && (
            <div className="public-inquiry-context">
              <p>
                {en
                  ? "For a phone or social conversation, use these details:"
                  : "За разговор по телефон или в социалните мрежи използвайте тези данни:"}
              </p>
              <textarea
                aria-label={en ? "Inquiry details" : "Данни за запитването"}
                readOnly
                value={text}
              />
              <button className="public-text-link" onClick={copy}>
                <Copy size={16} />
                {copied
                  ? en
                    ? "Copied"
                    : "Копирано"
                  : en
                    ? "Copy inquiry"
                    : "Копирайте запитването"}
              </button>
              {copyError && (
                <p role="alert">
                  {en
                    ? "Please select and copy the text above."
                    : "Моля, маркирайте и копирайте текста по-горе."}
                </p>
              )}
            </div>
          )}
          <div className="public-social-text">
            <a
              href={socialLinks.facebook}
              target="_blank"
              rel="noopener noreferrer"
            >
              Facebook
            </a>
            <a
              href={socialLinks.instagram}
              target="_blank"
              rel="noopener noreferrer"
            >
              Instagram
            </a>
            <a
              href={socialLinks.tiktok}
              target="_blank"
              rel="noopener noreferrer"
            >
              TikTok
            </a>
          </div>
          <Link
            className="public-text-link"
            to={waitingURL}
            onClick={() => onOpenChange(false)}
          >
            {en
              ? "Join the kitten waiting list"
              : "Запишете се в списъка за котенце"}
            <ArrowRight size={17} />
          </Link>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
