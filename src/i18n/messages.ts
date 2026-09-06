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
  pages: {
    home: {
      lead: string;
      currentFocusLabel: string;
      readInsights: string;
      downloadCv: string;
      roles: string[];
      insightsTitle: string;
      insightsCta: string;
      educationTitle: string;
      internshipTitle: string;
      researchTitle: string;
    };
    insights: {
      metadataTitle: string;
      metadataDescription: string;
      eyebrow: string;
      title: string;
      subtitle: string;
      publishedEyebrow: string;
      publishedTitle: string;
      futureNote: string;
      backHome: string;
      footerLabel: string;
      articleLabel: string;
      readingLabel: string;
      backToInsights: string;
    };
    cv: {
      title: string;
      downloadPdf: string;
      educationTitle: string;
      publicationsTitle: string;
      internshipTitle: string;
    };
    publications: {
      title: string;
      alsoOn: string;
      categoryTitles: Record<string, string>;
    };
    posts: {
      title: string;
      description: string;
      insightsLink: string;
    };
    sitemap: {
      title: string;
      pages: Record<string, string>;
    };
    stats: {
      title: string;
      dashboardTitle: string;
      username: string;
      password: string;
      signIn: string;
      signOut: string;
      invalidCredentials: string;
      analyticsFor: string;
      trackingId: string;
      fullDashboard: string;
    };
    talks: {
      title: string;
      description: string;
    };
    teaching: {
      title: string;
      description: string;
    };
    terms: {
      title: string;
      analyticsTitle: string;
      externalLinksTitle: string;
      intro: string;
      analytics: string;
      externalLinks: string;
    };
    notFound: {
      title: string;
      description: string;
      backHome: string;
    };
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
    pages: {
      home: {
        lead: "I build trustworthy speech and language systems, with research spanning proactive interaction, privacy evaluation, and end-to-end spoken dialogue intelligence.",
        currentFocusLabel: "Current Focus:",
        readInsights: "Read Insights",
        downloadCv: "Download CV",
        roles: [
          "SLM Trustworthiness",
          "RL for Proactive Dialogue",
          "Agentic Speech Intelligence",
          "End-to-End Spoken Dialogue Systems",
        ],
        insightsTitle: "Insights",
        insightsCta: "Open Blog & Ideas",
        educationTitle: "Education",
        internshipTitle: "Internship",
        researchTitle: "Research",
      },
      insights: {
        metadataTitle: "Blog & Ideas",
        metadataDescription:
          "Blog and idea notes by HongYu Liu on industries, companies, and notable reporting.",
        eyebrow: "Insights",
        title: "Blog & Ideas",
        subtitle: "This is where I regularly write analysis and judgment pieces about industries.",
        publishedEyebrow: "Published essays",
        publishedTitle: "Recent notes and essays.",
        futureNote:
          "Future published essays can be wired to MDX without changing this page structure.",
        backHome: "Back to homepage",
        footerLabel: "Blog & Ideas",
        articleLabel: "Article",
        readingLabel: "Reading",
        backToInsights: "Back to Insights",
      },
      cv: {
        title: "Curriculum Vitae",
        downloadPdf: "Download PDF",
        educationTitle: "Education",
        publicationsTitle: "Publications",
        internshipTitle: "Internship",
      },
      publications: {
        title: "Publications",
        alsoOn: "Also available on",
        categoryTitles: {
          conferences: "Conference Papers",
          manuscripts: "Journal Articles",
          books: "Books",
        },
      },
      posts: {
        title: "Posts",
        description:
          "The older sample post archive has been retired. New essays, company notes, and reporting commentary now live in the Insights section.",
        insightsLink: "Go to Insights",
      },
      sitemap: {
        title: "Sitemap",
        pages: {
          home: "Home",
          publications: "Publications",
          insights: "Insights",
          cv: "CV",
          teaching: "Teaching",
          talks: "Talks",
          posts: "Posts",
          stats: "Stats",
          sitemap: "Sitemap",
          terms: "Terms & Privacy",
        },
      },
      stats: {
        title: "Site Statistics",
        dashboardTitle: "Site Statistics Dashboard",
        username: "Username",
        password: "Password",
        signIn: "Sign In",
        signOut: "Sign Out",
        invalidCredentials: "Invalid credentials. Please try again.",
        analyticsFor: "Google Analytics data for david188888.github.io",
        trackingId: "Tracking ID",
        fullDashboard: "Full analytics dashboard available at",
      },
      talks: {
        title: "Talks and Presentations",
        description: "Talks and presentations coming soon.",
      },
      teaching: {
        title: "Teaching",
        description: "Teaching experience coming soon.",
      },
      terms: {
        title: "Terms and Privacy Policy",
        analyticsTitle: "Analytics",
        externalLinksTitle: "External Links",
        intro:
          "This is a personal academic homepage. No personal data is collected beyond standard server access logs.",
        analytics:
          "This site uses Google Analytics 4 to collect anonymous usage data. You may opt out by using browser privacy settings or ad blockers.",
        externalLinks:
          "This site contains links to external sites (arXiv, GitHub, Google Scholar). We are not responsible for their privacy practices.",
      },
      notFound: {
        title: "Page Not Found",
        description: "The page you are looking for does not exist.",
        backHome: "Back to Home",
      },
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
    pages: {
      home: {
        lead: "我专注于构建可信的语音与语言系统，研究方向涵盖主动交互、隐私评估，以及端到端语音对话智能。",
        currentFocusLabel: "当前关注：",
        readInsights: "阅读随笔",
        downloadCv: "下载简历",
        roles: [
          "语音语言模型可信性",
          "面向主动对话的强化学习",
          "智能体语音智能",
          "端到端语音对话系统",
        ],
        insightsTitle: "随笔洞察",
        insightsCta: "打开随笔与想法",
        educationTitle: "教育经历",
        internshipTitle: "实习经历",
        researchTitle: "研究成果",
      },
      insights: {
        metadataTitle: "随笔与想法",
        metadataDescription:
          "HongYu Liu 关于行业、公司和重要报道的随笔与观察。",
        eyebrow: "随笔洞察",
        title: "随笔与想法",
        subtitle: "这里平常会写一些对行业的分析与判断。",
        publishedEyebrow: "已发布文章",
        publishedTitle: "近期笔记与长文。",
        futureNote: "未来发布的文章可以接入 MDX，而无需改变这个页面结构。",
        backHome: "返回首页",
        footerLabel: "随笔与想法",
        articleLabel: "文章",
        readingLabel: "正文",
        backToInsights: "返回随笔洞察",
      },
      cv: {
        title: "简历",
        downloadPdf: "下载 PDF",
        educationTitle: "教育经历",
        publicationsTitle: "论文发表",
        internshipTitle: "实习经历",
      },
      publications: {
        title: "论文发表",
        alsoOn: "也可在以下页面查看",
        categoryTitles: {
          conferences: "会议论文",
          manuscripts: "期刊文章",
          books: "书籍",
        },
      },
      posts: {
        title: "文章归档",
        description:
          "旧的示例文章归档已经移除。新的长文、公司笔记和报道评论现在放在随笔洞察页面。",
        insightsLink: "前往随笔洞察",
      },
      sitemap: {
        title: "站点地图",
        pages: {
          home: "首页",
          publications: "论文发表",
          insights: "随笔洞察",
          cv: "简历",
          teaching: "教学经历",
          talks: "演讲报告",
          posts: "文章归档",
          stats: "访问统计",
          sitemap: "站点地图",
          terms: "条款与隐私",
        },
      },
      stats: {
        title: "站点统计",
        dashboardTitle: "站点统计仪表盘",
        username: "用户名",
        password: "密码",
        signIn: "登录",
        signOut: "退出登录",
        invalidCredentials: "用户名或密码无效，请重试。",
        analyticsFor: "david188888.github.io 的 Google Analytics 数据",
        trackingId: "跟踪 ID",
        fullDashboard: "完整分析仪表盘可在此查看：",
      },
      talks: {
        title: "演讲与报告",
        description: "演讲和报告内容即将更新。",
      },
      teaching: {
        title: "教学经历",
        description: "教学经历即将更新。",
      },
      terms: {
        title: "条款与隐私政策",
        analyticsTitle: "分析统计",
        externalLinksTitle: "外部链接",
        intro: "这是一个个人学术主页。除标准服务器访问日志外，本站不收集个人数据。",
        analytics:
          "本站使用 Google Analytics 4 收集匿名访问数据。你可以通过浏览器隐私设置或广告拦截工具选择退出。",
        externalLinks:
          "本站包含指向外部网站的链接，如 arXiv、GitHub 和 Google Scholar。我们不对这些网站的隐私实践负责。",
      },
      notFound: {
        title: "页面未找到",
        description: "你访问的页面不存在。",
        backHome: "返回首页",
      },
    },
  },
};

export function getMessages(locale: Locale): Messages {
  return messages[locale];
}
