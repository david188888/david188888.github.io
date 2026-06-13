import type { Locale } from "./locales";

export interface Messages {
  nav: {
    publications: string;
    insights: string;
    internships: string;
    cv: string;
    contact: string;
    github: string;
  };
  footer: {
    sitemap: string;
    terms: string;
    poweredBy: string;
  };
  author: {
    bio: string;
  };
  common: {
    paper: string;
    backHome: string;
  };
}

export const messages: Record<Locale, Messages> = {
  en: {
    nav: {
      publications: "Publications",
      insights: "Insights",
      internships: "Internships",
      cv: "CV",
      contact: "Contact",
      github: "GitHub",
    },
    footer: {
      sitemap: "Sitemap",
      terms: "Terms & Privacy",
      poweredBy: "Powered by",
    },
    author: {
      bio: "Speech Language Model · SLM Trustworthiness · Agentic RL",
    },
    common: {
      paper: "Paper",
      backHome: "Back Home",
    },
  },
  zh: {
    nav: {
      publications: "论文发表",
      insights: "随笔洞察",
      internships: "实习经历",
      cv: "简历",
      contact: "联系",
      github: "GitHub",
    },
    footer: {
      sitemap: "站点地图",
      terms: "条款与隐私",
      poweredBy: "基于",
    },
    author: {
      bio: "语音语言模型 · SLM 可信性 · 智能体强化学习",
    },
    common: {
      paper: "论文",
      backHome: "返回首页",
    },
  },
};

export function getMessages(locale: Locale): Messages {
  return messages[locale];
}
