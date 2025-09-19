---
layout: page
title: ''
permalink: /confidants/
---

# What is the Confidant System?

# Confidants

<style>
/* Inline styles for the members/confidants board (kept on this page only) */
.members-board {
  display: flex;
  justify-content: center;
  margin: 2rem 0;
}
.member-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.25rem;
  width: 100%;
  max-width: 1100px;
  align-items: start;
  justify-items: center;
}
.member-card {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 1.25rem;
  text-align: center;
  box-shadow: 0 4px 8px rgba(0,0,0,0.06);
  width: 100%;
  max-width: 320px;
}
.member-photo {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 0.75rem;
}
.member-info h3 { margin: 0.35rem 0; font-size: 1.1rem; }
.member-info p.role { margin: 0.25rem 0; color: #666; font-size: 0.95rem; }
.member-info p.bio { font-size: 0.95rem; color: #444; margin-top: 0.5rem; }
.member-info .links { margin-top: 0.5rem; }
.member-info .links a { margin: 0 0.35rem; text-decoration: none; font-size: 0.9rem; }
@media (max-width: 480px) { .member-photo { width: 120px; height: 120px; } }
</style>

<div class="members-board">
  <div class="member-container">
    {% comment %}
      This chooses your data file. If your members file is _data/confidants.yml this will use it;
      otherwise it falls back to _data/members.yml.
    {% endcomment %}
    {% if site.data.confidants %}
      {% assign datafile = site.data.confidants %}
    {% else %}
      {% assign datafile = site.data.members %}
    {% endif %}

    {% for member in datafile %}
      <div class="member-card">
        {% if member.photo %}
          <img src="{{ member.photo | relative_url }}" alt="{{ member.name }}" class="member-photo">
        {% endif %}
        <div class="member-info">
          <h3>{{ member.name }}</h3>
          {% if member.role %}<p class="role">{{ member.role }}</p>{% endif %}
          {% if member.bio %}<p class="bio">{{ member.bio }}</p>{% endif %}
          <p class="links">
            {% if member.github %}<a href="{{ member.github }}" target="_blank">GitHub</a>{% endif %}
            {% if member.website %}<a href="{{ member.website }}" target="_blank">Website</a>{% endif %}
            {% if member.linkedin %}<a href="{{ member.linkedin }}" target="_blank">LinkedIn</a>{% endif %}
            {% if member.email %}<a href="mailto:{{ member.email }}">Email</a>{% endif %}
          </p>
        </div>
      </div>
    {% endfor %}
  </div>
</div>
