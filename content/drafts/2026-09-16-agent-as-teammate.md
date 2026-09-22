---
title: "Agent 成为同事之后"
date: "2026-09-16"
language: zh
permalink: "/posts/2026/09/agent-as-teammate/"
tags:
  - AI
  - Enterprise
  - Strategy
---

## 交接正在换一种方式发生

我在一家公司实习的那几个月，看着一件事慢慢换了样子。需求由产品那边提出来，交给 Agent 整理成一份结构化文件，写清目标、范围、约束、要交付的产物和验收标准。工程师接到以后，多数时候跟自己的 Agent 一起把功能做出来，调试和改错在同一轮里走完。测试标准提前定好，Agent 跑完把报告贴回来。代码提交上来，第一轮审的经常也是 Agent。运维的一部分日常动作挂在协作机器人的定时任务上，出异常才叫人。

唯一还大量占人时间的活是模型训练。周期长，结果不确定，中间要不要调数据、调参数、重跑，这些判断到现在还得人盯着。

这些细节单独看都不新鲜，coding agent 能写代码这件事已经讲了两三年。让我在意的是中间那一层。以前一个需求要走完，产品把话讲给开发，开发把东西交给测试，测试把结论回给产品，每次交接都要人重新说一遍上下文，说岔了还要来回掰扯。现在这些交接正在被一份份结构化文件接住。交接方式已经变了，岗位会不会变少要更久才看得出结果。

## 同一个季度，三家给出同一个答案

2026 年这个季度，三家公司先后交出了答案。Anthropic 在 6 月 23 日发布 Claude Tag，把它做进 Slack。SpaceXAI 在 8 月 11 日开放 Grok Bot 公测，给每个用户在云端开一台常驻电脑，企业版在 9 月 3 日上线。飞书在 8 月 14 日把原来的 Aily 更名为豆包工作伙伴，又在 9 月 15 日的发布会上把 Agent 能力集中亮了一遍，飞书 8.0 随之发布。

同时动作的不止这三家。Salesforce 三月底给 Slackbot 加了三十多项能力，OpenAI 四月推出 Workspace Agents，Google 同一天发布 Gemini Enterprise Agent Platform。产品形态在同一个方向上收敛了。

这个形态的共同点里，常驻和公开比较直观。它们不再等你在对话框里问一句答一句，任务可以跨几小时甚至几天；它们被放进团队看得见的地方，Slack 频道或者飞书群聊，一个人派活，整个过程大家都看得到。

第三条容易被忽略。这些 Agent 开始有自己的身份，不再借用某个人的登录状态，可以有独立的凭据和访问范围。前两条决定它能做什么，这一条决定企业敢不敢让它做。

==blue|三条放在一起看，企业的交互单位变了。以前是一个人和另一个人的对话，现在是一个团队和一个 Agent 对象之间的协作。==

门槛为什么在这个时候跨过去，有两件事凑到了一起。一件是协作平台的接口成熟度上来了。飞书这次把 Agent 可调用的系统接口从 247 个扩到 767 个，调用成功率从 78% 提到 95%，执行速度提升 39%，Agent 不必再靠看屏幕点鼠标来操作办公软件。另一件是权限和审计变成了可配置的东西，管理员可以给 Agent 单独配权限包、设用量上限、查它调用了哪些接口。没有这两件事，"Agent 当同事"只能停在演示里。

## 三款产品，三种身份设计

三款产品要解决的是同一件事，做法分成了三条路。差别落在一个很小的技术选择上，Agent 的身份和凭据挂在谁名下。

以下内容取自厂商的官方发布材料和帮助文档。哪些是厂商自述、哪些还没公开，我分开写。

**Grok Bot 让 Bot 作为登录成员行动**

Grok Bot 给每个用户账户在云端开一台常驻的电脑，浏览器、终端、文件系统都在里面，人把电脑关掉任务照跑。同一个账户下可以建好几只 Bot，分工去找资料、做分析、排版出图。

隔离单位是用户，不是 Bot。官方安全文档写得很直接，Bot 界面只是不同的工作面，不构成安全边界，不要往上面放不希望被同账户其他 Bot 看到的东西。文件系统、环境变量、浏览器里登录着的会话都通着。企业做威胁建模时应该按每人一台电脑来算，按每个 Agent 一个沙箱来算会得到错误的隔离假设。

Bot 本身没有自己的凭据，它作为登录成员行动，权限不超出这个人。好处是权限模型简单，不必为机器身份再走一套开通流程；代价是这个人的权限有多大，Agent 的破坏半径就有多大。

Grok Bot 不绑定某个固定模型。官方说明模型由 Cursor 侧管理，用户没有模型选择器，实际的服务组合会变化，所以它不等于某个模型套一层 Bot 界面。

**Claude Tag 让 Agent 拥有自己的身份**

Claude Tag 先在 Slack 上跑。频道里任何人都能 @Claude 派活，它把任务拆成阶段，用被授权的工具做，结果回到同一个 thread。同一个频道共享同一个 Claude 和同一份工作状态，Anthropic 把它叫做 multiplayer。

