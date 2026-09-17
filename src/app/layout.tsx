import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { defaultLocale } from "@/i18n/locales";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "HongYu Liu",
    template: "%s | HongYu Liu",
  },
  description:
    "Personal academic homepage of HongYu Liu — Speech Language Model, SLM Trustworthiness, Agentic RL researcher.",
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
