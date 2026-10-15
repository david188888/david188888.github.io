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
      metadataTitle: string;
      metadataDescription: string;
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
      annotations: {
        toggleOpen: string;
        toggleClose: string;
        hint: string;
        hiddenTitle: string;
        hiddenEmpty: string;
        localTitle: string;
        localEmpty: string;
        underline: string;
        note: string;
        notePlaceholder: string;
        save: string;
        cancel: string;
        hide: string;
        restore: string;
        restoreAll: string;
        delete: string;
        disableTools: string;
        selectionFailed: string;
        hiddenPlaceholder: string;
        unlock: string;
      };
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
      openDashboard: string;
      googleSignInNote: string;
      coverageTitle: string;
      coverageDescription: string;
      viewsTitle: string;
      viewsDescription: string;
      usersTitle: string;
      usersDescription: string;
      sessionsTitle: string;
      sessionsDescription: string;
      readingTitle: string;
      readingSteps: string[];
      dataNote: string;
      authorToolsTitle: string;
      authorToolsDescription: string;
      authorToolsUnlocked: string;
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
      insights: "Memos",
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
        metadataTitle: "Industry Memos · AI Infrastructure & Supply Chain",
        metadataDescription:
          "Industry memos by HongYu Liu — AI infrastructure and supply chain, consumer and platform markets, and how technical change becomes a business fact.",
        lead: "I build trustworthy speech and language systems, with research spanning proactive interaction, privacy evaluation, and end-to-end spoken dialogue intelligence.",
        currentFocusLabel: "Current Focus:",
        readInsights: "Read Memos",
        downloadCv: "Download CV",
        roles: [
          "SLM Trustworthiness",
          "RL for Proactive Dialogue",
          "Agentic Speech Intelligence",
          "End-to-End Spoken Dialogue Systems",
        ],
        insightsTitle: "Industry Memos",
        insightsCta: "Open Industry Memos",
        educationTitle: "Education",
        internshipTitle: "Internship",
        researchTitle: "Research",
      },
      insights: {
        metadataTitle: "Industry Memos",
        metadataDescription:
          "Memos by HongYu Liu on industries, companies, and notable reporting.",
        eyebrow: "Industry Memos",
        title: "Industry Memos",
        subtitle: "This is where I regularly write analysis and judgment pieces about industries.",
        publishedEyebrow: "Published memos",
        publishedTitle: "Recent memos.",
        futureNote:
          "Future published essays can be wired to MDX without changing this page structure.",
        backHome: "Back to homepage",
        footerLabel: "Industry Memos",
        articleLabel: "Article",
        readingLabel: "Reading",
        annotations: {
          toggleOpen: "Annotations",
          toggleClose: "Done",
          hint: "Click a published note or underline to hide it, and click again to bring it back.",
          hiddenTitle: "Hidden marks",
          hiddenEmpty: "Nothing is hidden.",
          localTitle: "My marks",
          localEmpty: "No marks yet. Select text in the article to add one.",
          underline: "Underline",
          note: "Add note",
          notePlaceholder: "Write a note…",
          save: "Save",
          cancel: "Cancel",
          hide: "Hide",
          restore: "Restore",
          restoreAll: "Restore all",
          delete: "Delete",
          disableTools: "Turn off annotation tools",
          selectionFailed: "That selection crosses formatting blocks. Try a shorter one.",
          hiddenPlaceholder: "Hidden note · click to restore",
          unlock: "Sign in to annotate",
        },
        backToInsights: "Back to memos",
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
          "The older sample post archive has been retired. New essays, company notes, and reporting commentary now live in the Industry Memos section.",
        insightsLink: "Go to Industry Memos",
      },
      sitemap: {
        title: "Sitemap",
        pages: {
          home: "Home",
          publications: "Publications",
          insights: "Memos",
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
        analyticsFor: "Website traffic for david188888.github.io",
        trackingId: "Measurement ID",
        openDashboard: "Open Google Analytics ↗",
        googleSignInNote: "View your private reports with the Google account that has access to David Homepage. No website login is needed.",
        coverageTitle: "One view of the whole website",
        coverageDescription: "The homepage, blog articles, projects, CV and all other pages in both languages share one GA4 property. Visitors can arrive on any page; they do not need to visit the homepage first.",
        viewsTitle: "Views",
        viewsDescription: "Each page view counts. Visiting the homepage and then an article adds two views to the website total.",
        usersTitle: "Active users",
        usersDescription: "Use this to understand your audience. GA4 identifies users across pages; adding up each page’s users does not give the website total.",
        sessionsTitle: "Sessions",
        sessionsDescription: "A visit can include several page views. One person can return for multiple sessions.",
        readingTitle: "What to look at",
        readingSteps: [
          "Open the dashboard, choose a date range and select Views for the website’s total page views and trend.",
          "Open Pages and screens to see which articles and other pages people read.",
          "Open Realtime to check recent visits, or Traffic acquisition to see where visitors came from.",
        ],
        dataNote: "Collection starts after the tag goes live; earlier unrecorded visits cannot be recovered. Standard reports take time to process, so use Realtime to check new activity.",
        authorToolsTitle: "Article author tools · optional",
        authorToolsDescription: "This login unlocks annotation tools in this browser. It is separate from your Google account and is not needed to view analytics.",
        authorToolsUnlocked: "Author tools are unlocked in this browser.",
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
          "This is a personal academic homepage. This page describes its traffic analytics and external links.",
        analytics:
          "This site uses Google Analytics 4 to measure page views, traffic sources and site usage. Google’s tag may use cookies and similar identifiers to distinguish visits and sessions. You can limit collection through your browser privacy settings or ad-blocking tools.",
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
      insights: "行业思考",
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
        metadataTitle: "行业思考 · AI 基础设施与产业链 · 消费与平台",
        metadataDescription:
          "刘泓宇的行业思考：AI 基础设施与产业链、消费与平台市场，以及技术变化如何成为商业事实。",
        lead: "我专注于构建可信的语音与语言系统，研究方向涵盖主动交互、隐私评估，以及端到端语音对话智能。",
        currentFocusLabel: "当前关注：",
        readInsights: "阅读行业思考",
        downloadCv: "下载简历",
        roles: [
          "语音语言模型可信性",
          "面向主动对话的强化学习",
          "智能体语音智能",
          "端到端语音对话系统",
        ],
        insightsTitle: "行业思考",
        insightsCta: "打开行业思考",
        educationTitle: "教育经历",
        internshipTitle: "实习经历",
        researchTitle: "研究成果",
      },
      insights: {
        metadataTitle: "行业思考",
        metadataDescription:
          "刘泓宇 关于行业、公司和重要报道的思考与观察。",
        eyebrow: "行业思考",
        title: "行业思考",
        subtitle: "这里平常会写一些对行业的分析与判断。",
        publishedEyebrow: "已发布文章",
        publishedTitle: "近期思考与长文。",
        futureNote: "未来发布的文章可以接入 MDX，而无需改变这个页面结构。",
        backHome: "返回首页",
        footerLabel: "行业思考",
        articleLabel: "文章",
        readingLabel: "正文",
        annotations: {
          toggleOpen: "批注",
          toggleClose: "完成",
          hint: "点击已发布的批注或下划线即可隐藏，再点一次恢复。",
          hiddenTitle: "已隐藏的标记",
          hiddenEmpty: "当前没有隐藏任何标记。",
          localTitle: "我的标注",
          localEmpty: "还没有标注。在正文里选中文字就能添加。",
          underline: "划线",
          note: "加批注",
          notePlaceholder: "写点批注…",
          save: "保存",
          cancel: "取消",
          hide: "隐藏",
          restore: "恢复",
          restoreAll: "全部还原",
          delete: "删除",
          disableTools: "关闭批注工具",
          selectionFailed: "这段选区跨了格式块，换短一点再试。",
          hiddenPlaceholder: "已隐藏的批注 · 点击恢复",
          unlock: "登录后启用批注",
        },
        backToInsights: "返回行业思考",
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
          "旧的示例文章归档已经移除。新的长文、公司笔记和报道评论现在放在行业思考页面。",
        insightsLink: "前往行业思考",
      },
      sitemap: {
        title: "站点地图",
        pages: {
          home: "首页",
          publications: "论文发表",
          insights: "行业思考",
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
        analyticsFor: "david188888.github.io 的全站访问统计",
        trackingId: "衡量 ID",
        openDashboard: "打开 Google 看板 ↗",
        googleSignInNote: "使用有权访问 David Homepage 的 Google 账号查看私人报表，无需登录本网站。",
        coverageTitle: "所有页面，汇总到一起",
        coverageDescription: "首页、博客文章、项目、简历及其他中英文页面都使用同一个 GA4 媒体资源。访客直接进入任意文章也会记录，无需先经过首页。",
        viewsTitle: "浏览次数 · Views",
        viewsDescription: "每浏览一个页面记一次。从首页进入一篇文章，全站浏览次数增加两次。",
        usersTitle: "活跃用户 · Active users",
        usersDescription: "用于了解访问用户规模。GA4 跨页面识别用户，不能把各页面的用户数相加当成全站人数。",
        sessionsTitle: "访问次数 · Sessions",
        sessionsDescription: "一次访问可以浏览多个页面；同一个人再次回来，也可能产生新的会话。",
        readingTitle: "打开后怎么看",
        readingSteps: [
          "选择日期范围，将指标切换为“浏览次数（Views）”，查看全站总浏览量和变化趋势。",
          "打开“网页和屏幕（Pages and screens）”，查看各篇文章及其他页面的阅读情况。",
          "在“实时（Realtime）”中看近期访问，在“流量获取（Traffic acquisition）”中看访客来源。",
        ],
        dataNote: "统计从标签上线后开始，之前未记录的访问无法补回。常规报表有处理延迟，检查新访问时请先看“实时”。",
        authorToolsTitle: "文章作者工具 · 可选",
        authorToolsDescription: "此登录仅用于在当前浏览器开启文章批注工具，与 Google 账号无关。查看统计无需在这里登录。",
        authorToolsUnlocked: "当前浏览器已开启作者工具。",
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
        intro: "这是一个个人学术主页。本页说明网站访问统计与外部链接的使用。",
        analytics:
          "本站使用 Google Analytics 4 统计页面浏览、访问来源和站点使用情况。Google 标签可能使用 Cookie 等标识符区分访问及会话。你可以通过浏览器隐私设置或广告拦截工具限制采集。",
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
