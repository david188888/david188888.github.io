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

const upstreamGraphUrl =
  "https://github.com/TauricResearch/TradingAgents/blob/1394a3f72aa4393e1a98f51b382434c4b4c2d972/tradingagents/graph/setup.py";
const researchArchitectureUrl =
  "https://github.com/david188888/TradingAgents/blob/main/ARCHITECTURE.md";

const copy = {
  en: {
    kicker: "Project work / Extending an open-source framework",
    title: "TradingAgents",
    subtitle: "A multi-agent workbench for China A-share company research",
    intro:
      "Researching a company means weighing its financial performance, business changes, disclosures and market pricing together. TradingAgents brings those materials into a research record: what has changed, what supports the judgement, which explanations need checking, and what to investigate next. It supports company research, catalyst analysis and reviews of holding theses.",
    repository: "My repository ↗",
    upstream: "Upstream project ↗",
    demoLabel: "24-second project demo",
    caption:
      "The current Reader displays a saved 002130.SZ sample from 6 October 2026, recorded with the earlier V5 workflow. English narration and captions accompany the original Chinese interface; the sample retains partial / LOW_CONFIDENCE limitations.",
    architectureKicker: "Upstream and personal extension",
    architectureTitle: "Organising agents like a research team",
    upstreamTitle: "The foundation: LangGraph and multi-agent collaboration",
    upstreamParagraphs: [
      "TauricResearch/TradingAgents models the division of work in a research and trading team. Fundamentals, news, sentiment and technical analysts use their own tools to produce reports. Bull and bear researchers debate those reports; a research manager consolidates their arguments before handing off to a trader, a risk discussion team and a portfolio manager.",
      "LangGraph organises those roles, tools and handoffs into a stateful workflow. Agents and tools are nodes, and the connections define how information moves: analysts can work in parallel, research debate begins once their reports are in, and the debaters alternate for a configured number of rounds before a manager consolidates the result. Shared state stores reports, debate history and stage outputs in separate fields for later roles to read.",
    ],
    upstreamFlowLabel: "Upstream collaboration",
    upstreamFlow: ["Specialist analysis", "Bull / bear debate", "Research manager", "Trader", "Risk discussion", "Portfolio manager"],
    upstreamSource: "View the LangGraph implementation ↗",
    extensionTitle: "My extension: hypotheses, challenges and checks for A-shares",
    extensionIntro:
      "Building on that multi-agent foundation, I organised A-share research around five roles, making each judgement's evidence and the conditions that could change it explicit.",
    roleHeading: "Agent role",
    responsibilityHeading: "Research responsibility",
    roles: [
      { title: "Operating", body: "Examines financial and operating evidence, with valuation context, to assess business quality and valuation positioning." },
      { title: "Events", body: "Studies disclosures and significant events to propose catalysts, delivery conditions and conditions that would invalidate them." },
      { title: "Market", body: "Examines price behaviour and quantitative risk context, contributing market observations and alternative explanations." },
      { title: "Challenge", body: "Reviews the specialists' hypotheses for counterevidence, missing support and other possible explanations." },
      { title: "Synthesis", body: "Combines specialist proposals, challenges and executed checks into judgements by dimension, key evidence, the main doubts and the next research step." },
    ],
    collaborationParagraphs: [
      "The three specialists receive their own views of the materials saved for the same study. They do not read one another's drafts: each forms hypotheses first, then a challenger reviews them. Every hypothesis must link to supporting facts and state its assumptions and invalidation conditions.",
      "Code handles source admission, reference validation and checks of computable conditions. For example, it checks company identity, dates and units, and reconciles same-period profit and operating cash-flow disclosures. Agents interpret what those materials support and which alternative explanations still need investigation.",
    ],
    researchFlowLabel: "This project's research workflow",
    researchFlow: ["Validate and save sources", "Operating / events / market", "Independent challenge", "Programmatic checks", "Synthesis", "Research record"],
    runnerNote:
      "The current Web research workflow is orchestrated directly by a dedicated Python runner; the classic LangGraph workflow remains in the project.",
    architectureSource: "View this project's research architecture ↗",
    exampleTitle: "From a thematic connection to business evidence",
    exampleIntro:
      "The historical sample in the video examines Woer Heat-Shrinkable Material (002130.SZ) and its connection to the AI supply chain, as of 6 October 2026. The saved record turns a broad industry narrative into three questions for further investigation.",
    findings: [
      { title: "What do the saved materials establish?", body: "Consolidated financial data, disclosure titles, prices and valuation context support observations about company totals and market positioning." },
      { title: "What remains unconfirmed?", body: "Those materials do not establish the share of revenue, customers or orders tied to AI. Insufficient evidence also does not establish that the business connection is absent." },
      { title: "What should be checked next?", body: "Examine product and customer breakdowns, full disclosures and the use of project funds to distinguish direct supply, indirect benefits and ordinary capacity expansion." },
    ],
    readerBody:
      "In the Reader, a judgement links to its supporting facts and saved sources. Specialist outputs and challenge comments remain available alongside it. Keeping judgements, evidence and open questions together gives researchers a starting point for further due diligence.",
    attributionPrefix: "Some A-share data adapters were informed by ",
    attributionSuffix: ".",
    note: "Research only; not investment advice.",
    backToProjects: "← Back to projects",
    footerNote: "Research and personal notes · © 2026",
  },
  zh: {
    kicker: "项目实践 / 开源框架扩展",
    title: "TradingAgents",
    subtitle: "面向 A 股公司研究的多 Agent 工作台",
    intro:
      "研究一家公司，需要把财务表现、业务变化、重要公告和市场定价放在一起判断。TradingAgents 将这些资料组织成一份研究记录：公司有哪些值得关注的变化，判断依据是什么，哪些解释仍需核查，以及下一步应该查什么。支持公司研究、催化因素分析与持仓假设复核。",
    repository: "我的项目仓库 ↗",
    upstream: "上游项目 ↗",
    demoLabel: "24 秒项目演示",
    caption:
      "当前 Reader 展示一条 2026 年 10 月 6 日保存的 002130.SZ 样例，由此前的 V5 流程生成。英文旁白与字幕对应原始中文界面；样例保留 partial / LOW_CONFIDENCE 的限制。",
    architectureKicker: "上游与个人扩展",
    architectureTitle: "把投研团队的分工写进 Agent 架构",
    upstreamTitle: "架构起点：LangGraph 与多 Agent 协作",
    upstreamParagraphs: [
      "上游 TauricResearch/TradingAgents 参照投研与交易团队的分工设计 Agent：基本面、新闻、情绪和技术分析师分别使用各自的工具形成报告；看多与看空研究员围绕报告交叉辩论，由研究经理汇总，再交给交易员、风险讨论团队与组合经理。",
      "LangGraph 将这些角色、工具和交接关系组织成有状态的工作流。Agent 与工具是流程节点，节点之间的连接决定信息如何流转：分析师可以分别执行，报告齐备后进入研究辩论；辩论按设定轮次交替进行，再交由管理角色汇总。共享状态按字段保存各类报告、讨论历史和阶段结果，后续角色据此继续工作。",
    ],
    upstreamFlowLabel: "上游协作主线",
    upstreamFlow: ["专业分析", "多空辩论", "研究经理", "交易员", "风险讨论", "组合经理"],
    upstreamSource: "查看 LangGraph 编排实现 ↗",
    extensionTitle: "我的扩展：围绕 A 股研究组织假设、挑战与核查",
    extensionIntro:
      "我在这一多 Agent 基础上，将 A 股研究组织为五类角色，重点解释判断如何形成、有哪些依据，以及什么条件会改变判断。",
    roleHeading: "Agent 角色",
    responsibilityHeading: "研究职责",
    roles: [
      { title: "经营", body: "分析财务与经营资料，结合估值材料提出经营质量与估值定位的判断。" },
      { title: "事件", body: "研究公告和重要事件，提出潜在催化、兑现条件与失效条件。" },
      { title: "市场", body: "分析价格表现和量化风险背景，提供市场侧的观察与替代解释。" },
      { title: "挑战", body: "阅读专项提出的假设，寻找反证、证据缺口和其他可能的解释。" },
      { title: "综合", body: "结合专项、挑战与核查结果，形成分维度判断、关键依据、主要疑点和下一步查证方向。" },
    ],
    collaborationParagraphs: [
      "三个专项 Agent 使用同一次研究中保存的对应材料，互不读取其他专项的草稿，先分别形成假设，再交给挑战角色审查。每项假设需要关联支持事实，并写明成立条件和失效条件。",
      "程序承担资料准入、引用校验与可计算条件的核查。例如，校验数据所属公司、日期与单位，核对同期间利润和经营现金流的披露关系；Agent 负责解释这些材料支持什么判断，以及还有哪些替代解释需要研究。",
    ],
    researchFlowLabel: "本项目研究主线",
    researchFlow: ["资料校验与保存", "经营／事件／市场专项", "独立挑战", "程序核查", "综合判断", "研究记录"],
    runnerNote:
      "当前 Web 的上述研究流程由专用 Python 运行器直接编排；经典 LangGraph 流程仍保留在项目中。",
    architectureSource: "查看本项目研究架构 ↗",
    exampleTitle: "从“概念关联”追问到业务依据",
    exampleIntro:
      "视频中的历史样例研究了沃尔核材（002130.SZ）与 AI 产业链的业务关联，研究截点为 2026 年 10 月 6 日。保存的记录把一个宽泛的行业叙事拆成了三个可以继续核查的问题。",
    findings: [
      { title: "已有材料能说明什么？", body: "合并财务数据、公告标题、行情与估值背景，可以支持总量和市场层面的观察。" },
      { title: "还不能确认什么？", body: "这些材料不足以确认 AI 相关业务的收入、客户或订单占比；材料不足也不能直接证明关联不存在。" },
      { title: "下一步查什么？", body: "查看产品与客户拆分、相关公告正文和项目资金用途，区分直接供货、间接受益与一般扩产。" },
    ],
    readerBody:
      "在阅读界面中，可以从研究判断查看关联事实与保存来源，也可以回看各 Agent 的专项产物和挑战意见。研究记录将判断、依据和待查问题放在一起，为后续尽调提供入口。",
    attributionPrefix: "部分 A 股数据适配参考 ",
    attributionSuffix: "。",
    note: "项目仅用于研究，不构成投资建议。",
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
  architectureKicker: string;
  architectureTitle: string;
  upstreamTitle: string;
  upstreamParagraphs: readonly string[];
  upstreamFlowLabel: string;
  upstreamFlow: readonly string[];
  upstreamSource: string;
  extensionTitle: string;
  extensionIntro: string;
  roleHeading: string;
  responsibilityHeading: string;
  roles: readonly { title: string; body: string }[];
  collaborationParagraphs: readonly string[];
  researchFlowLabel: string;
  researchFlow: readonly string[];
  runnerNote: string;
  architectureSource: string;
  exampleTitle: string;
  exampleIntro: string;
  findings: readonly { title: string; body: string }[];
  readerBody: string;
  attributionPrefix: string;
  attributionSuffix: string;
  note: string;
  backToProjects: string;
  footerNote: string;
}>;

function CollaborationFlow({ id, label, steps }: {
  id: string;
  label: string;
  steps: readonly string[];
}) {
  return (
    <div className="ta-flow">
      <p id={`${id}-label`} className="ta-flow-label">{label}</p>
      <ol aria-labelledby={`${id}-label`} className="ta-flow-steps">
        {steps.map((step) => <li key={step}>{step}</li>)}
      </ol>
    </div>
  );
}

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
          <div className="detail-content ta-detail">
            <section className="detail-section">
              <p className="project-kicker">{text.architectureKicker}</p>
              <h2>{text.architectureTitle}</h2>
              <h3 className="ta-subheading">{text.upstreamTitle}</h3>
              {text.upstreamParagraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              <CollaborationFlow id="upstream-flow" label={text.upstreamFlowLabel} steps={text.upstreamFlow} />
              <p className="ta-source-link">
                <a href={upstreamGraphUrl} target="_blank" rel="noopener noreferrer">{text.upstreamSource}</a>
              </p>
            </section>
            <section className="detail-section">
              <h2>{text.extensionTitle}</h2>
              <p>{text.extensionIntro}</p>
              <table className="ta-role-table">
                <thead>
                  <tr>
                    <th scope="col">{text.roleHeading}</th>
                    <th scope="col">{text.responsibilityHeading}</th>
                  </tr>
                </thead>
                <tbody>
                  {text.roles.map((role) => (
                    <tr key={role.title}>
                      <th scope="row">{role.title}</th>
                      <td>{role.body}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {text.collaborationParagraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              <CollaborationFlow id="research-flow" label={text.researchFlowLabel} steps={text.researchFlow} />
              <p>{text.runnerNote}</p>
              <p className="ta-source-link">
                <a href={researchArchitectureUrl} target="_blank" rel="noopener noreferrer">{text.architectureSource}</a>
              </p>
            </section>
            <section className="detail-section">
              <h2>{text.exampleTitle}</h2>
              <p>{text.exampleIntro}</p>
              <dl className="ta-example-list">
                {text.findings.map((finding) => (
                  <div key={finding.title}>
                    <dt>{finding.title}</dt>
                    <dd>{finding.body}</dd>
                  </div>
                ))}
              </dl>
              <p>{text.readerBody}</p>
            </section>
            <div className="detail-note ta-attribution">
              <p>
                {text.attributionPrefix}
                <a href="https://github.com/simonlin1212/a-stock-data" target="_blank" rel="noopener noreferrer">Simon Lin / a-stock-data</a>
                {text.attributionSuffix}
              </p>
              <p>{text.note}</p>
            </div>
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
