---
title: "Agent 时代的 AI 芯片，要同时穿过云端与端侧"
date: "2026-09-05"
language: zh
excerpt: "Agent 把推理需求推向云端大规模吞吐，也推向汽车和家庭设备的本地响应。真正需要警惕的，是资本和供应链会不会沿着需求预期层层放大，最后跑在有效使用量前面。"
tags:
  - AI
  - Chips
  - Strategy
status: draft
---

# Agent 时代的 AI 芯片，要同时穿过云端与端侧

我现在看 AI 芯片，脑子里有两条需求曲线。第一条在云端，模型需要更多并发、更长上下文和更稳定的持续吞吐。第二条在端侧，汽车、家庭设备和其他终端开始要求助手低延迟、能离线工作，也要把一部分数据留在本地。

这两条曲线会同时增长，但它们需要的芯片和商业账并不相同。云端更在意每小时能完成多少推理任务，端侧更在意一颗芯片能否在有限功耗和设备成本下长期处理真实交互。把两者都归结为“需要更多 GPU”，会漏掉下一阶段最重要的变化。

我更担心另一件事。Agent 带来的需求预期，可能沿着云服务商、GPU 租赁商、服务器厂商、内存供应商和融资机构逐层放大。每一层都根据上一层的订单和预测继续扩产，最后形成一套比真实付费使用量更大的供给。牛鞭效应一旦反过来，泡沫可能先从内存、服务器和租赁价格开始破，再传到芯片资产的回报。

所以我的判断有两半。AI 芯片仍然处在推理需求扩张期，云端和端侧都值得关注。行业的风险也在同步上升，判断谁能留下利润，不能只看算力需求和资本开支，还要看这些投入最后完成了多少任务，产生了多少收入。

## Agent 把推理从一次调用变成连续工作

普通问答往往只需要一次请求和一段输出。Agent 会先规划，再调用搜索、数据库或其他软件，读回结果以后继续生成下一步。一个任务可能因此包含多轮模型调用，产生更长的上下文，也需要更频繁地读写 KV Cache。

这会改变推理系统的工作负载。Prefill 主要处理输入上下文，通常更接近计算密集型任务。Decode 按顺序生成输出，需要反复读取模型权重和缓存。上下文越长，内存容量、带宽、跨卡通信和调度等待越容易成为限制。完成一个任务究竟用了多少次调用，也会影响客户最后承担的成本。

我会用一笔简单的工程账来观察这件事。

```text
每百万有效 Token 成本 = 每小时完整系统成本 ÷ 每小时有效 Token 产出 × 1,000,000
```

完整系统成本包括加速器、HBM、服务器、网络、电力、液冷、软件、托管和折旧。有效 Token 需要放在具体模型、上下文长度、并发、延迟和服务质量里计算。输入、输出、缓存命中和失败重试不能随意混在一起。

Token 只是比较服务产出的共同尺度，未必就是客户真正购买的单位。客户可能按一次任务、一次会话、一个用户或一项业务结果付费。对芯片供应商来说，最重要的问题也就从峰值 FLOPS 变成了芯片能否让客户以更低成本完成一项任务。

这也是云端推理需求会继续增加的原因。Agent 越复杂，单个用户带来的调用量越高。模型越长，显存、带宽和互联的重要性越高。云厂商需要一套能够持续服务、稳定计费的系统，单张卡偶尔达到峰值并不能满足这个要求。

## 云端与端侧是两套不同的推理经济

云端适合集中处理大模型、长上下文和需要多个工具协作的任务。模型集中部署，算力可以在多个客户之间调度，昂贵的内存、网络和液冷也能被更多请求摊薄。云端的主要考题是利用率、每次任务成本、延迟和软件适配。

端侧面对另一组限制。汽车助手和家庭控制中枢需要快速响应，弱网时仍能完成一部分工作，涉及家庭状态和个人信息的请求也更适合留在设备附近。设备的空间、电池或散热能力有限，芯片不能把数据中心的功耗直接搬过去。它还必须稳定运行多年，不能因为模型和软件更新就频繁更换硬件。

这会形成端云分工。端侧负责唤醒、感知、简单决策和高频控制，云端负责复杂推理、长上下文和需要更大模型的任务。两边之间传什么数据、何时切换、失败后怎样降级，都会影响体验和成本。

