![](img/tappa_logo.png)

# Contribution guide

## Prerequisites
- Ruby (version 2.7.0 or higher)
- Jekyll (a Ruby gem for building static sites)

This site is built with [Jekyll](https://jekyllrb.com/) and [So Simple](https://mmistakes.github.io/so-simple-theme/). Check out Jekyll's [guide](https://jekyllrb.com/docs/installation/#guides) for installation.

## Getting started

Run `bundle install` and `bundle exec jekyll serve` to build and serve the site locally.

## Adding content

### Site structure

- pages: `*.md` files (in root directory and `_posts/` and `_projects/` subdirectories)
- resources: `_data/`
  - site navigation: `_data/navigation.yml`
- images: `images/`


**Pages**

```
├── _posts/        # Collection of news and events
├── _projects/     # Collection of project pages
├── about.md       # 'About us' page
├── confidants.md  # 'Confidants' page
├── contact.md     # 'Get in touch' page
├── events.md      # 'News' page
├── index.md       # 'Home' page
└── projects.md    # 'Projects' page
```

Use these as templates for creating new pages.


