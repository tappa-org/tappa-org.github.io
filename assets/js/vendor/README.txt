Vendored third-party scripts
============================

Font Awesome used to be loaded from use.fontawesome.com on every page,
which disclosed every visitor's IP address to that CDN. It is now served
from this origin.

  fontawesome-all-5.0.12.js    - Font Awesome Free 5.0.12
                                 Icons: CC BY 4.0 - Fonts: SIL OFL 1.1 - Code: MIT
                                 https://fontawesome.com/license
                                 Checked: it makes no network requests of its
                                 own. The only URLs inside it are the SVG
                                 namespace and its licence comment.

jQuery was vendored here too, briefly. It is gone: see assets/js/main.js
for what replaced it, and note that removing it also removed
CVE-2019-11358, CVE-2020-11022 and CVE-2020-11023, none of which will ever
be fixed in 3.3.1.

NOTE: this directory was invisible to git until .gitignore's unanchored
`vendor` pattern was anchored to `/vendor`. If you add files here, check
`git status` actually sees them.