端侧需求能否形成大规模芯片市场，取决于几个现实问题。用户每天是否足够频繁地使用助手，设备厂商是否愿意为本地推理多付钱，本地运行是否明显改善延迟和隐私，芯片能否在产品生命周期内支持模型更新。汽车和家庭设备是我会重点观察的场景，但目前还不能仅凭产品演示判断它们已经形成稳定的芯片需求。

这两条曲线的差异会影响投资判断。云端更容易先出现采购订单和大型资本开支，端侧需要等设备出货、用户使用和芯片设计周期逐步兑现。前者的验证速度快，资产规模也大。后者的兑现时间更长，但一旦进入高频设备场景，需求可能更分散，也更接近真实用户行为。

## HBM、服务器和机房会沿着预期一起扩张

推理系统的瓶颈会沿着数据移动逐层出现。HBM提供容量和带宽，先进封装把计算芯片与内存连接起来，服务器和机架把部件组织成可部署的系统，网络决定多张芯片能否共同工作，电力和液冷决定系统能否持续运行。软件调度则决定这些投入有多少能变成可计费吞吐。

Google 在 Ironwood TPU 的官方介绍中把推理、内存访问和芯片间互联放在同一个系统问题里，并称最大规模的液冷系统连接 9,216 颗芯片，功耗接近 10 MW。这是 Google 的产品口径，不能外推成所有集群的统一标准。它说明的是，数据中心的供给边界已经延伸到芯片之外。

台积电在 2025 年第一季度业绩电话会上称 CoWoS 需求处于满载状态，并计划扩大产能。Micron 在 2025 年 6 月的业绩材料中把数据中心 DRAM 收入增长与 HBM 需求和扩产投资联系起来。需求增长与产能扩张正在同一时间发生。

