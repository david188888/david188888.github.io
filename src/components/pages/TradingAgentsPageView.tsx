import "@/components/home/editorial.css";
import { EditorialMasthead } from "@/components/home/EditorialMasthead";
import { editorialThemeScript } from "@/components/home/editorialTheme";
import { tradingAgentsProject } from "@/config/projects";
import { localizedHref } from "@/i18n/links";
import { defaultLocale, type Locale } from "@/i18n/locales";

interface TradingAgentsPageViewProps {
  locale?: Locale;
}

const copy = {
  en: {
    kicker: "Project work / Extending an open-source framework",
    title: "TradingAgents",
    subtitle: "A multi-agent research workspace for the A-share market",
    intro:
      "Built on TauricResearch/TradingAgents, extended for A-share research with additional data sources, evidence-quality checks, and a research workspace. The goal is not only to produce a report, but to keep the reasoning, disagreement, and uncertainty inspectable.",
    repository: "My repository ↗",
    upstream: "Upstream project ↗",
    demoLabel: "Project demo",
    caption:
      "A completed 002335.SZ research-only sample. English annotations guide the original Chinese interface; figures shown are illustrative research outputs, not investment advice.",
    attributionKicker: "Upstream and personal extension",
    attributionTitle: "Keep the collaborative analysis, add the research process.",
    attributionBody:
      "Upstream provides a multi-agent framework of analysts, bull and bear researchers, and trading and risk roles. This project keeps that open-source foundation, turns the default flow toward research, and adds a data and interaction layer for the A-share market. The extensions below belong to the fork; the upstream architecture is credited as upstream.",
    featuresTitle: "Main extensions",
    features: [
      {
        title: "A-share data access",
        body: "Connects exchange quotes, fundamentals, and other market sources so analysis starts from inputs that match the local market rather than a generic feed.",
      },
      {
        title: "Evidence quality checks",
        body: "An evidence steward checks reliability and cross-source agreement, separating pass, low-confidence, and stop states so thin material becomes an explicit part of the research result.",
      },
      {
        title: "Local web workspace",
        body: "A local React and TypeScript interface with a FastAPI and SSE backend organises batch runs, live progress, and layered reading of the analysis.",
      },
      {
        title: "Research-oriented flow",
        body: "Connects analysts, the bull-bear debate, and research synthesis into company research and holding review. It does not emit orders, position sizes, or buy and sell instructions by default.",
      },
    ],
    evidenceTitle: "Insufficient evidence is a result too.",
    evidenceBody:
      "In the screenshot the valuation module does not force a price view; it lists why the historical sample is too short and peer valuation observations are unavailable. Fact entries carry their sources. Known and unknown sit in the same workspace.",
    note: "Continuously extended and maintained on top of TauricResearch/TradingAgents. The project is for research only, is not investment advice, and does not present or promise investment returns.",
    backToProjects: "← Back to projects",
    footerNote: "Research and personal notes · © 2026",
  },
  zh: {
    kicker: "项目实践 / 开源框架扩展",
    title: "TradingAgents",
    subtitle: "面向 A 股研究的多智能体工作台",
    intro:
      "在 TauricResearch/TradingAgents 的多智能体金融分析框架基础上，扩展 A 股数据接入、证据质量检查和研究工作台。重点不只是生成一份报告，而是让分析依据、分歧和不确定性可以被查看与追溯。",
    repository: "我的项目仓库 ↗",
    upstream: "上游项目 ↗",
    demoLabel: "项目演示",
    caption:
      "一条已完成的 002335.SZ 研究样例。英文导读对应原始中文界面；视频中的数值仅为研究样例，不构成投资建议。",
    attributionKicker: "上游与个人扩展",
    attributionTitle: "保留协作分析，补上研究流程。",
    attributionBody:
      "上游提供由分析师、多空研究员及交易与风险角色组成的多智能体框架。本项目沿用其开源基础，将默认流程调整为研究导向，并围绕 A 股场景补充数据和交互层。以下为 fork 中的扩展，不将上游架构列为个人原创。",
    featuresTitle: "主要扩展",
    features: [
      {
        title: "A 股数据接入",
        body: "接入行情、基本面及其他市场数据来源，让分析从贴近本地市场的输入开始，而不是依赖通用数据源。",
      },
      {
        title: "证据质量检查",
        body: "由 Evidence Steward 检查可信度与跨来源一致性，区分通过、低置信度和停止分析三种状态，让材料不足显式进入研究结果。",
      },
      {
        title: "本地 Web 工作台",
        body: "以 React 与 TypeScript 构建本地界面，后端使用 FastAPI 与 SSE，组织批量任务、实时进度和分层阅读。",
      },
      {
        title: "研究型流程",
        body: "将分析师、多空辩论与研究汇总连接为公司研究与持仓复核流程。默认不输出订单、仓位或买卖指令。",
      },
    ],
    evidenceTitle: "证据不足，也是研究结果。",
    evidenceBody:
      "截图中的估值模块没有强行给出价格判断，而是列出历史样本不足、同行估值观测不可用等原因。事实条目则展示来源与引用入口。已知与未知放在同一个工作界面中。",
    note: "基于 TauricResearch/TradingAgents 持续扩展与维护。项目仅用于研究，不构成投资建议，也不展示或承诺投资收益。",
    backToProjects: "← 返回项目与开源",
    footerNote: "研究与个人笔记 · © 2026",
  },
} satisfies Record<Locale, {
  kicker: string;
  title: string;
  subtitle: string;
  intro: string;
  repository: string;
  upstream: string;
  demoLabel: string;
  caption: string;
  attributionKicker: string;
  attributionTitle: string;
  attributionBody: string;
  featuresTitle: string;
  features: readonly { title: string; body: string }[];
  evidenceTitle: string;
  evidenceBody: string;
  note: string;
  backToProjects: string;
  footerNote: string;
}>;