它最关键的设计是 Agent Identity。管理员给 Claude 配独立的服务凭据，不同频道可以挂不同的工具和读取范围，凭据的使用会被记录下来。这跟 Grok Bot 是两种相反的安全哲学。Grok 让 Agent 以人的身份行动，Claude 让 Agent 以机器的身份行动。前者省事，后者才能把机器身份的最小权限做实。

代价落在权限粒度上。凭据属于 Agent，调用权归频道。一个有仓库写入权的访问包挂上去以后，频道里任何一个成员都能绕开自己的权限，让 Agent 去读他本人读不到的东西。Tenable 在分析这套访问模型时把这一点直接点了出来，它偏离了以人为粒度的最小特权原则。另外它按用量计费，虽然组织和频道两级都能设上限，主动性带来的开销仍然是企业要单独管的变量。

**豆包工作伙伴把 Agent 放进已有的工作空间**

豆包工作伙伴从 Aily 更名而来，能像同事一样被加进群聊，读文档、多维表格、会议、日历和审批，操作走飞书的底层接口。

它的身份模型跟前两家都不一样。企业知识的检索请求按当前用户身份鉴权，在原有权限范围内取交集，员工看不到的数据 Agent 同样拿不到，检索范围由管理员配置。至于它是否拥有独立的机器身份，公开资料还没有说清。

两处代价。一处是生态边界，这套能力长在飞书的接口拓扑和权限体系上，主干业务跑在别的系统里的公司拿不到同等收益，迁移成本也不低。另一处是执行架构里那条从云端通向员工本机、用来碰内网数据的受控隧道。数据不出内网是好处，反过来看，内网终端的执行环境开始接受云端的远程调度，这条通道值得单独做安全评估。

**执行方式有两种，代价不一样**

把三款产品放在一起看，还有一个分歧更靠底层，Agent 用什么样的方式去操作外部系统。

一条路是结构化调用。目标系统提供接口，Agent 通过 MCP 或 API 直接读写数据，参数和返回值都是强类型的。另一条路是计算机操控。Agent 打开浏览器或桌面软件，靠看屏幕、点按钮、填表单来完成同样的动作。

差别落在三个地方。准确率上，结构化调用只可能因为参数错、权限错而失败，计算机操控还要加上页面改版、反爬风控、验证码和两步验证这些与任务本身无关的失败，遇到登录和支付这类步骤，几家都设计成交回给人。token 消耗上，结构化调用一次请求通常只有几百个 token 的参数和结果，计算机操控要把每一步的屏幕内容和操作历史留在上下文里，长流程会反复携带这些内容，同一个任务的开销可以差出一个量级。服务端压力上，计算机操控的每一次点击都要经过一次模型推理，任务越长，并发请求越多，云端承担的是持续的推理负载，而不只是几次数据读写。

这个比较没有一边倒的答案。目标系统有干净接口的时候，结构化调用在速度、成本、准确率上都更好，没有理由绕远路。计算机操控的价值在那上百个没有接口、或者接口写得很难用的老系统上，这也是 Grok Bot 把没有任何 API 也能工作当成卖点的原因。

需要说明的是，三家都没有公开单位任务的成本或端到端延迟。上面的比较只能看方向，具体差多少要企业在自己的流程里量。

**三家共同的缺口**

把三家的记忆放在一起看，缺口是同一个。Grok Bot 的记忆挂在 Bot 上，Claude Tag 挂在频道上，豆包挂在用户权限范围内，边界都画得出来，但没有一家解决了判断某条记录什么时候失效。一个频道里三个月前定下的方案今天还该不该被当作依据，模型自己看不出来。它只会因为那条讨论还在上下文里，就继续拿它做推理。Anthropic 允许管理员查看和删除记忆，这一步仍然要人来判断。