<figure class="supply-chain-diagram">
  <div class="supply-chain-diagram-scroll">
    <svg
      aria-labelledby="supply-chain-diagram-title supply-chain-diagram-description"
      class="supply-chain-diagram-svg"
      role="img"
      viewBox="0 0 1120 760"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title id="supply-chain-diagram-title">AI 基础设施的实物供应链与金融放大链</title>
      <desc id="supply-chain-diagram-description">
        上半部分展示用户请求如何传导到模型服务、GPU、内存、封装、服务器、网络和电力液冷。下半部分展示长期合同和融资如何在需求低于预期时放大库存与资产残值压力。
      </desc>
      <defs>
        <marker
          id="supply-chain-arrow"
          markerHeight="8"
          markerWidth="8"
          orient="auto-start-reverse"
          refX="7"
          refY="4"
          viewBox="0 0 8 8"
        >
          <path class="supply-chain-arrow" d="M 0 0 L 8 4 L 0 8 z" />
        </marker>
        <marker
          id="supply-chain-risk-arrow"
          markerHeight="8"
          markerWidth="8"
          orient="auto-start-reverse"
          refX="7"
          refY="4"
          viewBox="0 0 8 8"
        >
          <path class="supply-chain-risk-arrow" d="M 0 0 L 8 4 L 0 8 z" />
        </marker>
      </defs>

      <text class="supply-chain-heading" x="50" y="48">
        实物需求链
      </text>
      <text class="supply-chain-subheading" x="50" y="75">
        实线代表已经可观察的部署与采购传导
      </text>

      <path class="supply-chain-flow" d="M 184 159 H 230" marker-end="url(#supply-chain-arrow)" />
      <path class="supply-chain-flow" d="M 394 159 H 440" marker-end="url(#supply-chain-arrow)" />
      <path class="supply-chain-flow" d="M 604 159 H 650" marker-end="url(#supply-chain-arrow)" />
      <path class="supply-chain-flow" d="M 814 159 H 860" marker-end="url(#supply-chain-arrow)" />
      <path class="supply-chain-flow" d="M 920 214 V 281" marker-end="url(#supply-chain-arrow)" />
      <path class="supply-chain-flow" d="M 860 336 H 814" marker-end="url(#supply-chain-arrow)" />
      <path class="supply-chain-flow" d="M 650 336 H 604" marker-end="url(#supply-chain-arrow)" />
      <path class="supply-chain-flow" d="M 440 336 H 394" marker-end="url(#supply-chain-arrow)" />
      <path class="supply-chain-flow" d="M 230 336 H 184" marker-end="url(#supply-chain-arrow)" />

      <g class="supply-chain-node supply-chain-node-demand">
        <rect height="110" rx="16" width="134" x="50" y="104" />
        <text x="117" y="145">用户请求</text>
        <text class="supply-chain-node-small" x="117" y="172">有效 Token</text>
      </g>
      <g class="supply-chain-node supply-chain-node-demand">
        <rect height="110" rx="16" width="164" x="230" y="104" />
        <text x="312" y="143">模型与 Agent</text>
        <text class="supply-chain-node-small" x="312" y="170">规划、工具、推理</text>
      </g>
      <g class="supply-chain-node supply-chain-node-system">
        <rect height="110" rx="16" width="164" x="440" y="104" />
        <text x="522" y="143">GPU / ASIC</text>
        <text class="supply-chain-node-small" x="522" y="170">Prefill 与 Decode</text>
      </g>
      <g class="supply-chain-node supply-chain-node-bottleneck">
        <rect height="110" rx="16" width="164" x="650" y="104" />
        <text x="732" y="143">HBM / DRAM</text>
        <text class="supply-chain-node-small" x="732" y="170">KV Cache 与容量</text>
      </g>
      <g class="supply-chain-node supply-chain-node-bottleneck">
        <rect height="110" rx="16" width="164" x="860" y="104" />
        <text x="942" y="143">先进封装</text>
        <text class="supply-chain-node-small" x="942" y="170">晶圆与 CoWoS</text>
      </g>
      <g class="supply-chain-node supply-chain-node-system">
        <rect height="110" rx="16" width="164" x="860" y="281" />
        <text x="942" y="320">服务器与机架</text>
        <text class="supply-chain-node-small" x="942" y="347">可部署算力</text>
      </g>
      <g class="supply-chain-node supply-chain-node-system">
        <rect height="110" rx="16" width="164" x="650" y="281" />
        <text x="732" y="320">网络互连</text>
        <text class="supply-chain-node-small" x="732" y="347">NVLink、交换、光</text>
      </g>
      <g class="supply-chain-node supply-chain-node-bottleneck">
        <rect height="110" rx="16" width="164" x="440" y="281" />
        <text x="522" y="320">电力与液冷</text>
        <text class="supply-chain-node-small" x="522" y="347">并网、配电、散热</text>
      </g>
      <g class="supply-chain-node supply-chain-node-system">
        <rect height="110" rx="16" width="164" x="230" y="281" />
        <text x="312" y="320">KV Cache / 调度</text>
        <text class="supply-chain-node-small" x="312" y="347">路由、复用、迁移</text>
      </g>
      <g class="supply-chain-node supply-chain-node-demand">
        <rect height="110" rx="16" width="134" x="50" y="281" />
        <text x="117" y="320">可计费服务</text>
        <text class="supply-chain-node-small" x="117" y="347">质量、延迟、成本</text>
      </g>

      <text class="supply-chain-heading" x="50" y="477">
        场景把需求带回不同芯片与系统
      </text>
      <path class="supply-chain-scene-flow" d="M 260 555 H 334" marker-end="url(#supply-chain-arrow)" />
      <path class="supply-chain-scene-flow" d="M 552 555 H 626" marker-end="url(#supply-chain-arrow)" />
      <g class="supply-chain-scene-node">
        <rect height="84" rx="14" width="210" x="50" y="513" />
        <text x="155" y="550">云推理与 Agent</text>
        <text class="supply-chain-node-small" x="155" y="575">复杂任务与多模型编排</text>
      </g>
      <g class="supply-chain-scene-node">
        <rect height="84" rx="14" width="218" x="334" y="513" />
        <text x="443" y="550">汽车个人助手</text>
        <text class="supply-chain-node-small" x="443" y="575">车控、导航、端云协同</text>
      </g>
      <g class="supply-chain-scene-node">
        <rect height="84" rx="14" width="244" x="626" y="513" />
        <text x="748" y="550">家庭控制中枢</text>
        <text class="supply-chain-node-small" x="748" y="575">传感器、工具、权限与记忆</text>
      </g>

      <text class="supply-chain-heading supply-chain-risk-heading" x="50" y="665">
        金融放大链
      </text>
      <text class="supply-chain-subheading" x="50" y="692">
        虚线是条件性风险，只有 Token 需求、利用率或续约低于采购假设时才会展开
      </text>
      <path class="supply-chain-risk-flow" d="M 370 647 H 442" marker-end="url(#supply-chain-risk-arrow)" />
      <path class="supply-chain-risk-flow" d="M 656 647 H 728" marker-end="url(#supply-chain-risk-arrow)" />
      <path class="supply-chain-risk-flow" d="M 948 647 H 1000" marker-end="url(#supply-chain-risk-arrow)" />
      <g class="supply-chain-risk-node">
        <rect height="76" rx="14" width="320" x="50" y="610" />
        <text x="210" y="641">长期合同、预付款、租赁与 SPV</text>
        <text class="supply-chain-node-small" x="210" y="665">采购约束下降</text>
      </g>
      <g class="supply-chain-risk-node">
        <rect height="76" rx="14" width="214" x="442" y="610" />
        <text x="549" y="641">提前采购与扩产</text>
        <text class="supply-chain-node-small" x="549" y="665">GPU、内存、机房</text>
      </g>
      <g class="supply-chain-risk-node">
        <rect height="76" rx="14" width="220" x="728" y="610" />
        <text x="838" y="641">低利用率或订单放缓</text>
        <text class="supply-chain-node-small" x="838" y="665">情景触发条件</text>
      </g>
      <g class="supply-chain-risk-node">
        <rect height="76" rx="14" width="70" x="1000" y="610" />
        <text class="supply-chain-node-small" x="1035" y="638">库存</text>
        <text class="supply-chain-node-small" x="1035" y="661">残值</text>
      </g>
    </svg>
  </div>
  <figcaption>
    AI 基础设施先由可售 Token 和系统部署拉动。融资、合同和扩产会加快采购，供给反转仍须由利用率、续约、价格和库存共同确认。
  </figcaption>