export function TradingAgentsPageView({ locale = defaultLocale }: TradingAgentsPageViewProps) {
  const text = copy[locale];

  return (
    <div className="ed-root">
      <script dangerouslySetInnerHTML={{ __html: editorialThemeScript }} />
      <div className="ed-site">
        <EditorialMasthead locale={locale} variant="project" />
        <main>
          <header className="detail-hero">
            <p className="project-kicker">{text.kicker}</p>
            <h1>{text.title}</h1>
            <h2>{text.subtitle}</h2>
            <p className="detail-intro">{text.intro}</p>
            <div className="project-actions">
              <a href={tradingAgentsProject.repositoryUrl} target="_blank" rel="noopener noreferrer">
                {text.repository}
              </a>
              <a href={tradingAgentsProject.upstreamUrl} target="_blank" rel="noopener noreferrer">
                {text.upstream}
              </a>
            </div>
          </header>
          <figure className="project-image detail-image project-demo">
            <p className="project-kicker">{text.demoLabel}</p>
            <video
              controls
              playsInline
              preload="metadata"
              poster="/images/tradingagents-demo-poster.jpg"
              aria-label={text.caption}
              aria-describedby="tradingagents-demo-caption"
            >
              <source src="/videos/tradingagents-demo.mp4" type="video/mp4" />
              {text.caption}
            </video>
            <figcaption id="tradingagents-demo-caption">{text.caption}</figcaption>
          </figure>
          <div className="detail-content">
            <section className="detail-section">
              <p className="project-kicker">{text.attributionKicker}</p>
              <h2>{text.attributionTitle}</h2>
              <p>{text.attributionBody}</p>
            </section>
            <section className="detail-section">
              <h2>{text.featuresTitle}</h2>
              <div className="detail-features">
                {text.features.map((feature) => (
                  <article key={feature.title}>
                    <h3>{feature.title}</h3>
                    <p>{feature.body}</p>
                  </article>
                ))}
              </div>
            </section>
            <section className="detail-section">
              <h2>{text.evidenceTitle}</h2>
              <p>{text.evidenceBody}</p>
            </section>
            <p className="detail-note">{text.note}</p>
          </div>
        </main>
        <footer className="foot">
          <div>
            <a href={localizedHref("/#projects", locale)}>{text.backToProjects}</a>
          </div>
          <p className="foot-note">{text.footerNote}</p>
        </footer>
      </div>
    </div>
  );
}
