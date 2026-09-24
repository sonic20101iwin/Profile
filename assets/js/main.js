/**
* Template Name: iPortfolio
* Customised for: Alex Smith - Aurora design system
* Library stack: Bootstrap 5.3.3, AOS, Typed.js, PureCounter, Waypoints,
*                GLightbox, imagesLoaded + Isotope, Swiper
*
* Every initialiser is feature-detected and guarded, so a missing node or an
* unavailable vendor script on one page can never abort the rest of the script.
* Scroll work is requestAnimationFrame throttled and registered as passive.
*/

(function () {
  "use strict";

  /* ------------------------------------------------------------------
   * Environment helpers
   * ---------------------------------------------------------------- */

  var reduceMotion = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

  var has = function (name) { return typeof window[name] !== "undefined"; };

  /** Run an initialiser in isolation so one failure cannot break the others. */
  function safely(label, fn) {
    try {
      fn();
    } catch (error) {
      console.warn("[iPortfolio] \"" + label + "\" skipped:", error);
    }
  }

  /** requestAnimationFrame throttle - avoids layout thrash on scroll. */
  function rafThrottle(callback) {
    var queued = false;
    return function throttled() {
      if (queued) { return; }
      queued = true;
      window.requestAnimationFrame(function () {
        queued = false;
        callback();
      });
    };
  }

  function onReady(fn) {
    if (document.readyState !== "loading") {
      fn();
    } else {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    }
  }

  function onLoad(fn) {
    window.addEventListener("load", fn, { once: true });
  }

  /* Body scroll lock while the mobile drawer is open. */
  var scrollLocks = 0;

  function lockScroll() {
    scrollLocks = scrollLocks + 1;
    if (scrollLocks === 1) { document.body.style.overflow = "hidden"; }
  }

  function unlockScroll() {
    if (scrollLocks === 0) { return; }
    scrollLocks = scrollLocks - 1;
    if (scrollLocks === 0) { document.body.style.overflow = ""; }
  }

  /* ------------------------------------------------------------------
   * Theme switch (persisted, respects prefers-color-scheme)
   * ---------------------------------------------------------------- */

  var THEME_KEY = "as-theme";
  var themeToggle = document.querySelector(".theme-toggle");

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);

    if (themeToggle) {
      themeToggle.setAttribute("aria-pressed", String(theme === "light"));
      themeToggle.setAttribute(
        "aria-label",
        theme === "light" ? "Switch to dark theme" : "Switch to light theme"
      );
    }

    var meta = document.querySelector("meta[name=theme-color]");
    if (meta) {
      meta.setAttribute("content", theme === "light" ? "#f6f8ff" : "#050816");
    }
  }

  safely("theme switch", function () {
    var current = document.documentElement.getAttribute("data-theme");
    current = current === "light" ? "light" : "dark";
    applyTheme(current);

    if (!themeToggle) { return; }

    themeToggle.addEventListener("click", function () {
      current = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
      applyTheme(current);
      try {
        window.localStorage.setItem(THEME_KEY, current);
      } catch (error) {
        /* Storage can be unavailable in private mode - the choice still applies. */
      }
    });
  });

  /* ------------------------------------------------------------------
   * Mobile drawer (off-canvas sidebar)
   * ---------------------------------------------------------------- */

  var header = document.querySelector("#header");
  var headerToggleBtn = document.querySelector(".header-toggle");
  var backdrop = document.querySelector(".header-backdrop");
  var drawerOpen = false;

  function setDrawer(open) {
    drawerOpen = open;
    if (!header) { return; }

    header.classList.toggle("header-show", open);

    if (headerToggleBtn) {
      headerToggleBtn.classList.toggle("bi-list", !open);
      headerToggleBtn.classList.toggle("bi-x", open);
      headerToggleBtn.setAttribute("aria-expanded", String(open));
      headerToggleBtn.setAttribute(
        "aria-label",
        open ? "Close navigation menu" : "Open navigation menu"
      );
    }

    if (backdrop) {
      backdrop.hidden = false;
      backdrop.classList.toggle("active", open);
    }

    if (open) { lockScroll(); } else { unlockScroll(); }
  }

  safely("mobile drawer", function () {
    if (!header || !headerToggleBtn) { return; }
    if (backdrop) { backdrop.hidden = false; }

    headerToggleBtn.addEventListener("click", function () {
      setDrawer(!drawerOpen);
    });

    if (backdrop) {
      backdrop.addEventListener("click", function () { setDrawer(false); });
    }

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && drawerOpen) { setDrawer(false); }
    });

    window.addEventListener("resize", rafThrottle(function () {
      if (drawerOpen && window.innerWidth >= 1200) { setDrawer(false); }
    }), { passive: true });

    document.querySelectorAll("#navmenu a").forEach(function (link) {
      link.addEventListener("click", function () {
        if (drawerOpen) { setDrawer(false); }
      });
    });
  });

  /* ------------------------------------------------------------------
   * Dropdown menus (accessible, works for nested menus)
   * ---------------------------------------------------------------- */

  safely("nav dropdowns", function () {
    document.querySelectorAll(".navmenu .dropdown a[aria-haspopup]").forEach(function (trigger) {
      trigger.addEventListener("click", function (event) {
        event.preventDefault();

        var parent = trigger.closest("li");
        var submenu = trigger.nextElementSibling;
        var open = !parent.classList.contains("dropdown-active");

        parent.classList.toggle("dropdown-active", open);
        trigger.classList.toggle("active", open);
        trigger.setAttribute("aria-expanded", String(open));

        if (submenu) { submenu.classList.toggle("dropdown-active", open); }
      });
    });
  });

  /* ------------------------------------------------------------------
   * Preloader (DOM ready + load + failsafe so nobody gets trapped)
   * ---------------------------------------------------------------- */

  var preloader = document.querySelector("#preloader");

  if (preloader) {
    var hidePreloader = function () {
      preloader.classList.add("preloader-hidden");
      window.setTimeout(function () {
        if (preloader.parentNode) { preloader.parentNode.removeChild(preloader); }
      }, 600);
    };

    onReady(function () { window.setTimeout(hidePreloader, 120); });
    onLoad(function () { if (document.body.contains(preloader)) { hidePreloader(); } });
    window.setTimeout(hidePreloader, 2500);
  }

  /* ------------------------------------------------------------------
   * Scroll progress bar + scroll top button
   * ---------------------------------------------------------------- */

  var progressBar = document.querySelector(".scroll-progress span");
  var scrollTopBtn = document.querySelector(".scroll-top");

  function updateScrollUi() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;

    if (progressBar) {
      var ratio = max ? window.scrollY / max : 0;
      ratio = Math.min(1, Math.max(0, ratio));
      progressBar.style.transform = "scaleX(" + ratio + ")";
    }

    if (scrollTopBtn) {
      scrollTopBtn.classList.toggle("active", window.scrollY>100);
    }
  }

  if (progressBar || scrollTopBtn) {
    onReady(updateScrollUi);
    document.addEventListener("scroll", rafThrottle(updateScrollUi), { passive: true });
  }

  if (scrollTopBtn) {
    scrollTopBtn.addEventListener("click", function (event) {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  /* ------------------------------------------------------------------
   * Animation on scroll (AOS)
   * ---------------------------------------------------------------- */

  safely("AOS", function () {
    if (!has("AOS")) { return; }
    onReady(function () {
      AOS.init({
        duration: 700,
        easing: "ease-out-cubic",
        once: true,
        mirror: false,
        offset: 60
      });
    });
  });

  /* ------------------------------------------------------------------
   * Typed.js - rotating job titles
   * ---------------------------------------------------------------- */

  safely("Typed.js", function () {
    var selectTyped = document.querySelector(".typed");
    if (!selectTyped || !has("Typed")) { return; }

    var raw = selectTyped.getAttribute("data-typed-items") || "";
    var typedStrings = raw.split(",").map(function (item) { return item.trim(); }).filter(Boolean);
    if (!typedStrings.length) { return; }

    if (reduceMotion) {
      selectTyped.textContent = typedStrings[0];
      return;
    }

    new Typed(selectTyped, {
      strings: typedStrings,
      loop: true,
      typeSpeed: 90,
      backSpeed: 45,
      backDelay: 1800,
      smartBackspace: true,
      showCursor: true,
      cursorChar: "|"
    });
  });

  /* ------------------------------------------------------------------
   * PureCounter - animated statistics
   * ---------------------------------------------------------------- */

  safely("PureCounter", function () {
    if (has("PureCounter")) { new PureCounter(); }
  });

  /* ------------------------------------------------------------------
   * Skill bars on reveal
   * ---------------------------------------------------------------- */

  safely("skill bars", function () {
    var skillsAnimation = document.querySelectorAll(".skills-animation");
    if (!skillsAnimation.length) { return; }

    skillsAnimation.forEach(function (item) {
      var filled = false;

      var fill = function () {
        if (filled) { return; }
        filled = true;
        item.querySelectorAll(".progress .progress-bar").forEach(function (el) {
          var value = el.getAttribute("aria-valuenow") || 0;
          el.style.width = value + "%";
        });
      };

      if ("IntersectionObserver" in window && !reduceMotion) {
        var observer = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              fill();
              observer.unobserve(entry.target);
            }
          });
        }, { threshold: 0.25 });
        observer.observe(item);
      } else {
        fill();
      }
    });
  });

  /* ------------------------------------------------------------------
   * GLightbox
   * ---------------------------------------------------------------- */

  safely("GLightbox", function () {
    if (has("GLightbox")) { GLightbox({ selector: ".glightbox" }); }
  });

  /* ------------------------------------------------------------------
   * Isotope layout + filters (mouse and keyboard)
   * ---------------------------------------------------------------- */

  safely("Isotope", function () {
    var layouts = document.querySelectorAll(".isotope-layout");
    if (!layouts.length || !has("Isotope") || !has("imagesLoaded")) { return; }

    layouts.forEach(function (isotopeItem) {
      var container = isotopeItem.querySelector(".isotope-container");
      if (!container) { return; }

      var layout = isotopeItem.getAttribute("data-layout") || "masonry";
      var defaultFilter = isotopeItem.getAttribute("data-default-filter") || "*";
      var sort = isotopeItem.getAttribute("data-sort") || "original-order";

      var instance = null;
      var pendingFilter = null;

      imagesLoaded(container, function () {
        instance = new Isotope(container, {
          itemSelector: ".isotope-item",
          layoutMode: layout,
          filter: defaultFilter,
          sortBy: sort,
          transitionDuration: "0.5s"
        });

        if (pendingFilter) {
          instance.arrange({ filter: pendingFilter });
          pendingFilter = null;
        }
      });

      var applyFilter = function (filterEl) {
        var active = isotopeItem.querySelector(".isotope-filters .filter-active");
        if (active) {
          active.classList.remove("filter-active");
          active.setAttribute("aria-pressed", "false");
        }
        filterEl.classList.add("filter-active");
        filterEl.setAttribute("aria-pressed", "true");

        var filter = filterEl.getAttribute("data-filter");
        if (instance) {
          instance.arrange({ filter: filter });
        } else {
          /* Images are still loading - remember the choice and apply it later. */
          pendingFilter = filter;
        }

        if (has("AOS")) { AOS.refresh(); }
      };

      isotopeItem.querySelectorAll(".isotope-filters li").forEach(function (filterEl) {
        filterEl.addEventListener("click", function (event) {
          event.preventDefault();
          applyFilter(filterEl);
        });

        filterEl.addEventListener("keydown", function (event) {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            applyFilter(filterEl);
          }
        });
      });
    });
  });

  /* ------------------------------------------------------------------
   * Swiper sliders
   * ---------------------------------------------------------------- */

  function initSwiper() {
    if (!has("Swiper")) { return; }

    document.querySelectorAll(".init-swiper").forEach(function (swiperElement) {
      var configEl = swiperElement.querySelector(".swiper-config");
      if (!configEl) { return; }

      var config;
      try {
        config = JSON.parse(configEl.innerHTML.trim());
      } catch (error) {
        console.warn("[iPortfolio] invalid swiper-config JSON:", error);
        return;
      }

      config.a11y = { enabled: true };

      if (config.autoplay && typeof config.autoplay === "object") {
        config.autoplay.pauseOnMouseEnter = true;
      }

      if (reduceMotion) {
        config.autoplay = false;
        config.speed = 0;
      }

      new Swiper(swiperElement, config);
    });
  }

  onLoad(function () { safely("Swiper", initSwiper); });

  /* ------------------------------------------------------------------
   * Correct scroll position for hash links (uses scroll-margin-top)
   * ---------------------------------------------------------------- */

  onLoad(function () {
    if (!window.location.hash) { return; }

    var section;
    try {
      section = document.querySelector(window.location.hash);
    } catch (error) {
      return; /* malformed hash */
    }
    if (!section) { return; }

    window.setTimeout(function () {
      var margin = parseInt(window.getComputedStyle(section).scrollMarginTop, 10) || 0;
      window.scrollTo({
        top: section.offsetTop - margin,
        behavior: reduceMotion ? "auto" : "smooth"
      });
    }, 120);
  });

  /* ------------------------------------------------------------------
   * Navmenu scrollspy
   * ---------------------------------------------------------------- */

  safely("scrollspy", function () {
    var candidates = [];

    document.querySelectorAll(".navmenu a").forEach(function (link) {
      if (link.getAttribute("aria-haspopup")) { return; }
      if (!link.hash || link.hash === "#") { return; }

      var section;
      try {
        section = document.querySelector(link.hash);
      } catch (error) {
        return; /* malformed selector */
      }
      if (!section) { return; }

      candidates.push({ link: link, section: section });
    });

    if (!candidates.length) { return; }

    function navmenuScrollspy() {
      var position = window.scrollY + 200;
      var current = null;

      candidates.forEach(function (item) {
        var start = item.section.offsetTop;
        var end = start + item.section.offsetHeight;
        if (position >= start && position - end - 0 <= 0) { current = item.link; }
      });

      candidates.forEach(function (item) {
        item.link.classList.toggle("active", item.link === current);
      });
    }

    onReady(navmenuScrollspy);
    document.addEventListener("scroll", rafThrottle(navmenuScrollspy), { passive: true });
  });

  /* ------------------------------------------------------------------
   * Current year in the footer (keeps the copyright honest)
   * ---------------------------------------------------------------- */

  document.querySelectorAll("[data-current-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  /* ------------------------------------------------------------------
   * Contact form: never leave a visitor stranded. If the mail endpoint is
   * not configured on this host, offer the direct email address as well.
   * ---------------------------------------------------------------- */

  safely("contact form fallback", function () {
    var form = document.querySelector(".php-email-form");
    if (!form) { return; }

    var errorBox = form.querySelector(".error-message");
    if (!errorBox || !("MutationObserver" in window)) { return; }

    var observer = new MutationObserver(function () {
      if (!errorBox.classList.contains("d-block")) { return; }

      var text = (errorBox.textContent || "").toLowerCase();
      var looksServerSide = text.indexOf("unable to load") !== -1
        || text.indexOf("failed") !== -1
        || text.indexOf("error") !== -1
        || text.indexOf("404") !== -1
        || text.indexOf("500") !== -1;

      if (!looksServerSide) { return; }
      if (form.querySelector(".form-hint")) { return; }

      var hint = document.createElement("p");
      hint.className = "form-fallback";
      hint.innerHTML = "The mail service is not configured on this host yet - please " +
        "<a href=\"mailto:hello@alexsmith.design\">email Alex directly</a>.";
      errorBox.insertAdjacentElement("afterend", hint);
    });

    observer.observe(errorBox, { attributes: true, childList: true, subtree: true });
  });

})();
