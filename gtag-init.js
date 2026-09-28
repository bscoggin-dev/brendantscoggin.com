// Google Analytics (GA4) bootstrap. Kept out of the HTML so the CSP needs no 'unsafe-inline' for scripts.
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-NPWZK8VW4K');

// The clicks that mean the site did its job for a hiring reader, plus reads of a linked LinkedIn post.
// One delegated listener covers every link on every page, including ones added later.
// link_location says which link it was: a data-cta value, "nav", or "body".
(function () {
    function eventFor(href) {
        if (/^mailto:/i.test(href)) return 'email_click';
        if (/linkedin\.com\/in\//i.test(href)) return 'linkedin_click';
        if (/linkedin\.com\/(?:feed\/update|posts)\//i.test(href)) return 'linkedin_post_click';
        if (/\.pdf(?:[?#]|$)/i.test(href)) return 'resume_pdf_download';
        if (/(?:^|\/)resume\.html(?:[?#]|$)/i.test(href)) return 'resume_open';
        return null;
    }

    function track(e) {
        if (e.type === 'auxclick' && e.button !== 1) return;
        var link = e.target.closest && e.target.closest('a[href]');
        if (!link) return;
        var name = eventFor(link.getAttribute('href'));
        if (!name) return;
        var cta = link.closest('[data-cta]');
        gtag('event', name, {
            link_location: cta ? cta.getAttribute('data-cta') : (link.closest('nav') ? 'nav' : 'body'),
            link_url: link.href,
            transport_type: 'beacon'
        });
    }

    document.addEventListener('click', track, true);
    document.addEventListener('auxclick', track, true);
})();
