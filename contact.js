// contact.html: show the thank-you (and its animal photo) or an error after the form posts
// to /api/contact and the Worker redirects back here. All page text is set with textContent.
(function () {
    "use strict";

    var params = new URLSearchParams(location.search);
    var form = document.getElementById("contact-form");
    var DRAFT_KEY = "contact-draft";
    var FIELDS = ["name", "email", "subject", "message"];
    var IMG_PATTERN = /^[a-z]+-\d{2}\.jpg$/;
    // Cloudflare's documented always-pass test sitekey, used only when running locally.
    var TEST_SITEKEY = "1x00000000000000000000AA";
    var isLocal = /^(127\.0\.0\.1|localhost)$/.test(location.hostname);

    // Called by Turnstile's api.js (loaded with render=explicit&onload=contactTurnstileLoad).
    // The widget puts its token in a hidden cf-turnstile-response field inside the form.
    window.contactTurnstileLoad = function () {
        var box = document.getElementById("contact-turnstile");
        if (!box || form.hidden || !window.turnstile) return;
        window.turnstile.render(box, {
            sitekey: isLocal ? TEST_SITEKEY : box.getAttribute("data-sitekey"),
            action: "contact",
            theme: "auto"
        });
    };

    function store(fn) {
        try { return fn(window.sessionStorage); } catch (e) { return null; }
    }

    if (params.get("sent") === "1") {
        store(function (s) { s.removeItem(DRAFT_KEY); });
        form.hidden = true;
        document.getElementById("contact-thanks").hidden = false;
        document.getElementById("contact-thanks-title").textContent = "Thankyou!";

        var img = params.get("img") || "";
        if (IMG_PATTERN.test(img)) {
            var photo = document.getElementById("contact-photo-img");
            photo.src = "media/animals/" + img;
            var caption = document.getElementById("contact-photo-caption");
            caption.appendChild(document.createTextNode("AI-generated photo · made with "));
            var link = document.createElement("a");
            link.href = "https://huggingface.co/stabilityai/sd-turbo";
            link.target = "_blank";
            link.rel = "noopener";
            link.textContent = "SD-Turbo";
            caption.appendChild(link);
            document.getElementById("contact-photo").hidden = false;
        }
        return;
    }

    var error = params.get("error");
    if (error) {
        var messages = {
            invalid: "Please check the form and try again.",
            busy: "I’m getting a lot of messages right now. Please try again in an hour.",
            captcha: "The human check didn’t go through. Please wait for it to finish, then send again.",
            server: "Something went wrong saving your message. Please try again in a moment."
        };
        var field = params.get("field");
        var text = messages[error] || messages.server;
        if (error === "invalid" && FIELDS.indexOf(field) !== -1) {
            text = "Please check the " + field + " field and try again.";
        }
        var box = document.getElementById("contact-error");
        box.textContent = text;
        box.hidden = false;

        // Put back what the visitor typed before the round trip.
        var draft = store(function (s) { return JSON.parse(s.getItem(DRAFT_KEY) || "null"); });
        if (draft) {
            FIELDS.forEach(function (f) {
                if (typeof draft[f] === "string") form.elements[f].value = draft[f];
            });
        }
        if (FIELDS.indexOf(field) !== -1) form.elements[field].focus();
    }

    // One submit per page load. The pressed button must stay enabled until the browser has
    // built the form data (a disabled submitter is left out, losing the animal choice), so the
    // buttons are disabled on the next tick, and a flag stops any second submit before that.
    var submitting = false;
    form.addEventListener("submit", function (event) {
        if (submitting) {
            event.preventDefault();
            return;
        }
        submitting = true;
        var draft = {};
        FIELDS.forEach(function (f) { draft[f] = form.elements[f].value; });
        store(function (s) { s.setItem(DRAFT_KEY, JSON.stringify(draft)); });
        setTimeout(function () {
            Array.prototype.forEach.call(form.querySelectorAll("button"), function (b) { b.disabled = true; });
        }, 0);
    });
})();