</figure>

云厂商会据此设计自有加速器，也会提前锁定服务器、内存和机房容量。专用芯片的条件是负载足够稳定，软件迁移成本可控，长期利用率能覆盖研发、部署和维护投入。AWS 的 Trainium、Inferentia 和 Neuron 软件栈，Google 的 TPU，都是围绕特定云端工作负载建立系统能力的例子。

问题在于，供应链看到的需求信号通常比最终用户的付费行为更早。云厂商看到客户询价，会增加采购计划。GPU 云服务商看到长期租赁合同，会建设新的数据中心。服务器厂商看到订单，会增加库存。内存和封装厂商看到扩产计划，会继续投入资本。融资机构又会把这些合同和设备当成未来现金流的依据。

同一份预期在不同环节被重复使用，牛鞭效应就出现了。每一层都没有必要等到最终任务真的发生，供给却已经被提前放大。只要 Agent 需求持续增长，这套机制可以帮助行业快速建设能力。需求增速一旦放缓，前面累积的库存、折旧和利息就会一起寻找出口。

## 泡沫可能先从资产回报开始破

我并不把“内存马上过剩”当作当前结论。HBM 仍然可能受益于高带宽推理，端侧设备也可能带来新的存储与计算需求。我要观察的是，资本投入是否已经快到足以让部分环节脱离真实使用量。

Applied Digital 在 2025 年 6 月披露，它与 CoreWeave 签订两份约 15 年的租赁协议，将提供 250 MW 的 IT 负载。这样的合同能够支持数据中心提前建设容量，也能让融资机构对未来现金流形成判断。BIS 在 2026 年关于 AI 基础设施融资的讨论中，分析了公司债务、私募信贷、合资企业和表外安排怎样共同支持扩张。

这类安排本身没有证明需求虚假。它把未来可能产生的收入提前转换成今天可以建设和购买的资产，也把经营判断转成了金融合同。真正需要核对的是合同期限、债务期限、GPU 经济寿命、设备迭代速度和客户付费周期是否相互匹配。

如果客户持续使用，长期合同有助于摊薄建设成本。若有效 Token 增长、客户续约或 GPU 利用率低于采购假设，租赁、折旧、电力和利息仍会按合同发生。设备可以正常运行，资产回报却可能已经下降。随后，GPU 租赁价格、二手设备残值、服务器库存和部分内存价格都会承受压力。

这也是我把 A 和 C 同时放进风险判断的原因。需求错配会让过多设备追逐有限的付费调用，供应链扩产又会把这种错配传导到 HBM、标准 DRAM、服务器、封装和机房。泡沫破裂未必从模型需求突然消失开始，也可能从某个环节发现新增订单不足以覆盖资本成本开始。

## 利润会落在哪些环节

云端推理的利润，首先会流向能把多个约束放进同一套系统的人。GPU 设计商掌握芯片性能、软件生态和供应链控制，云厂商掌握模型、客户、调度和计费入口，HBM 与先进封装供应商在供给紧张时拥有议价权。它们的优势来源不同，持续时间也不同。

