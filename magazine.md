---
layout: page
title: 'Tappa Quarterly'
---

Our magazine, made by and for the TAPPA community. Open the cover to start reading.

<style>
/* Inline styles for the magazine page (kept on this page only) */
.magazine {
  margin: 2rem 0;
  text-align: center;
}
.magazine-cover img {
  display: block;
  width: 100%;
  max-width: 420px;
  height: auto;
  margin: 0 auto;
}
.magazine-issue {
  margin: 1rem 0 0;
  font-size: 0.875rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #6b6b6b;
}
.magazine-links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: center;
  margin-top: 1.25rem;
}
.magazine-links .btn {
  margin-bottom: 0;
}

/* Past issues grid */
.issue-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1.75rem 1.25rem;
  margin: 1.5rem 0 2rem;
}
.issue-card {
  display: block;
  text-decoration: none;
  text-align: center;
}
.issue-card img {
  display: block;
  width: 100%;
  height: auto;
}
.issue-card-title {
  display: block;
  margin-top: 0.6rem;
  font-weight: bold;
  line-height: 1.3;
}
.issue-card-date {
  display: block;
  font-size: 0.8125rem;
  color: #6b6b6b;
}

/* Shared cover treatment */
.magazine-cover img,
.issue-card img {
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.magazine-cover:hover img,
.magazine-cover:focus-visible img,
.issue-card:hover img,
.issue-card:focus-visible img {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.18);
}
@media (prefers-reduced-motion: reduce) {
  .magazine-cover img,
  .issue-card img {
    transition: none;
  }
  .magazine-cover:hover img,
  .magazine-cover:focus-visible img,
  .issue-card:hover img,
  .issue-card:focus-visible img {
    transform: none;
  }
}
</style>

{%- assign issues = site.data.magazine -%}
{%- assign current = issues | first -%}

<div class="magazine">
  <a class="magazine-cover" href="{{ current.url | relative_url }}">
    <img src="{{ current.cover | relative_url }}"
         width="1652" height="2338"
         alt="Read Tappa Quarterly, {{ current.title }}">
  </a>

  <p class="magazine-issue">{{ current.title }} &middot; {{ current.date }}</p>

  <div class="magazine-links">
    <a class="btn btn--accent"
       href="{{ current.url | relative_url }}">Read the magazine</a>
  </div>
</div>

{%- if issues.size > 1 %}

## Past issues

<div class="issue-grid">
  {%- for issue in issues offset:1 %}
  <a class="issue-card" href="{{ issue.url | relative_url }}">
    <img src="{{ issue.cover | relative_url }}"
         width="1652" height="2338"
         alt="Read Tappa Quarterly, {{ issue.title }}">
    <span class="issue-card-title">{{ issue.title }}</span>
    <span class="issue-card-date">{{ issue.date }}</span>
  </a>
  {%- endfor %}
</div>

{%- endif %}
