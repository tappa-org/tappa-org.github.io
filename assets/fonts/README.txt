Self-hosted webfonts
====================

These faces used to be fetched from fonts.googleapis.com on every page
load, which disclosed every visitor's IP address to Google. They are now
served from this origin, so no third party is contacted to render the
site. The magazine at magazine/issue-1/ has always done this; this brings
the rest of the site into line.

  Lora              — SIL Open Font License 1.1, see OFL-Lora.txt
  Source Sans Pro   — SIL Open Font License 1.1, see OFL-SourceSansPro.txt

Only the latin and latin-ext subsets are kept. The Cyrillic, Greek, math,
symbol and Vietnamese subsets Google also offers came to about 570 kB and
are not needed for this site's content; text outside those ranges falls
back to the next font in the stack.

The @font-face rules live in assets/css/fonts.css and are generated, along
with these files, by scratchpad/fonts.py.