<figure class="supply-chain-diagram">
  <div class="supply-chain-diagram-scroll">
    <svg
      aria-labelledby="agent-identity-diagram-title agent-identity-diagram-description"
      class="supply-chain-diagram-svg"
      role="img"
      viewBox="0 0 1120 600"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title id="agent-identity-diagram-title">三种 Agent 身份设计的对比</title>
      <desc id="agent-identity-diagram-description">
        按身份挂在哪、协作的载体、记忆的边界、被打破的安全假设四个维度，对比 Grok Bot、Claude Tag 与豆包工作伙伴的系统设计差异。
      </desc>

      <text class="supply-chain-heading" x="60" y="52">三种 Agent 身份，挂在不同名下</text>
      <text class="supply-chain-subheading" x="60" y="80">同一个产品形态，四种设计后果</text>

      <g class="supply-chain-node">
        <text x="400" y="126">Grok Bot</text>
      </g>
      <g class="supply-chain-node">
        <text x="665" y="126">Claude Tag</text>
      </g>
      <g class="supply-chain-node">
        <text x="930" y="126">豆包工作伙伴</text>
      </g>

      <g class="supply-chain-node">
        <text x="160" y="186">身份挂在哪</text>
      </g>
      <g class="supply-chain-node">
        <rect height="88" rx="14" width="250" x="275" y="140" />
        <text class="supply-chain-node-small" x="400" y="185">个人账户</text>
        <text class="supply-chain-node-small" x="400" y="207">Bot 本身没有凭据</text>
      </g>
      <g class="supply-chain-node">
        <rect height="88" rx="14" width="250" x="540" y="140" />
        <text class="supply-chain-node-small" x="665" y="185">频道，独立服务身份</text>
        <text class="supply-chain-node-small" x="665" y="207">凭据归 Agent 自己</text>
      </g>
      <g class="supply-chain-node">
        <rect height="88" rx="14" width="250" x="805" y="140" />
        <text class="supply-chain-node-small" x="930" y="185">组织架构与用户权限</text>
        <text class="supply-chain-node-small" x="930" y="207">按当前用户鉴权</text>
      </g>

      <g class="supply-chain-node">
        <text x="160" y="286">协作的载体</text>
      </g>
      <g class="supply-chain-node">
        <rect height="88" rx="14" width="250" x="275" y="240" />
        <text class="supply-chain-node-small" x="400" y="290">同一台共享云电脑</text>
      </g>
      <g class="supply-chain-node">
        <rect height="88" rx="14" width="250" x="540" y="240" />
        <text class="supply-chain-node-small" x="665" y="290">Slack 公开线程</text>
      </g>
      <g class="supply-chain-node">
        <rect height="88" rx="14" width="250" x="805" y="240" />
        <text class="supply-chain-node-small" x="930" y="290">群聊与多维表格</text>
      </g>

      <g class="supply-chain-node">
        <text x="160" y="386">记忆的边界</text>
      </g>
      <g class="supply-chain-node">
        <rect height="88" rx="14" width="250" x="275" y="340" />
        <text class="supply-chain-node-small" x="400" y="390">账户级，Bot 各存一份</text>
      </g>
      <g class="supply-chain-node">
        <rect height="88" rx="14" width="250" x="540" y="340" />
        <text class="supply-chain-node-small" x="665" y="390">频道级，跨频道不共享</text>
      </g>
      <g class="supply-chain-node">
        <rect height="88" rx="14" width="250" x="805" y="340" />
        <text class="supply-chain-node-small" x="930" y="390">用户权限范围内</text>
      </g>

      <g class="supply-chain-risk-node">
        <text x="160" y="492">被打破的假设</text>
      </g>
      <g class="supply-chain-risk-node">
        <rect height="104" rx="14" width="250" x="275" y="440" />
        <text class="supply-chain-node-small" x="400" y="482">Bot 之间可以隔离</text>
        <text class="supply-chain-node-small" x="400" y="508">同账户共享文件与登录态</text>
      </g>
      <g class="supply-chain-risk-node">
        <rect height="104" rx="14" width="250" x="540" y="440" />
        <text class="supply-chain-node-small" x="665" y="482">权限跟着人走</text>
        <text class="supply-chain-node-small" x="665" y="508">凭据归 Agent，调用权归频道</text>
      </g>
      <g class="supply-chain-risk-node">
        <rect height="104" rx="14" width="250" x="805" y="440" />
        <text class="supply-chain-node-small" x="930" y="482">数据不出内网就安全</text>
        <text class="supply-chain-node-small" x="930" y="508">内网终端接受云端调度</text>
      </g>

      <text class="supply-chain-subheading" x="60" y="582">三家分别在解决发现、权限和协作的问题，判断某条记忆何时失效这一项，至今没有答案。</text>
    </svg>
  </div>
  <figcaption>
    三款产品都把 Agent 做成了团队里的常驻成员，分歧在身份挂在账户、频道还是组织权限上。身份落点决定了协作有多顺、记忆能传多远，也决定了它们各自打破哪一条原有的安全假设。
  </figcaption>
</figure>

## 被替换的是三类动作

把企业里每天发生的事拆开看，大部分落在三类动作上。一类是信息交接，一个人把自己知道的事整理成另一个人能用的形式。一类是执行，把决定变成实际的改动。第三类最难，是验证，先要回答什么叫改对了。

这三类里，执行最容易被观察到，所以先被自动化。信息交接藏在人和人的对话里，过去没有载体可以承载，现在结构化文件把它接住了。验证落在最后，因为要先把标准定义出来，后面才有得比。

这也是任务契约值得单独讲的原因。Product Agent 不会给 Dev Agent 发一句"帮我优化一下验证码"，而是整理成一份机器可读的清单。

```text
Task ID: #4821

Goal:
降低验证码步骤流失率

Target:
注册完成率 +5%

Scope:
修改验证码交互

Constraints:
不能修改风控逻辑

Artifacts:
PRD #813 / Figma #721 / Analytics #331

Acceptance Criteria:
1. 手机号输入错误有明确提示
2. 验证码 60 秒重发
3. 网络错误支持重试
4. 埋点完整

Permission:
允许修改 frontend/signup
禁止修改 risk-engine

Verifier:
QA-Agent-12

Owner:
Dev-Agent-7
```

开发 Agent 收到这份契约以后开始做，回来的东西也用同一套格式。

