import { authorConfig } from "@/config/author";
import { FiGithub, FiMail } from "react-icons/fi";
import { FaOrcid } from "react-icons/fa";
import { SiGooglescholar } from "react-icons/si";
import Image from "next/image";
import { defaultLocale, type Locale } from "@/i18n/locales";
import { getMessages } from "@/i18n/messages";

interface AuthorProfileProps {
  locale?: Locale;
}

export function AuthorProfile({ locale = defaultLocale }: AuthorProfileProps) {
  const { author } = getMessages(locale);

  return (
    <div className="author-profile flex items-center gap-3 p-3">
      <Image
        src={authorConfig.avatar}
        alt={authorConfig.name}
        width={80}
        height={80}
        className="rounded-full object-cover max-w-[175px]"
        unoptimized
      />
      <div>
        <h3 className="text-base font-bold m-0 text-[var(--global-text-color)]">
          {authorConfig.name}
        </h3>
        <p className="text-xs text-[var(--global-text-color-light)] mt-1 mb-2">
          {author.bio}
        </p>
        <div className="flex flex-wrap gap-2">
          {authorConfig.github && (
            <a
              href={`https://github.com/${authorConfig.github}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--global-text-color-light)] hover:text-[var(--global-link-color-hover)] transition-colors"
              aria-label="GitHub"
            >
              <FiGithub size={18} />
            </a>
          )}
          <a
            href={`mailto:${authorConfig.email}`}
            className="text-[var(--global-text-color-light)] hover:text-[var(--global-link-color-hover)] transition-colors"
            aria-label="Email"
          >
            <FiMail size={18} />
          </a>
          {authorConfig.googlescholar && (
            <a
              href={authorConfig.googlescholar}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--global-text-color-light)] hover:text-[var(--global-link-color-hover)] transition-colors"
              aria-label="Google Scholar"
            >
              <SiGooglescholar size={18} />
            </a>
          )}
          {authorConfig.orcid && (
            <a
              href={authorConfig.orcid}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--global-text-color-light)] hover:text-[var(--global-link-color-hover)] transition-colors"
              aria-label="ORCID"
            >
              <FaOrcid size={18} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
