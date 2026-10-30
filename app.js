// Blush & Bloom — Salon & Spa
// Booking + motion system (vanilla JS + GSAP for the hero, when it loads).
//
// ARCHITECTURE NOTE (read before extending): this website is a static site
// hosted on GitHub Pages. There is no server, no database and no backend API
// for it, so bookings are NOT stored on a server. The booking flow below is
// genuinely functional within that architecture: the form validates, builds
// a booking reference, shows a review screen, and hands the complete booking
// to the salon over WhatsApp — the WhatsApp message IS the booking record,
// and the salon approves or declines it in chat. Do not add a fake admin
// dashboard or pretend database: a real one needs a backend (server +
// database + login) added to the hosting first.
(function () {
  "use strict";

  // ---------- Config: the ONE place the WhatsApp number lives ----------
  // Change this value and every WhatsApp link and booking message follows.
  var WHATSAPP_NUMBER = "918292160777";
  var WHATSAPP_DEFAULT_TEXT = "Hi Blush & Bloom, I want to book an appointment.";

  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var FINE_POINTER = window.matchMedia("(pointer: fine)").matches;

  function $(id) { return document.getElementById(id); }
  function waLink(text) {
    return "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(text);
  }
  function pad(n) { return (n < 10 ? "0" : "") + n; }

  // ---------- WhatsApp links follow the configurable number ----------
  document.querySelectorAll("[data-wa]").forEach(function (a) {
    a.setAttribute("href", waLink(WHATSAPP_DEFAULT_TEXT));
  });

  // ---------- Headline word split (for the staggered hero reveal) ----------
  (function splitHeadline() {
    var h1 = document.querySelector(".hero-copy h1");
    if (!h1) return;
    var frag = document.createDocumentFragment();
    var index = 0;
    Array.prototype.slice.call(h1.childNodes).forEach(function (node) {
      if (node.nodeType === 3) {
        node.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
          var line = document.createElement("span");
          line.className = "w-line";
          var w = document.createElement("span");
          w.className = "w";
          w.textContent = part;
          w.style.setProperty("--di", (index * 0.07) + "s");
          index++;
          line.appendChild(w);
          frag.appendChild(line);
        });
      } else if (node.nodeName === "BR") {
        frag.appendChild(document.createElement("br"));
      } else {
        frag.appendChild(node.cloneNode(true));
      }
    });
    h1.textContent = "";
    h1.appendChild(frag);
  })();

  // ---------- Preloader + hero entrance ----------
  var preloader = $("preloader");
  var heroStarted = false;
  var startedAt = Date.now();

  function heroGsap() {
    var tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    var words = document.querySelectorAll(".hero-copy .w");
    if (words.length) {
      tl.fromTo(words, { yPercent: 115 }, { yPercent: 0, duration: 0.9, stagger: 0.07 }, 0);
    }
    tl.fromTo(".hero-sub", { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, 0.45);
    tl.fromTo(".hero-cta", { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, 0.6);
    tl.fromTo(".hero-hours", { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, 0.75);
    tl.fromTo(".hero-photo", { clipPath: "inset(0 0 100% 0)" },
      { clipPath: "inset(0 0 0 0)", duration: 1, clearProps: "clipPath" }, 0.3);
    tl.fromTo(".hero-photo .photo-slot", { scale: 1.08 }, { scale: 1, duration: 1.3 }, 0.3);
    tl.fromTo(".wa-float", { y: 18, opacity: 0, scale: 0.9 },
      { y: 0, opacity: 1, scale: 1, duration: 0.6 }, 1);
  }

  function startHero() {
    if (heroStarted) return;
    heroStarted = true;
    if (preloader) preloader.classList.add("done");
    if (REDUCED) return; // content stays fully visible, nothing animates
    setTimeout(function () {
      if (window.gsap) { heroGsap(); }
      else { document.body.classList.add("hero-in"); } // CSS fallback animations
    }, 150);
  }
  function hidePreloader() {
    if (REDUCED) { startHero(); return; }
    var wait = Math.max(0, 600 - (Date.now() - startedAt));
    setTimeout(startHero, wait);
  }
  window.addEventListener("load", hidePreloader);
  setTimeout(hidePreloader, 2500); // hard fallback: never trap visitors

  // ---------- Scroll: header shadow, scroll hint, gentle hero parallax ----------
  var head = $("siteHead");
  var heroPhoto = document.querySelector(".hero-photo");
  var hint = document.querySelector(".scroll-hint");
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var y = window.scrollY || window.pageYOffset;
      if (head) head.classList.toggle("scrolled", y > 10);
      if (hint) hint.classList.toggle("gone", y > 60);
      if (!REDUCED && FINE_POINTER && heroPhoto) {
        var rect = heroPhoto.getBoundingClientRect();
        if (rect.bottom > 0 && rect.top < window.innerHeight) {
          heroPhoto.style.transform = "translateY(" + Math.min(y * 0.06, 48).toFixed(1) + "px)";
        }
      }
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // ---------- Mobile menu (animated open/close, hamburger morphs to X) ----------
  var menuBtn = $("menuBtn");
  var nav = $("mainNav");
  function closeMenu() {
    if (!nav || !menuBtn) return;
    nav.classList.remove("open");
    menuBtn.classList.remove("open");
    menuBtn.setAttribute("aria-expanded", "false");
    menuBtn.setAttribute("aria-label", "Open menu");
  }
  if (menuBtn && nav) {
    menuBtn.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      menuBtn.classList.toggle("open", open);
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
      menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 900) closeMenu();
    });
  }

  // ---------- Active navigation indicator ----------
  var navLinks = document.querySelectorAll("#mainNav a");
  var sectionMap = {};
  navLinks.forEach(function (a) {
    var href = a.getAttribute("href") || "";
    if (href.charAt(0) === "#") sectionMap[href.slice(1)] = a;
  });
  if ("IntersectionObserver" in window) {
    var navObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          navLinks.forEach(function (l) { l.classList.remove("active"); });
          var link = sectionMap[entry.target.id];
          if (link) link.classList.add("active");
        }
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    ["services", "prices", "gallery", "transformations", "bridal", "visit"].forEach(function (id) {
      var s = document.getElementById(id);
      if (s) navObs.observe(s);
    });
  }

  // ---------- Scroll reveals (staggered by CSS delays) ----------
  // Content is hidden ONLY when JS confirms it can reveal it again, so a
  // script failure can never leave content invisible.
  if (!REDUCED && "IntersectionObserver" in window) {
    document.documentElement.classList.add("js-reveal");
    var revealEls = [];
    document.querySelectorAll(".reveal").forEach(function (el) { revealEls.push(el); });
    document.querySelectorAll(".section h2, .section .kicker, .price-note, .foot-in, .trust-in").forEach(function (el) {
      if (!el.closest(".reveal")) { el.classList.add("reveal"); revealEls.push(el); }
    });
    var revObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          revObs.unobserve(entry.target); // listener cleaned up after use
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(function (el) { revObs.observe(el); });
  }

  // ---------- FAQ accordion (smooth, one open at a time) ----------
  document.querySelectorAll(".faq-item").forEach(function (item) {
    var btn = item.querySelector(".faq-q");
    var panel = item.querySelector(".faq-a");
    if (!btn || !panel) return;
    btn.addEventListener("click", function () {
      var isOpen = item.classList.contains("open");
      document.querySelectorAll(".faq-item.open").forEach(function (other) {
        other.classList.remove("open");
        other.querySelector(".faq-q").setAttribute("aria-expanded", "false");
        other.querySelector(".faq-a").style.maxHeight = "0px";
      });
      if (!isOpen) {
        item.classList.add("open");
        btn.setAttribute("aria-expanded", "true");
        panel.style.maxHeight = panel.scrollHeight + "px";
      }
    });
  });
  window.addEventListener("resize", function () {
    document.querySelectorAll(".faq-item.open .faq-a").forEach(function (p) {
      p.style.maxHeight = p.scrollHeight + "px";
    });
  });

  // ================= BOOKING SYSTEM =================
  // Treatments come from the site's own price list and service descriptions.
  var TREATMENTS = {
    "Hair Studio": ["Haircut & wash", "Hair colour", "Keratin treatment", "Head massage"],
    "Skin & Facials": ["Facial clean-up", "Signature facial", "De-tan ritual"],
    "Spa & Massage": ["Body spa", "Aromatherapy", "Head massage"],
    "Bridal & Occasion": ["Essential bridal", "Signature bridal", "Royal bridal", "Party makeup"],
    "Nails": ["Manicure", "Pedicure"],
    "Waxing & Threading": ["Waxing, full arms & legs", "Threading", "Tinting"]
  };

  var form = $("bookForm");
  var serviceSel = $("bkService");
  var treatSel = $("bkTreatment");
  var dateInput = $("bkDate");
  var confirmPanel = $("bookConfirm");
  var formMsg = $("formMsg");
  var currentBooking = null;

  var FIELD_IDS = {
    Name: ["bkName", "errName"],
    Phone: ["bkPhone", "errPhone"],
    Email: ["bkEmail", "errEmail"],
    Service: ["bkService", "errService"],
    Treatment: ["bkTreatment", "errTreatment"],
    Date: ["bkDate", "errDate"],
    Time: ["bkTime", "errTime"]
  };

  function setError(field, msg) {
    var ids = FIELD_IDS[field];
    if (!ids) return;
    var input = $(ids[0]);
    var err = $(ids[1]);
    if (err) err.textContent = msg;
    if (input) {
      var wrapper = input.closest(".field");
      if (wrapper) wrapper.classList.add("field-error");
    }
  }
  function clearError(field) {
    var ids = FIELD_IDS[field];
    if (!ids) return;
    var input = $(ids[0]);
    var err = $(ids[1]);
    if (err) err.textContent = "";
    if (input) {
      var wrapper = input.closest(".field");
      if (wrapper) wrapper.classList.remove("field-error");
    }
  }
  function hideMsg() {
    if (!formMsg) return;
    formMsg.hidden = true;
    formMsg.textContent = "";
    formMsg.classList.remove("show");
  }
  Object.keys(FIELD_IDS).forEach(function (field) {
    var input = $(FIELD_IDS[field][0]);
    if (!input) return;
    input.addEventListener("input", function () { clearError(field); hideMsg(); });
    input.addEventListener("change", function () { clearError(field); });
  });

  // Past dates are not selectable, and the date picker cannot go before today.
  if (dateInput) {
    var t = new Date();
    dateInput.setAttribute("min", t.getFullYear() + "-" + pad(t.getMonth() + 1) + "-" + pad(t.getDate()));
  }

  function resetTreatment(placeholder) {
    if (!treatSel) return;
    treatSel.innerHTML = "";
    var opt = document.createElement("option");
    opt.value = ""; opt.disabled = true; opt.selected = true; opt.textContent = placeholder;
    treatSel.appendChild(opt);
    treatSel.disabled = true;
    treatSel.value = "";
  }
  function populateTreatments(service) {
    if (!treatSel) return;
    if (!service) { resetTreatment("Select a service first"); return; }
    if (service === "Not sure yet") {
      treatSel.innerHTML = "";
      var only = document.createElement("option");
      only.value = "No specific treatment yet"; only.selected = true;
      only.textContent = "No specific treatment yet";
      treatSel.appendChild(only);
      treatSel.disabled = true;
      return;
    }
    var list = TREATMENTS[service] || [];
    treatSel.innerHTML = "";
    var ph = document.createElement("option");
    ph.value = ""; ph.disabled = true; ph.selected = true; ph.textContent = "Select a treatment";
    treatSel.appendChild(ph);
    list.forEach(function (name) {
      var o = document.createElement("option");
      o.value = name; o.textContent = name;
      treatSel.appendChild(o);
    });
    treatSel.disabled = false;
  }
  if (serviceSel && treatSel) {
    serviceSel.addEventListener("change", function () {
      populateTreatments(serviceSel.value);
      clearError("Service");
      clearError("Treatment");
    });
    treatSel.addEventListener("change", function () { clearError("Treatment"); });
  }

  function validIndianPhone(raw) {
    var d = (raw || "").replace(/\D/g, "");
    if (d.length === 12 && d.indexOf("91") === 0) d = d.slice(2);
    else if (d.length === 11 && d.charAt(0) === "0") d = d.slice(1);
    return /^[6-9]\d{9}$/.test(d) ? d : null;
  }
  function formatDate(iso) {
    var p = iso.split("-");
    return p[2] + "/" + p[1] + "/" + p[0];
  }
  function isPastDate(iso) {
    var d = new Date(iso + "T00:00:00");
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    return d < today;
  }
  function makeRef(dateIso) {
    var ddmm = dateIso ? dateIso.slice(8, 10) + dateIso.slice(5, 7) : "0000";
    var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    var s = "";
    for (var i = 0; i < 4; i++) s += chars.charAt(Math.floor(Math.random() * chars.length));
    return "BB-" + ddmm + "-" + s;
  }
  function bookingKey(b) {
    return [b.name.toLowerCase(), b.phone, b.service, b.treatment, b.date, b.time].join("|");
  }
  function readLastBooking() {
    try { return JSON.parse(sessionStorage.getItem("bb_last_booking") || "null"); }
    catch (e) { return null; }
  }
  function storeLastBooking(b) {
    try {
      sessionStorage.setItem("bb_last_booking",
        JSON.stringify({ key: bookingKey(b), at: Date.now(), ref: b.ref }));
    } catch (e) { /* private mode: duplicate guard simply does not persist */ }
  }
  function collectBooking() {
    return {
      name: $("bkName").value.trim(),
      phone: validIndianPhone($("bkPhone").value),
      email: $("bkEmail").value.trim(),
      service: serviceSel.value,
      treatment: treatSel.value,
      specialist: $("bkSpecialist").value.trim(),
      date: dateInput.value,
      time: $("bkTime").value,
      note: $("bkNote").value.trim()
    };
  }
  function bookingMessage(b) {
    var lines = [
      "Hi Blush & Bloom, I would like to book an appointment.",
      "",
      "Booking reference: " + b.ref,
      "Name: " + b.name,
      "Phone: +91 " + b.phone,
      "Service: " + b.service
    ];
    if (b.treatment && b.treatment !== "No specific treatment yet") lines.push("Treatment: " + b.treatment);
    if (b.email) lines.push("Email: " + b.email);
    if (b.specialist) lines.push("Preferred stylist/specialist: " + b.specialist);
    lines.push("Preferred date: " + formatDate(b.date));
    lines.push("Preferred time: " + b.time);
    if (b.note) lines.push("Additional instructions: " + b.note);
    lines.push("", "Please confirm my appointment.");
    return lines.join("\n");
  }

  function showConfirmation(b) {
    var rows = [
      ["Name", b.name],
      ["Phone", "+91 " + b.phone],
      ["Service", b.service]
    ];
    if (b.treatment && b.treatment !== "No specific treatment yet") rows.push(["Treatment", b.treatment]);
    if (b.email) rows.push(["Email", b.email]);
    if (b.specialist) rows.push(["Preferred stylist/specialist", b.specialist]);
    rows.push(["Preferred date", formatDate(b.date)]);
    rows.push(["Preferred time", b.time]);
    if (b.note) rows.push(["Additional instructions", b.note]);
    var list = $("confirmList");
    list.textContent = "";
    rows.forEach(function (r) {
      var div = document.createElement("div");
      var dt = document.createElement("dt"); dt.textContent = r[0];
      var dd = document.createElement("dd"); dd.textContent = r[1];
      div.appendChild(dt); div.appendChild(dd); list.appendChild(div);
    });
    $("confirmRef").textContent = b.ref;
    form.hidden = true;
    confirmPanel.hidden = false;
    confirmPanel.classList.remove("show");
    void confirmPanel.offsetWidth;
    confirmPanel.classList.add("show");
    confirmPanel.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth", block: "start" });
    confirmPanel.focus({ preventScroll: true });
  }
  function showFormAgain() {
    confirmPanel.hidden = true;
    form.hidden = false;
    hideMsg();
  }
  function showDuplicate(b) {
    formMsg.hidden = false;
    formMsg.textContent = "";
    var text = document.createElement("span");
    text.textContent = "This exact booking was already sent a few minutes ago. " +
      "If you changed something, edit the details and submit again — or send it once more below.";
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn btn-ghost";
    btn.textContent = "Send again on WhatsApp";
    btn.addEventListener("click", function () { openWhatsAppFor(b); });
    formMsg.appendChild(text);
    formMsg.appendChild(document.createElement("br"));
    formMsg.appendChild(btn);
    formMsg.classList.remove("show");
    void formMsg.offsetWidth;
    formMsg.classList.add("show");
    formMsg.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth", block: "center" });
  }
  function openWhatsAppFor(b) {
    var win = window.open(waLink(bookingMessage(b)), "_blank");
    var btn = $("confirmWhatsApp");
    if (win) {
      storeLastBooking(b);
      if (btn) {
        var old = btn.textContent;
        btn.textContent = "Opening WhatsApp…";
        btn.classList.add("btn-loading");
        setTimeout(function () {
          btn.textContent = old;
          btn.classList.remove("btn-loading");
        }, 2000);
      }
    } else if (btn) {
      btn.textContent = "WhatsApp did not open — tap again";
      setTimeout(function () { btn.textContent = "Confirm on WhatsApp"; }, 3000);
    }
  }

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      hideMsg();
      var b = collectBooking();
      var firstBad = null;
      function bad(field, msg) {
        setError(field, msg);
        if (!firstBad) firstBad = field;
      }
      if (!b.name || b.name.length < 2) bad("Name", "Please enter your full name.");
      if (!b.phone) bad("Phone", "Please enter a valid 10-digit Indian mobile number.");
      if (b.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email)) {
        bad("Email", "Please enter a valid email address, or leave it blank.");
      }
      if (!b.service) bad("Service", "Please choose a service.");
      if (b.service && b.service !== "Not sure yet" && !b.treatment) {
        bad("Treatment", "Please choose a treatment.");
      }
      if (!b.date) bad("Date", "Please choose a date.");
      else if (isPastDate(b.date)) bad("Date", "Past dates are not available. Please choose today or a future date.");
      if (!b.time) bad("Time", "Please choose a time slot.");
      if (firstBad) {
        var input = $(FIELD_IDS[firstBad][0]);
        if (input) input.focus();
        return;
      }
      // Reuse the earlier reference if this exact booking was already made,
      // so a resend never creates a second, confusing reference.
      var prev = readLastBooking();
      if (prev && prev.key === bookingKey(b)) { b.ref = prev.ref; }
      else { b.ref = makeRef(b.date); }
      currentBooking = b;
      if (prev && prev.key === bookingKey(b) && Date.now() - prev.at < 10 * 60 * 1000) {
        showDuplicate(b);
        return;
      }
      var submitBtn = $("bookSubmit");
      var oldText = submitBtn ? submitBtn.textContent : "";
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.classList.add("btn-loading");
        submitBtn.textContent = "Preparing booking…";
      }
      setTimeout(function () {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.classList.remove("btn-loading");
          submitBtn.textContent = oldText;
        }
        showConfirmation(b);
      }, 350);
    });
  }

  var confirmBtn = $("confirmWhatsApp");
  if (confirmBtn) {
    confirmBtn.addEventListener("click", function () {
      if (currentBooking) openWhatsAppFor(currentBooking);
    });
  }
  var editBtn = $("editBooking");
  if (editBtn) {
    editBtn.addEventListener("click", function () {
      showFormAgain();
      var nameInput = $("bkName");
      if (nameInput) nameInput.focus();
    });
  }
  var againBtn = $("againBooking");
  if (againBtn) {
    againBtn.addEventListener("click", function () {
      form.reset();
      resetTreatment("Select a service first");
      showFormAgain();
      var nameInput = $("bkName");
      if (nameInput) nameInput.focus();
    });
  }

  // Service / bridal "Book this" buttons prefill the form and scroll to it.
  document.querySelectorAll("[data-service]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var svc = btn.getAttribute("data-service");
      if (serviceSel) {
        serviceSel.value = svc;
        populateTreatments(svc);
        clearError("Service");
        clearError("Treatment");
      }
      if (confirmPanel && !confirmPanel.hidden) showFormAgain();
      var book = $("book");
      if (book) book.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth" });
      if (form) {
        form.classList.remove("flash");
        void form.offsetWidth;
        form.classList.add("flash");
        setTimeout(function () { form.classList.remove("flash"); }, 1800);
      }
      var nameInput = $("bkName");
      if (nameInput) nameInput.focus({ preventScroll: true });
    });
  });

  // ================= GALLERY FILTERS =================
  var galGrid = $("galGrid");
  var galCount = $("galCount");
  var galEmpty = $("galEmpty");
  function updateGalCount() {
    var all = document.querySelectorAll(".gal").length;
    var shown = document.querySelectorAll(".gal:not(.hide)").length;
    if (galCount) galCount.textContent = "Showing " + shown + " of " + all;
    if (galEmpty) galEmpty.hidden = shown !== 0;
  }
  document.querySelectorAll(".gal-filter").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".gal-filter").forEach(function (b) {
        b.classList.remove("active");
        b.setAttribute("aria-pressed", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-pressed", "true");
      var filter = btn.getAttribute("data-filter");
      if (galGrid) galGrid.classList.add("fading");
      setTimeout(function () {
        document.querySelectorAll(".gal").forEach(function (tile) {
          var show = filter === "all" || tile.getAttribute("data-category") === filter;
          tile.classList.toggle("hide", !show);
        });
        if (galGrid) galGrid.classList.remove("fading");
        updateGalCount();
      }, 220);
    });
  });
  updateGalCount();

  // ================= TRANSFORMATIONS =================
  // A card appears only when it holds BOTH a before and an after photo that
  // actually loaded. One photo alone is never displayed.
  var transformSection = $("transformations");
  var transformNavAdded = false;
  function checkTransformCards() {
    if (!transformSection) return;
    var anyReady = false;
    document.querySelectorAll(".transform-card").forEach(function (card) {
      var before = card.querySelector(".ba.before img");
      var after = card.querySelector(".ba.after img");
      function imgOk(img) { return !!img && img.complete && img.naturalWidth > 0; }
      var ready = imgOk(before) && imgOk(after);
      card.classList.toggle("ready", ready);
      card.querySelectorAll(".ba").forEach(function (ba) {
        if (ba.querySelector("img")) ba.classList.add("has-img");
      });
      if (ready) anyReady = true;
    });
    if (anyReady) {
      transformSection.hidden = false;
      if (!transformNavAdded && nav) {
        var bridalLink = nav.querySelector('a[href="#bridal"]');
        var link = document.createElement("a");
        link.setAttribute("href", "#transformations");
        link.textContent = "Transformations";
        if (bridalLink) nav.insertBefore(link, bridalLink);
        else nav.appendChild(link);
        sectionMap["transformations"] = link;
        link.addEventListener("click", closeMenu);
        transformNavAdded = true;
      }
    } else {
      transformSection.hidden = true;
    }
  }
  document.querySelectorAll(".transform-card .ba img").forEach(function (img) {
    img.addEventListener("load", checkTransformCards);
    img.addEventListener("error", checkTransformCards);
  });
  window.addEventListener("load", checkTransformCards);
  checkTransformCards();

  // ================= GALLERY LIGHTBOX =================
  // Only tiles that contain a real photograph open the viewer. Placeholder
  // tiles stay inert until a photo is added — no empty lightbox, ever.
  var CATEGORY_NAMES = {
    hair: "Hair",
    skin: "Skin & Facial",
    nails: "Nails",
    bridal: "Bridal Makeup",
    spa: "Spa",
    interior: "Salon Interior"
  };
  var tiles = [];
  document.querySelectorAll(".gal").forEach(function (tile) {
    var img = tile.querySelector("img");
    if (!img) return;
    tile.classList.add("has-img");
    tile.setAttribute("tabindex", "0");
    tile.setAttribute("role", "button");
    var label = tile.querySelector("span");
    var cat = CATEGORY_NAMES[tile.getAttribute("data-category")] || "";
    tiles.push({
      el: tile,
      src: img.getAttribute("src"),
      alt: img.getAttribute("alt") || (label ? label.textContent : "Gallery photo"),
      caption: label ? (cat ? label.textContent + " · " + cat : label.textContent) : ""
    });
    // A broken image must never leave a broken frame: fall back to the
    // labelled placeholder instead.
    img.addEventListener("error", function () {
      tile.classList.remove("has-img");
      tile.removeAttribute("tabindex");
      tile.removeAttribute("role");
      img.remove();
    });
  });
  var lightbox = $("lightbox");
  var lbImg = $("lbImg");
  var lbCap = $("lbCap");
  var lbIndex = 0;
  var lbList = [];
  var lastFocus = null;
  var touchX = null;
  function currentList() {
    return tiles.filter(function (t) {
      return t.el.classList.contains("has-img") && !t.el.classList.contains("hide");
    });
  }
  function showLb(i) {
    if (!lbList.length) return;
    lbIndex = (i + lbList.length) % lbList.length;
    lbImg.setAttribute("src", lbList[lbIndex].src);
    lbImg.setAttribute("alt", lbList[lbIndex].alt);
    lbCap.textContent = lbList[lbIndex].caption;
  }
  function openLightbox(i) {
    lbList = currentList();
    if (!lbList.length) return;
    var pos = lbList.indexOf(tiles[i]);
    if (pos < 0) return;
    lastFocus = document.activeElement;
    showLb(pos);
    lightbox.hidden = false;
    requestAnimationFrame(function () { lightbox.classList.add("open"); });
    document.body.style.overflow = "hidden";
    var close = $("lbClose");
    if (close) close.focus();
  }
  function closeLightbox() {
    lightbox.classList.remove("open");
    document.body.style.overflow = "";
    setTimeout(function () { lightbox.hidden = true; }, 350);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  if (lightbox && tiles.length) {
    tiles.forEach(function (tile, i) {
      tile.el.addEventListener("click", function () { openLightbox(i); });
      tile.el.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openLightbox(i); }
      });
    });
    $("lbClose").addEventListener("click", closeLightbox);
    $("lbPrev").addEventListener("click", function () { showLb(lbIndex - 1); });
    $("lbNext").addEventListener("click", function () { showLb(lbIndex + 1); });
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener("keydown", function (e) {
      if (lightbox.hidden) return;
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowLeft") showLb(lbIndex - 1);
      else if (e.key === "ArrowRight") showLb(lbIndex + 1);
    });
    lightbox.addEventListener("touchstart", function (e) {
      touchX = e.changedTouches[0].clientX;
    }, { passive: true });
    lightbox.addEventListener("touchend", function (e) {
      if (touchX === null) return;
      var dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 50) showLb(lbIndex + (dx < 0 ? 1 : -1));
      touchX = null;
    }, { passive: true });
  }
})();
