---
layout: page
title: ''
permalink: /confidants/
---

# What is the Confidant System?

{:refdef: style="text-align: center;"}
![Confidant system infographic](/images/ConfidantSticker.png){: style="max-width: 60%; height: auto;" }
{: refdef}

We are a group of people who know the University of Tübingen and its support structures well. We’re here to help you when you need guidance, pointing you to the right people or information. Most of us have been in Tübingen for a while, so we know all the dos and don’ts--and we’re happy to share them with you.

We ensure confidentiality, so to be worth of your trust. You can read about this and other stuff in our [code of conduct](https://drive.google.com/file/d/1M7SegFyINVURnOB5UZmIYnSHj3CJcc_n/view?usp=sharing).

Some, but not all, of the topics we are informed about:
- housing
- mental health and well-being
- inclusion
- being an international researcher
- PhD/Postdoc life

# Confidants

<style>
/* Inline styles for the confidants board (kept on this page only) */
.confidants-board {
  display: flex;
  justify-content: center;
  margin: 2rem 0;
}
.confidant-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.25rem;
  width: 100%;
  max-width: 1100px;
  align-items: start;
  justify-items: center;
}
.confidant-card {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 1.25rem;
  text-align: center;
  box-shadow: 0 4px 8px rgba(0,0,0,0.06);
  width: 100%;
  max-width: 320px;
}
.confidant-photo {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 0.75rem;
}
.confidant-info h3 { margin: 0.35rem 0; font-size: 1.1rem; }
.confidant-info p.role { margin: 0.25rem 0; color: #666; font-size: 0.95rem; }
.confidant-info p.bio { font-size: 0.95rem; color: #444; margin-top: 0.5rem; }
.confidant-info .links { margin-top: 0.5rem; }
.confidant-info .links a { margin: 0 0.35rem; text-decoration: none; font-size: 0.9rem; }
@media (max-width: 480px) { .confidant-photo { width: 120px; height: 120px; } }
</style>

<div class="confidants-board">
  <div class="confidant-container">
    {% comment %}
      This chooses your data file. If your confidants file is _data/confidants.yml this will use it;
      otherwise it falls back to _data/confidants.yml.
    {% endcomment %}
    {% assign datafile = site.data.confidants %}

    {% assign sorted_confidants = datafile | sort: "name" %}

    {% for confidant in sorted_confidants %}
      <div class="confidant-card">
        {% if confidant.photo %}
          <img src="{{ confidant.photo | relative_url }}" alt="{{ confidant.name }}" class="confidant-photo">
        {% endif %}
        <div class="confidant-info">
          <h3>{{ confidant.name }}</h3>
          {% if confidant.role %}<p class="role">{{ confidant.role }}</p>{% endif %}
          {% if confidant.bio %}<p class="bio">{{ confidant.bio }}</p>{% endif %}
          <p class="links">
            {% if confidant.github %}<a href="{{ confidant.github }}" target="_blank">GitHub</a>{% endif %}
            {% if confidant.website %}<a href="{{ confidant.website }}" target="_blank">Website</a>{% endif %}
            {% if confidant.linkedin %}<a href="{{ confidant.linkedin }}" target="_blank">LinkedIn</a>{% endif %}
            {% if confidant.email %}<a href="mailto:{{ confidant.email }}">Email</a>{% endif %}
          </p>
        </div>
      </div>
    {% endfor %}
  </div>
</div>

# Helpers

<div class="confidants-board">
  <div class="confidant-container">
    {% assign datafile = site.data.helpers %}

    {% assign sorted_confidants = datafile | sort: "name" %}

    {% for confidant in sorted_confidants %}
      <div class="confidant-card">
        {% if confidant.photo %}
          <img src="{{ confidant.photo | relative_url }}" alt="{{ confidant.name }}" class="confidant-photo">
        {% endif %}
        <div class="confidant-info">
          <h3>{{ confidant.name }}</h3>
          {% if confidant.role %}<p class="role">{{ confidant.role }}</p>{% endif %}
          {% if confidant.bio %}<p class="bio">{{ confidant.bio }}</p>{% endif %}
          <p class="links">
            {% if confidant.github %}<a href="{{ confidant.github }}" target="_blank">GitHub</a>{% endif %}
            {% if confidant.website %}<a href="{{ confidant.website }}" target="_blank">Website</a>{% endif %}
            {% if confidant.linkedin %}<a href="{{ confidant.linkedin }}" target="_blank">LinkedIn</a>{% endif %}
            {% if confidant.email %}<a href="mailto:{{ confidant.email }}">Email</a>{% endif %}
          </p>
        </div>
      </div>
    {% endfor %}
  </div>
</div>