```text
Task #4821

status:
ready_for_validation

artifact:
PR #9231

changes:
...

tests:
...

risk_level:
low
```

字段本身说明了三件事。目标要能被度量，否则后面无法验证。权限要写进任务里，否则 Agent 要么不敢动手，要么乱动手。验证方要单独指定，最好不是执行方。回来的那一份还要带证据，测试结果和风险等级都在里面。

==blue|整套约定最后收敛成七个东西，Goal、Task、State、Artifact、Permission、Evidence、Evaluation。== 前四个定义做什么、做到哪一步了，后三个定义谁能动它、凭什么相信它、以及做好了没有。

把这七个东西放进组织里，形态就出来了。

<figure class="supply-chain-diagram">
  <div class="supply-chain-diagram-scroll">
    <svg
      aria-labelledby="agent-org-topology-title agent-org-topology-description"
      class="supply-chain-diagram-svg"
      role="img"
      viewBox="0 0 1120 620"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title id="agent-org-topology-title">人加 Agent 的组织形态</title>
      <desc id="agent-org-topology-description">
        业务目标与共享工作区位于上层，中间是产品、工程、商务三个角色各自的 Agent，它们接入同一个 Agent 网络，下层由 QA、SRE 与 Data Agent 承担验证、运行和数据职责。
      </desc>
      <defs>
        <marker id="topo-arrow" markerHeight="8" markerWidth="8" orient="auto-start-reverse" refX="8" refY="4" viewBox="0 0 8 8">
          <path class="supply-chain-arrow" d="M 0 0 L 8 4 L 0 8 z" />
        </marker>
      </defs>

      <text class="supply-chain-heading" x="60" y="50">人还在上层，交接在 Agent 之间</text>
      <text class="supply-chain-subheading" x="60" y="78">业务目标由人定义，中间的传递交给 Agent 网络</text>

      <g class="supply-chain-node supply-chain-node-demand">
        <rect height="64" rx="14" width="320" x="400" y="100" />
        <text x="560" y="128">业务目标</text>
        <text class="supply-chain-node-small" x="560" y="152">由人定义，可以度量</text>
      </g>
      <path class="supply-chain-flow" d="M 560 164 V 184" marker-end="url(#topo-arrow)" />

      <g class="supply-chain-node">
        <rect height="64" rx="14" width="460" x="330" y="184" />
        <text x="560" y="212">共享工作区</text>
        <text class="supply-chain-node-small" x="560" y="236">目标、决策、任务、状态、权限</text>
      </g>
      <path class="supply-chain-flow" d="M 560 248 V 268" marker-end="url(#topo-arrow)" />

      <g class="supply-chain-node">
        <rect height="84" rx="14" width="300" x="60" y="268" />
        <text x="210" y="300">产品负责人</text>
        <text class="supply-chain-node-small" x="210" y="326">Product Agent</text>
      </g>
      <g class="supply-chain-node">
        <rect height="84" rx="14" width="300" x="410" y="268" />
        <text x="560" y="300">工程师</text>
        <text class="supply-chain-node-small" x="560" y="326">Dev Agent</text>
      </g>
      <g class="supply-chain-node">
        <rect height="84" rx="14" width="300" x="760" y="268" />
        <text x="910" y="300">商务负责人</text>
        <text class="supply-chain-node-small" x="910" y="326">GTM Agent</text>
      </g>

      <path class="supply-chain-flow" d="M 210 352 V 372" marker-end="url(#topo-arrow)" />
      <path class="supply-chain-flow" d="M 560 352 V 372" marker-end="url(#topo-arrow)" />
      <path class="supply-chain-flow" d="M 910 352 V 372" marker-end="url(#topo-arrow)" />

      <g class="supply-chain-node supply-chain-node-bottleneck">
        <rect height="76" rx="14" width="1000" x="60" y="372" />
        <text x="560" y="404">Agent 网络</text>
        <text class="supply-chain-node-small" x="560" y="430">任务委派、上下文同步、冲突处理、结果验证</text>
      </g>

      <path class="supply-chain-flow" d="M 210 448 V 468" marker-end="url(#topo-arrow)" />
      <path class="supply-chain-flow" d="M 560 448 V 468" marker-end="url(#topo-arrow)" />
      <path class="supply-chain-flow" d="M 910 448 V 468" marker-end="url(#topo-arrow)" />

      <g class="supply-chain-node">
        <rect height="84" rx="14" width="300" x="60" y="468" />
        <text x="210" y="500">QA Agent</text>
        <text class="supply-chain-node-small" x="210" y="526">按契约验证</text>
      </g>
      <g class="supply-chain-node">
        <rect height="84" rx="14" width="300" x="410" y="468" />
        <text x="560" y="500">SRE Agent</text>
        <text class="supply-chain-node-small" x="560" y="526">运行与故障处理</text>
      </g>
      <g class="supply-chain-node">
        <rect height="84" rx="14" width="300" x="760" y="468" />
        <text x="910" y="500">Data Agent</text>
        <text class="supply-chain-node-small" x="910" y="526">数据与指标</text>
      </g>

      <text class="supply-chain-subheading" x="60" y="592">人负责定义目标和边界，中间的传递交给 Agent。这张图要跑起来，需要下面六层能力，和一份可以被自动判定的交付契约。</text>
    </svg>
  </div>
  <figcaption>
    工作单位从人变成人加 Agent 以后，组织形态变成两层。上层是人定义的目标与共享工作区，下层是各角色的 Agent 接入同一个网络，由验证、运行和数据 Agent 承接横跨职能的部分
  </figcaption>
