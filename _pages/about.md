---
permalink: /
title:
author_profile: false
classes: wide
redirect_from: 
  - /about/
  - /about.html
---

<section class="hero-intro" id="home">
  <div class="hero-intro__text">
    <img
      class="hero-intro__avatar"
      src="{{ '/images/avatar-rainbow.jpg' | relative_url }}"
      alt="Profile portrait"
      width="220"
      height="220"
      decoding="async"
      fetchpriority="high"
      onerror="this.onerror=null;this.src='{{ '/images/profile.png' | relative_url }}';"
    />
    <p class="hero-intro__eyebrow">Personal Website</p>
    <h1 class="hero-intro__title">{{ site.author.name }}</h1>
    <p class="hero-intro__lead">{{ site.description }}</p>
    <div class="hero-intro__actions">
      <a class="btn btn--primary" href="{{ '/cv/' | relative_url }}">View CV</a>
      <a class="btn btn--inverse" href="mailto:{{ site.author.email }}">Contact</a>
    </div>
  </div>
</section>
