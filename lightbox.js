// Click-to-zoom lightbox for img.zoomable. Kept out of the HTML so the CSP needs no 'unsafe-inline' for scripts.
(function () {
    var box = document.getElementById('lightbox');
    if (!box || typeof box.showModal !== 'function') return;
    var img = box.querySelector('img');
    function open(src, alt) { img.src = src; img.alt = alt; box.showModal(); }
    function close() { box.close(); img.src = ''; }
    document.querySelectorAll('img.zoomable').forEach(function (el) {
        el.addEventListener('click', function () { open(el.currentSrc || el.src, el.alt); });
        el.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(el.currentSrc || el.src, el.alt); }
        });
    });
    box.querySelector('.lightbox-close').addEventListener('click', close);
    img.addEventListener('click', close);
    box.addEventListener('click', function (e) { if (e.target === box) close(); });
})();
