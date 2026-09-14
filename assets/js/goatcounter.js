// Single source for the GoatCounter endpoint. Blank it to stop counting.
window.goatcounter = { endpoint: 'https://tappas.goatcounter.com/count' };

(function () {
  if (!window.goatcounter.endpoint) return;
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://gc.zgo.at/count.js';
  document.head.appendChild(s);
})();
