/* Site behaviour.
 *
 * This used to be a jQuery bundle (jQuery + jquery.smooth-scroll + lity).
 * jQuery was carrying three jobs:
 *
 *   $(document).ready(...)   -> DOMContentLoaded
 *   $("a").smoothScroll(...) -> `scroll-behavior: smooth` in assets/css/site.css
 *   lity on image links      -> dropped; nothing on this site links straight
 *                               to a .jpg/.png/.gif, so the lightbox never
 *                               had anything to open
 *
 * which left the menu toggle, and that was already plain DOM code. So the
 * dependency is gone, and with it jQuery 3.3.1's CVE-2019-11358,
 * CVE-2020-11022 and CVE-2020-11023.
 *
 * There is no build step in this repo: assets/js/main.min.js is committed
 * by hand. Keep the two in step.
 */
document.addEventListener('DOMContentLoaded', function () {
  var toggleButton = document.getElementById('menu-toggle');
  var menu = document.getElementById('primary-nav');

  if (toggleButton && menu) {
    toggleButton.addEventListener('click', function () {
      menu.classList.toggle('js-menu-is-open');
    });
  }
});