</figure>

有一种常见说法把 Agent 协作的瓶颈放在通信协议上，三家产品的实际做法不太支持这个判断。Grok Bot 的 Bot 之间连网络调用都没有，靠共享目录加群聊通知就把协作跑通了。协议当然要标准化，但那是在双方有了可自动判定的交付标准之后的事。没有这条标准，协议只能把不确定的东西原样传下去。

## 协作层还缺什么

把三家的公开资料摊开看，它们确认了什么、哪些还没公开，两边信息量一样大。下面按协作跑起来需要的几层，逐层说现在的状态。

**发现。** Agent 要知道该找谁。三款产品目前都只在自家平台内部解决这个问题，Grok Bot 靠同一账户下的 Bot 列表，Claude Tag 靠频道，豆包靠工作小队。跨平台的目录还没有。行业侧在推这件事的是 AGNTCY，它由 Cisco 的 Outshift 孵化，现在归 Linux Foundation，发布了四份规范，OASF 用来描述一个 Agent 能做什么，Agent Directory 用来发布和发现，SLIM 负责低延迟消息传输，还有一份身份规范，并且和 A2A、MCP 互通。问题在于这些是规范，不是已经铺开的部署。微软和 Snowflake 各自建了自己的 Agent 目录，某个 Agent 由谁担保这件事，目前还是一个平台一个答案。

**通信。** 结构化任务在平台内部已经跑通，跨平台的协议还没定。Grok Bot 在产品层支持 Bot 之间互发消息、共享 thread 上下文和移交任务，消息格式没有公开。Claude Tag 没有公开 Tag 到 Tag 的直接协议。豆包的工作小队也没有公开寻址方式和一致性模型。三家都没有公开端到端 SLA。

**编排。** coordinator 加 worker 的模式已经出现。Grok Bot 可以设一只 Bot 管其他 Bot，Claude 底层的 Dynamic Workflows 能拉起数百个并行 subagent，豆包在讲工作小队。没人回答的是失败之后怎么办。两个 Agent 结论冲突时信谁，任务树谁有权终止，错误的对外写入怎么回滚，这些在公开资料里都没有答案。

上下文该给协调者看多少同样没有答案。我自己的划法是三层。协调者看的只有目标、当前状态和已经定下来的决策；某一方过程里的细节不必同步；交付出去的必须有产物、证据和风险等级。三层混在一起，协调者会淹没在细节里，它需要的判断依据反而被稀释。这个划法是我自己用的，三家都没有讲他们怎么做。

**治理。** 三家的方案正好构成企业 Agent 身份管理的三种流派。Grok Bot 用委派员工身份，Claude Tag 用机器身份，豆包用当前用户身份加管理员配置。三派各有代价，也都需要人来划定权限边界。谁有权替某个 Agent 签字，这个问题现在还没有产品化的答案。

**共享环境。** 任务、文件、上下文、状态放在哪，三家都放在了各自的产品里，而且记忆的存储格式都没有公开。这里还有一条约束，历史可以无限增长，进入模型上下文的必须有界。原始对话、任务和日志可以长期保存，默认不进上下文；检索和索引层负责按需取回；再往上收敛成组织记忆，也就是当前的目标、决策、规范和已知问题；最后裁剪成本次任务需要的工作上下文。==blue|这四层里前面两层好办，后面两层都还没跨过去。判断某条旧记录还有没有效，三家都没有公开的做法。==

**持续学习。** 三家的个性化都发生在推理时，靠持久记忆、用户纠正、把演示过程存成 routine，没有公开证据表明它们在用客户的日常使用去改模型权重。这意味着一家公司的经验能不能留下来，取决于它的记忆层做得好不好，跟用哪个模型关系不大。

把这六层放在一起可以写成一个乘式。

```text
企业 Agent 的价值 ≈ 推理 × 上下文 × 权限 × 持久性 × 编排 × 治理
```

任何一项接近零，整体就掉到零附近。模型只占第一项，而这一项恰恰是过去两年进步最快、也最容易被复制的一项。