GPU 仍然会在训练、模型开发和变化快速的推理任务中保持通用性。云厂商的自研芯片适合重复出现的工作负载，但软件迁移、开发工具和客户兼容性会限制它的扩张。HBM 和先进封装在供给紧张时更容易获得溢价，扩产以后，认证周期、良率、替代路径和客户集中度会变得更重要。

端侧的利润位置也不一定只在芯片设计商。汽车厂商、手机和家庭设备厂商掌握产品入口，芯片供应商需要在功耗、成本、模型工具和长期支持之间取得平衡。真正值得关注的公司，应该能够把芯片放进高频使用的产品，并让本地推理改善用户体验或减少云端调用费用。

我的投资观察会先按三个问题筛选。第一，客户为哪项结果付费。第二，供应商改善的是任务成本、延迟、功耗还是供给确定性。第三，订单增长以后，利用率、毛利和现金回报有没有跟上。单项参数领先可以带来一段时间的溢价，持续完成任务的能力才有机会把溢价留下。

## 我会等待哪些信号

云端方面，我会看云厂商是否披露有效 Token、利用率、服务质量和每兆瓦产出，也会看资本开支增长能否转化为云服务收入和现金流。更高的峰值吞吐本身不足以改变判断。

供应链方面，我会比较 HBM、标准 DRAM、服务器和 GPU 租赁价格的变化，看库存与交付周期是否出现分化。设备上架以后有没有稳定工作，客户合同能否续下去，比宣布了多少资本开支更有用。

端侧方面，我会看汽车和家庭设备的实际出货、助手使用频率、本地运行占比和产品毛利。产品演示能证明技术可行，长期使用才能证明芯片需求成立。

如果付费 Token 长期落后于算力供给，或者云厂商的自研芯片始终停留在内部展示，行业判断需要下调。如果复杂 Agent 任务带来持续的付费调用，端侧设备开始承担高频且低延迟的工作，单位推理成本也继续下降，云端与端侧的双重需求才会真正支撑新一轮芯片投资。

## 关键来源

- [Groq Inference Tokenomics, Speed, But At What Cost?](https://semianalysis.com/2024/02/21/groq-inference-tokenomics-speed-but)，SemiAnalysis，2024-02-21
- [Mastering LLM Techniques, Inference Optimization](https://developer.nvidia.com/blog/mastering-llm-techniques-inference-optimization)，NVIDIA，Prefill、Decode 与 KV Cache
- [Ironwood TPU](https://blog.google/innovation-and-ai/infrastructure-and-cloud/google-cloud/ironwood-tpu-age-of-inference/)，Google，2025-04-09
- [TSMC Q1 2025 Earnings Call Transcript](https://investor.tsmc.com/english/encrypt/files/encrypt_file/reports/2025-04/7630274eecc1197a4e3ea6a415f44a47204fe10a/TSMC%201Q25%20Transcript.pdf)，台积电，2025-04
- [Micron FY2025 Q3 results](https://investors.micron.com/news-releases/news-release-details/micron-technology-inc-reports-results-third-quarter-fiscal-2025)，Micron，2025-06-25
- [AWS Neuron SDK 2.26.0](https://aws.amazon.com/about-aws/whats-new/2025/09/aws-neuron-2-26-announce/)，AWS，2025-09
- [Applied Digital Announces 250MW AI Data Center Lease With CoreWeave](https://ir.applieddigital.com/news-events/press-releases/detail/123/applied-digital-announces-250mw-ai-data-center-lease-with)，Applied Digital，2025-06-02
- [Financing the AI infrastructure boom](https://www.bis.org/publ/qtrpdf/r_qt2603u.htm)，BIS，2026-03-16
- [AI agents for the smart home](https://www.home-assistant.io/blog/2024/06/07/ai-agents-for-the-smart-home)，Home Assistant，2024-06-07

## 待核验或待讨论

- 端侧场景中，汽车助手与家庭中枢是否需要拆成两条独立的产业链，还是作为同一类本地推理需求讨论
- “牛鞭效应”是否要在标题中直接出现，还是留在正文里作为风险机制
- 是否需要补充 NVIDIA、AMD、Google、AWS 之外的端侧芯片公司案例

## 下一轮可改方向

- 进一步提高个人判断比重，让文章更像一篇行业观察
- 增加端侧芯片的产业链与公司线索
- 补一笔云端基础设施的简化单位经济账
