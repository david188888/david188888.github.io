import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { defaultLocale } from "@/i18n/locales";
import "./globals.css";

export const metadata: Metadata = {
  // No `template`: every route composes its own title with the name spelled for
  // its locale. A single `%s | HongYu Liu` template would append the English
  // name to Chinese pages and could not be bypassed by a child page. (Next's
  // object form requires `template`, so this is the plain-string form instead.)
  title: "HongYu Liu",
  description:
    "Industry memos by HongYu Liu — AI infrastructure and supply chain, consumer and platform markets, and how technical change becomes a business fact.",
  icons: {
    icon: "/images/favicon.ico",
  },
};

const documentLanguageScript = `(function () {
  var locale = window.location.pathname.split("/")[1];
  document.documentElement.lang = locale === "en" ? "en" : "${defaultLocale}";
})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang={defaultLocale} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: documentLanguageScript }} />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="data-theme" defaultTheme="dark" enableSystem={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