<figure class="supply-chain-diagram">
  <div class="supply-chain-diagram-scroll">
    <svg
      aria-labelledby="agent-collab-layer-title agent-collab-layer-description"
      class="supply-chain-diagram-svg"
      role="img"
      viewBox="0 0 1120 720"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title id="agent-collab-layer-title">协作层缺什么，以及上下文如何收敛</title>
      <desc id="agent-collab-layer-description">
        左侧列出协作需要跑起来依赖的六层能力，标明每一层当前已经有的部分和仍然缺失的部分；右侧展示从原始历史到工作上下文的四层收敛过程。
      </desc>

      <text class="supply-chain-heading" x="60" y="52">协作层缺什么，上下文怎么收敛</text>
      <text class="supply-chain-subheading" x="60" y="80">左边是六层能力的现状，右边是记忆进入上下文前的四次收窄</text>

      <g class="supply-chain-node">
        <rect height="76" rx="14" width="580" x="60" y="116" />
        <text x="350" y="148">持续学习</text>
        <text class="supply-chain-node-small" x="350" y="174">个性化停在推理时，没有权重级学习的公开证据</text>
      </g>
      <g class="supply-chain-node">
        <rect height="76" rx="14" width="580" x="60" y="204" />
        <text x="350" y="236">治理</text>
        <text class="supply-chain-node-small" x="350" y="262">三种身份流派已经成形，权限边界仍要人划定</text>
      </g>
      <g class="supply-chain-node">
        <rect height="76" rx="14" width="580" x="60" y="292" />
        <text x="350" y="324">共享环境</text>
        <text class="supply-chain-node-small" x="350" y="350">记忆格式均未公开，上下文必须有界</text>
      </g>
      <g class="supply-chain-node">
        <rect height="76" rx="14" width="580" x="60" y="380" />
        <text x="350" y="412">编排</text>
        <text class="supply-chain-node-small" x="350" y="438">coordinator 模式已出现，冲突与回滚没有答案</text>
      </g>
      <g class="supply-chain-node">
        <rect height="76" rx="14" width="580" x="60" y="468" />
        <text x="350" y="500">通信</text>
        <text class="supply-chain-node-small" x="350" y="526">平台内已跑通，跨平台协议与端到端 SLA 未公开</text>
      </g>
      <g class="supply-chain-node">
        <rect height="76" rx="14" width="580" x="60" y="556" />
        <text x="350" y="588">发现</text>
        <text class="supply-chain-node-small" x="350" y="614">只有平台内部目录，跨平台找不到担保方</text>
      </g>

      <text class="supply-chain-subheading" x="880" y="112">记忆进入上下文的四次收窄</text>

      <g class="supply-chain-node">
        <rect height="98" rx="14" width="380" x="690" y="132" />
        <text x="880" y="170">原始历史</text>
        <text class="supply-chain-node-small" x="880" y="198">对话、任务、日志、文件，长期保留</text>
      </g>
      <path class="supply-chain-flow" d="M 880 230 V 252" marker-end="url(#collab-arrow)" />
      <g class="supply-chain-node">
        <rect height="98" rx="14" width="380" x="690" y="252" />
        <text x="880" y="290">检索与索引</text>
        <text class="supply-chain-node-small" x="880" y="318">语义、关键词、元数据按需取回</text>
      </g>
      <path class="supply-chain-flow" d="M 880 350 V 372" marker-end="url(#collab-arrow)" />
      <g class="supply-chain-node supply-chain-node-demand">
        <rect height="98" rx="14" width="380" x="690" y="372" />
        <text x="880" y="410">组织记忆</text>
        <text class="supply-chain-node-small" x="880" y="438">目标、决策、规范、已知问题</text>
      </g>
      <path class="supply-chain-flow" d="M 880 470 V 492" marker-end="url(#collab-arrow)" />
      <g class="supply-chain-node supply-chain-node-bottleneck">
        <rect height="98" rx="14" width="380" x="690" y="492" />
        <text x="880" y="530">工作上下文</text>
        <text class="supply-chain-node-small" x="880" y="558">本次任务需要的那部分信息</text>
      </g>

      <defs>
        <marker id="collab-arrow" markerHeight="8" markerWidth="8" orient="auto-start-reverse" refX="8" refY="4" viewBox="0 0 8 8">
          <path class="supply-chain-arrow" d="M 0 0 L 8 4 L 0 8 z" />
        </marker>
      </defs>

      <text class="supply-chain-subheading" x="60" y="694">最下面两层已经商品化。上面六层里，越靠近上方的层越依赖组织自己的数据与规则，也越难被外部采购替代。</text>
    </svg>
  </div>
  <figcaption>
    协作要跑起来依赖发现、通信、编排、治理、共享环境与持续学习六层能力，每一层都有已落地的部分和明确的缺口。右侧是记忆进入模型前的四次收窄，原始历史可以无限增长，交给模型的工作上下文必须是有界的。
  </figcaption>
</figure>

## 钱会流向哪一层

钱会流向哪一层，现在已经能看到一些比较清楚的信号。

模型和工具调用这两层，价格竞争已经很明确。客户在不同厂商之间切换的成本不高，同一个 API 换个模型名就能跑。工具调用被 MCP 标准化以后，一个接口写完各家都能接。这两层会继续重要，长期拿到超额利润的空间不大。

协同套件这一层的动作更值得看。Salesforce 三月底给 Slackbot 加了三十多项能力，把它从一个助手改成调度其他 Agent 的入口，并且明确说 Business+ 和 Enterprise+ 计划里已经包含，不额外收用量费。从 2026 年夏天开始，每一个新的 Salesforce 客户都会默认带上已经打开 AI 的 Slack。这个动作等于把企业要不要单独买一层 Agent 这个问题取消了。飞书的路径类似，把 Agent 直接做进群聊和文档侧边栏，让它在你已经付过的席位里工作。

