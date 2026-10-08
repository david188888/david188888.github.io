import Link from "next/link";
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
    subtitle: "A local multi-agent research workbench for China A-shares",
    intro:
      "Turns company information, disclosures, financials and prices into reviewable research records. Built on TauricResearch/TradingAgents, it helps researchers identify key evidence, doubts and what to verify next across company research, catalyst research, holding review and batch research.",
    repository: "My repository ↗",
    upstream: "Upstream project ↗",
    demoLabel: "24-second project demo",
    caption:
      "The current Reader displays a saved 002130.SZ sample from 6 October 2026, recorded with the earlier V5 workflow. English narration and captions accompany the original Chinese interface; the sample retains partial / LOW_CONFIDENCE limitations.",
    attributionKicker: "Upstream and personal extension",
    attributionTitle: "From collaborative analysis to evidence-linked research.",
    attributionBody:
      "TauricResearch provides the open-source multi-agent foundation. This fork develops the A-share evidence kernel, specialist and challenge design, and local Web workbench described below. Some A-share data adapters were informed by Simon Lin's a-stock-data. The maintained Web flow uses a Python research runner; classic LangGraph workflows remain compatibility paths.",
    featuresTitle: "Architecture and Agent design",
    features: [
      {
        title: "A-share evidence chain",
        body: "Public company information, official disclosures, financials and prices retain their sources, timestamps and coverage limits, so judgments can be traced back to their inputs.",
      },
      {
        title: "Specialists, challenge and synthesis",
        body: "Operating, event and market specialists form hypotheses without reading one another's drafts. An independent challenger tests assumptions; synthesis combines evidence, doubts and next steps.",
      },
      {
        title: "Code-owned boundaries",
        body: "Code controls evidence admission, deterministic calculations, reference validation and persistence. Baseline research is saved independently before an optional focus response, which cannot rewrite its conclusions.",
      },
      {
        title: "A local, traceable workbench",
        body: "React and TypeScript present runs through a FastAPI and SSE backend on 127.0.0.1. Reader and Markdown share saved records; reading does not fetch new data or invoke models. Web is maintained; legacy CLI analysis is not.",
      },
    ],
    evidenceTitle: "Make the limits visible.",
    evidenceBody:
      "Public sources can be missing, rate-limited or unable to establish historical availability. A completed run may remain partial / LOW_CONFIDENCE. Passing evidence checks does not establish economic causes or fair value, and improved predictive accuracy has not been demonstrated.",
    note: "Research only. The system does not generate orders or target positions, is not investment advice, and does not promise investment returns.",
    backToProjects: "← Back to projects",
    footerNote: "Research and personal notes · © 2026",
  },
  zh: {
    kicker: "项目实践 / 开源框架扩展",
    title: "TradingAgents",
    subtitle: "面向中国 A 股的本地多 Agent 研究工作台",
    intro:
      "把公司资料、公告、财务与行情组织成可复核的研究记录。在 TauricResearch/TradingAgents 基础上，帮助研究者看清关键依据、主要疑点和下一步需要验证什么，支持公司研究、催化研究、持仓复盘与批量研究。",
    repository: "我的项目仓库 ↗",
    upstream: "上游项目 ↗",
    demoLabel: "24 秒项目演示",
    caption:
      "当前 Reader 展示一条 2026 年 10 月 6 日保存的 002130.SZ 样例，由此前的 V5 流程生成。英文旁白与字幕对应原始中文界面；样例保留 partial / LOW_CONFIDENCE 的限制。",
    attributionKicker: "上游与个人扩展",
    attributionTitle: "从协作分析，走向可追溯的证据研究。",
    attributionBody:
      "TauricResearch 提供多 Agent 开源基础。本 fork 在其上发展 A 股证据内核、专项与挑战设计，以及下述本地 Web 工作台。部分 A 股数据适配器参考了 Simon Lin 的 a-stock-data。当前维护的 Web 流程使用 Python 研究运行器，经典 LangGraph 流程保留为兼容路径。",
    featuresTitle: "整体架构与 Agent 设计",
    features: [
      {
        title: "A 股证据链",
        body: "整合公开公司资料、官方披露、财务与行情，保留来源、时点和覆盖限制，让研究判断可以追溯到输入材料。",
      },
      {
        title: "专项、挑战与综合",
        body: "经营、事件、市场专项独立形成假设，互不读取其它专项草稿。独立挑战角色检查假设，综合角色整理证据、疑点和下一步。",
      },
      {
        title: "代码拥有研究边界",
        body: "代码负责证据准入、确定性计算、引用校验与保存。基础研究先独立完成并保存，再按需回应用户关注点；补充回应不能改写基础结论。",
      },
      {
        title: "本地、可追溯的工作台",
        body: "React 与 TypeScript 界面通过 FastAPI 与 SSE 展示任务，服务仅绑定 127.0.0.1。Reader 与 Markdown 读取同一保存记录，阅读不重新取数或调用模型。持续维护 Web，旧版 CLI 分析不再维护。",
      },
    ],
    evidenceTitle: "让限制留在研究结果中。",
    evidenceBody:
      "公开来源可能缺失、限流或无法确认历史时点。运行完成可能仍是 partial / LOW_CONFIDENCE；证据核查通过不代表经济原因或合理价值已确定，也未证明预测准确率提升。",
    note: "项目仅用于研究，不生成订单或目标仓位，不构成投资建议，也不承诺投资收益。",
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
              poster={tradingAgentsProject.screenshot}
              aria-label={text.caption}
              aria-describedby="tradingagents-demo-caption"
            >
              <source src={tradingAgentsProject.demoVideo} type="video/mp4" />
              {text.caption}
            </video>
            <figcaption id="tradingagents-demo-caption">
              {text.caption} {locale === "zh" ? "音乐：" : "Music: "}
              <a href="https://ende.app/" target="_blank" rel="noopener noreferrer">Sascha Ende / Ende.app</a>
              {" · Happy Beats Business Moves Vol. 12."}
            </figcaption>
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
            <Link href={localizedHref("/#projects", locale)}>{text.backToProjects}</Link>
          </div>
          <p className="foot-note">{text.footerNote}</p>
        </footer>
      </div>
    </div>
  );
}
