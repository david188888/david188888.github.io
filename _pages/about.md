---
permalink: /
title:
author_profile: false
classes: wide
hide_masthead: true
hide_page_footer: true
redirect_from: 
  - /about/
  - /about.html
---

<section class="hero-intro" id="home">
  <div class="home-bg-stage" aria-hidden="true">
    <canvas class="home-fluid-canvas js-home-fluid"></canvas>
  </div>

  <div class="home-shell">
    <section class="home-hero reveal">
      <div class="home-hero__main">
        <img
          class="home-hero__avatar"
          src="{{ '/images/avatar-rainbow.jpg' | relative_url }}"
          alt="Portrait of HongYu Liu"
          width="220"
          height="220"
          decoding="async"
          fetchpriority="high"
          onerror="this.onerror=null;this.src='{{ '/images/profile.png' | relative_url }}';"
        />
        <p class="home-hero__eyebrow">Speech AI · SLM Trustworthiness · Agentic RL</p>
        <h1 class="home-hero__title">HongYu Liu</h1>
        <p class="home-hero__lead">
          I build trustworthy speech and language systems, with research spanning proactive interaction, privacy evaluation,
          and end-to-end spoken dialogue intelligence.
        </p>
        <p class="home-hero__typed">
          Current Focus:
          <span
            class="home-hero__typed-text js-typed-role"
            data-roles="SLM Trustworthiness|RL for Proactive Dialogue|Agentic Speech Intelligence|End-to-End Spoken Dialogue Systems"
          ></span>
        </p>
        <div class="home-hero__actions">
          <a class="home-btn home-btn--primary" href="{{ '/files/Resume_en.pdf' | relative_url }}" target="_blank" rel="noopener">Curriculum Vitae</a>
          <a class="home-btn home-btn--secondary" href="mailto:david.liu1888888@gmail.com">Contact</a>
          <a class="home-btn home-btn--secondary" href="https://github.com/david188888" target="_blank" rel="noopener">GitHub</a>
        </div>
      </div>
    </section>

    <section id="education" class="home-section reveal">
      <div class="home-section__header">
        <h2>Education</h2>
      </div>
      <div class="timeline-grid">
        <article class="timeline-card reveal">
          <p class="timeline-card__time">Bachelor's Degree</p>
          <h3>South China Normal University</h3>
          <p class="timeline-card__meta">B.Eng. in Software Engineering</p>
          <p>Overall GPA: 4.06.</p>
        </article>
        <article class="timeline-card reveal">
          <p class="timeline-card__time">Matriculation: Sep 2026</p>
          <h3>The Chinese University of Hong Kong, Shenzhen</h3>
          <p class="timeline-card__meta">Master of Science in Data Science (Offer Received)</p>
          <p>Enrollment scheduled for September 2026.</p>
        </article>
      </div>
    </section>

    <section id="internships" class="home-section reveal">
      <div class="home-section__header">
        <h2>Internship</h2>
      </div>
      <div class="timeline-grid">
        <article class="timeline-card reveal">
          <p class="timeline-card__time">Feb 2026 - Present</p>
          <h3>Arashi Vision Inc. · Speech Algorithm Intern</h3>
          <p class="timeline-card__meta">Shenzhen, China</p>
          <p>Developing production-grade speech algorithms and optimizing low-latency model inference for voice applications.</p>
        </article>
        <article class="timeline-card reveal">
          <p class="timeline-card__time">Jun 2025 - Sep 2025</p>
          <h3>Amphion Technology · R&amp;D Intern</h3>
          <p class="timeline-card__meta">Shenzhen, China</p>
          <p>Developed core algorithms for a voice-cloning application and supported backend model integration for video translation.</p>
        </article>
      </div>
    </section>

    <section id="papers" class="home-section reveal">
      <div class="home-section__header">
        <h2>Research</h2>
      </div>
      <div class="paper-grid">
        <article class="paper-card reveal">
          <p class="paper-card__venue">ICLR 2026 · Poster</p>
          <h3>VoxPrivacy: A Benchmark for Evaluating Interactional Privacy of Speech Language Models</h3>
          <p>Introduced a multi-user benchmark for measuring interactional privacy risks in speech-language models; second author.</p>
          <p class="paper-card__links"><a href="https://arxiv.org/abs/2601.19956" target="_blank" rel="noopener">Paper</a></p>
        </article>
        <article class="paper-card reveal">
          <p class="paper-card__venue">ECAI 2025 · Oral</p>
          <h3>DialogGraph-LLM: Graph-Informed LLMs for End-to-End Audio Dialogue Intent Recognition</h3>
          <p>Proposed a graph-informed framework for end-to-end intent recognition in spoken dialogue; first author.</p>
          <p class="paper-card__links"><a href="https://arxiv.org/abs/2511.11000" target="_blank" rel="noopener">Paper</a></p>
        </article>
        <article class="paper-card reveal">
          <p class="paper-card__venue">ADMA 2025 · Poster</p>
          <h3>Multi-segment Multitask Fusion Network for Marketing Audio Classification</h3>
          <p>Proposed MSMT-FN for marketing-call attitude classification, achieving stronger results than prior baselines; first author.</p>
          <p class="paper-card__links"><a href="https://arxiv.org/abs/2511.11006" target="_blank" rel="noopener">Paper</a></p>
        </article>
      </div>
    </section>
  </div>
</section>