模型厂商那一侧也在往同一个位置挤。Claude Tag 只对 Enterprise 和 Team 计划开放，按 token 消耗计费，管理员能在组织和频道两级设上限。它改变了收入结构，公司从卖 API 调用转向卖席位加组织级用量。Google、微软、OpenAI 在同一段时间里做了类似的动作，OpenAI 二月的 Frontier 和四月的 Workspace Agents 都强调共享的业务上下文、执行环境、评估和权限体系。

==blue|短中期价值会落在协同套件和模型厂商的重合处。== 我原先以为独立做协作层的公司机会最大，看完这几家的产品形态以后改了这个看法。套件把 Agent 层打包进已有席位这一招，比单独卖一层更有杀伤力。

做工具和编排的公司也已经有了。Factory 做 Agent 原生的软件开发，用户是工程组织，把需求、实现和评审放进一条流水线。Dust 做人机共用的工作空间，面向企业员工和内部工具开发者，强调共享的上下文与任务。CrewAI 做多 Agent 编排，用户是 Agent 开发者，把编排本身当成可编程的对象。AGNTCY 自己不做产品，做跨平台的规范，服务平台和基础设施团队。四家分别站在发现、编排和通信这几层上，谁都没有拿到组织里正在发生的那些对话和决策，而那部分上下文恰好长在协同套件里。

独立公司仍然有机会，位置要挑对。身份治理已经是一个成形的采购品类。2025 年上半年，Stytch、Permit.io、Okta、CyberArk、Descope、微软在十二周里先后发布了专门管 Agent 身份的产品，微软把它做成了 Entra 里的 Agent ID，放进 Agent 365 一起卖。随后一年，Palo Alto、Cisco、CrowdStrike、Okta、ServiceNow、Snowflake、IBM 陆续通过收购把这块能力买进来，Cisco 2026 年五月宣布计划收购 Astrix Security 是其中一例。这条路和过去的 CASB 很像，独立厂商先跑出来，然后被平台收编。

上下文和记忆这一层在密集起量。Euno 九月拿到 2300 万美元 A 轮，做的是让 Agent 知道该信哪份数据、能碰哪些数据。Modus 七月带着 1000 万美元出来，思路是提前用小模型和检索把业务上下文整理成一份现成的简报，等前沿模型接手时只给它这一份，省的是 token。Sentra 一月拿了 500 万美元，把公司的决策和承诺按时间线记下来。Interloom 三月拿了 1650 万美元，把老员工解决问题的过程存成一张持续更新的图。

这几家做的都是同一件事，让智能在一个具体组织里站得住，而它们自己不做模型。我在 Proma 里用过一个很小的机制。批处理固定流程时挂一个定时任务，让它定期回顾这些任务跑过的过程，把踩过的坑和有效的做法记下来，下次新任务开始时能自己读到。这个机制一点也不聪明，它只是让同一个错误不用犯第二遍。

这几层的护城河机制各不相同。上下文迁移成本最硬，Claude 在一个频道里积累了几个月的讨论和决策以后，换掉它要重配权限，积累下来的讨论和决策也带不走。权限与审计是采购的硬门槛，金融和政企客户在这一项上不会让步，身份治理能单独列进预算本身就是证据。任务契约的定义权最隐蔽，谁定下 Task 的字段规范，谁就掌握编排的入口，而这个规范还没统一，飞书用 CLI 加多维表格，Slack 用线程加 Agent Card，各写各的。

判断这门生意能不能成立，我倾向换一个计量单位。按 token 算不出结论，一次任务的调用次数取决于规划质量，波动很大。比较实际的单位是一次被完整接管的交接点。

一笔账大致是这样。

```text
单位收益 = 这个交接点原本消耗的人工小时 × 人力成本
单位成本 = 模型调用 + 常驻监听 + 人工验证
```

第三项最容易被忽略。Agent 交出来的东西如果还要人从头复核一遍，前两项省下的时间会原样吐回去，收益归零。判断一条流水线值不值得上，我会先看它能不能把人介入的比例降下来。降不下来，再漂亮的演示也只是把工作量从执行搬到验证。

这个判断有前提。它假设协同套件愿意把接口开得足够宽，也假设企业愿意先花时间做权限和上下文的治理。如果套件开始收紧接口、把协作层变成只有自己能进的地方，独立中间件的窗口会缩小。反过来，如果跨平台的身份和记忆标准真被多方采纳，套件锁定的力量也会变弱。

## 风险、非共识与观察信号

最要紧的风险是错误被真的执行出去。一个只会说错的助手，损失止于一句错话。一个有登录凭据、能写系统的 Agent 说错话，会变成一封发错的邮件、一次错的采购、一次生产环境的变更。所以这三款产品都把高风险动作拦在人这里。Grok Bot 对 shell 和浏览器操作要求逐项批准，Claude Tag 用窄范围的机器身份控制权限半径，飞书用工作流和敏感数据管控把节点固化下来。

提示注入是结构性的。攻击者可以把指令藏进网页、邮件、issue、PDF 或者插件返回的数据里，让 Agent 把它当成任务。Cursor 官方承认这个攻击面，用不可信内容标记、审查模型、网络策略、人工批准和用户级隔离来降低风险，并没有声称消除。Claude Tag 的频道记忆和飞书的知识检索面对同一个问题，可以写入内容的地方就是可以影响 Agent 判断的地方。

还有三个次一级的缺口。过期记忆会让 Agent 拿着三个月前的结论继续推理。自动化回路会让一个 Agent 写的消息触发另一个 Agent，再触发下一个，公开资料里还没有讲清回环怎么拦。异构模型治理在豆包这里尤其突出，它允许企业接入自己的模型厂商账户，数据政策要按合同一家一家看，不能只看飞书那一层。

数据驻留和合规要分开看。Grok Bot 的云电脑目前在美国，要求境内驻留的企业在采购前要把这条问清楚。中国企业部署豆包工作伙伴时，员工内部使用的 Agent 和面向公众的生成式服务不是同一个监管类别，生成内容对外发布的部分还要单独考虑标识要求。

==blue|两个非共识判断。== 跨组织 Agent 网络的需求被高估了，在企业之间的信任模型没有落地之前，Agent 主要还是在组织边界内部跑，跨公司互操作短期内更多是标准组织的议题。另一个是 Agent 本身不会变成一个独立品类，它会像命令行工具一样被协作套件吸收，留在外面的是身份、记忆和审计。

判断有没有真的落地，我会看这几件事。Agent 交付物的人介入比例能不能从全量复核降到抽检，这是最能说明问题的一个数。错误对外写入的比例要低到企业愿意把它写进流程。记忆里有多少过期结论，最好能被量出来。跨平台的 Agent 目录如果始终是每家一个，跨组织协作就还没有开始。三家的端到端 SLA 一直没有公开，这一项可以等。协同套件的接口是继续开放还是开始收紧，决定独立中间件还有多少空间。最像组织变化的一条是定向共创的客户转成正式采购，以及有没有企业公开调整岗位设置来适配这套东西。

## 两个视角

对个人来说，位置会从执行往定义和验证挪。接下来更长本事的地方是判断什么算做好了，这件事 Agent 替不了你。还有一件事现在就该注意，你在自己 Agent 里积累的记忆和技能能不能带走。Mem0 讲的"记忆护照"就是在做这个方向，让记忆跟着人而不是跟着平台走。留在平台里的记忆越多，换平台时失去的东西越多。

对公司来说，顺序比速度重要。先做权限和上下文治理，再把 Agent 铺开，把组织记忆当基础设施建，而不是当提示词写。授权按影响可逆性分层，读和总结可以放开，对外发消息、下单、改生产环境要留在人这里。验收指标也不要选聊天 benchmark，值得测的是长任务完成率、需要人介入的次数、错误的对外写入率、工具调用的重试率和平均每个成功任务的成本。这些数现在三家都没有公开，企业只能自己在试点里量。

## 关键来源

- [Introducing Grok Bot](https://x.ai/news/introducing-grok-bot)，持久云电脑、多 Bot 协作、routine 与事件触发
- [Grok Bot Security](https://cursor.com/docs/grok-bot/security) 与 [Security FAQ](https://cursor.com/docs/grok-bot/security-faq)，隔离单位、身份模型、Auto Review、网络策略、模型路由与数据驻留
- [Introducing Claude Tag](https://www.anthropic.com/news/introducing-claude-tag)，multiplayer、Opus 4.8、记忆与异步任务
- [What is Claude Tag](https://support.claude.com/en/articles/15594475-what-is-claude-tag)，频道权限、Agent Identity、计费与审计
- [Understanding Claude Tag's access model](https://www.tenable.com/blog/claude-tag-slack-access-model)，频道级凭据的权限放大问题
- [豆包工作伙伴模型管理](https://aily.feishu.cn/hc/1u7kleqg/897wr1b8)、[知识检索范围](https://aily.feishu.cn/hc/1u7kleqg/2csyds1b)、[安全合规解决方案](https://aily.feishu.cn/hc/1u7kleqg/taaiminh)，多模型接入、按用户鉴权的检索与企业数据管控
- [飞书 8.0 与豆包工作伙伴发布报道](https://tech.ifeng.com/c/8wRMH4mNFWS)，CLI 接口数量、调用成功率与权限对齐口径
- [Slackbot 的 Agent 化更新](https://thenextweb.com/news/slack-slackbot-30-ai-features-agentic)，套件把 Agent 层打包进席位
- [Factory](https://factory.ai/)、[Dust](https://dust.tt/)、[CrewAI](https://crewai.com/)，分别做 Agent 原生开发、人机共用工作空间与多 Agent 编排
- [AGNTCY 加入 Linux Foundation](https://www.linuxfoundation.org/press/linux-foundation-welcomes-the-agntcy-project-to-standardize-open-multi-agent-system-infrastructure-and-break-down-ai-agent-silos)，OASF、Agent Directory、SLIM 与身份规范
