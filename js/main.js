/* =========================================================
   Ahmed Mahrous Portfolio — Core Interactions
   Theme, language (EN/AR), navbar, hero effects
   ========================================================= */

(() => {
  "use strict";

  const THEME_KEY = "am-theme";
  const LANG_KEY = "am-lang";

  const root = document.documentElement;
  const header = document.getElementById("header");
  const navToggle = document.getElementById("nav-toggle");
  const navList = document.getElementById("nav-list");
  const navBackdrop = document.getElementById("nav-backdrop");
  const themeToggle = document.getElementById("theme-toggle");
  const langButtons = document.querySelectorAll(".lang-toggle__btn");
  const typedEl = document.getElementById("hero-typed");
  const heroVisual = document.querySelector("[data-parallax-tilt]");
  const parallaxOrbs = document.querySelectorAll("[data-parallax]");

  let currentLang = "en";
  let typingTimer = null;
  let typingIndex = 0;
  let charIndex = 0;
  let isDeleting = false;

  /* ---------- Helpers ---------- */
  const getNested = (obj, path) =>
    path.split(".").reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);

  const dict = () => window.AM_I18N?.[currentLang] || window.AM_I18N?.en;

  /* ---------- Theme ---------- */
  const THEME_EXPLICIT_KEY = "am-theme-explicit";

  const getPreferredTheme = () => {
    const saved = localStorage.getItem(THEME_KEY);
    const explicit = localStorage.getItem(THEME_EXPLICIT_KEY) === "1";
    // Default is always dark unless the user explicitly toggled the theme
    if (explicit && (saved === "light" || saved === "dark")) return saved;
    return "dark";
  };

  const applyTheme = (theme, explicit = false) => {
    root.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
    if (explicit) localStorage.setItem(THEME_EXPLICIT_KEY, "1");

    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute(
        "content",
        theme === "light" ? "#F8FAFC" : "#0F172A"
      );
    }

    updateThemeAria();
  };

  const updateThemeAria = () => {
    if (!themeToggle) return;
    const t = dict()?.a11y;
    const isDark = root.getAttribute("data-theme") === "dark";
    themeToggle.setAttribute(
      "aria-label",
      isDark ? t?.switchLight || "Switch to light theme" : t?.switchDark || "Switch to dark theme"
    );
  };

  applyTheme(getPreferredTheme());

  themeToggle?.addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    applyTheme(next, true);
  });

  /* ---------- i18n ---------- */
  const applyTranslations = () => {
    const t = dict();
    if (!t) return;

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const value = getNested(t, el.getAttribute("data-i18n"));
      if (typeof value === "string") el.textContent = value;
    });

    document.querySelectorAll("[data-i18n-aria-label]").forEach((el) => {
      const value = getNested(t, el.getAttribute("data-i18n-aria-label"));
      if (typeof value === "string") el.setAttribute("aria-label", value);
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const value = getNested(t, el.getAttribute("data-i18n-placeholder"));
      if (typeof value === "string") el.setAttribute("placeholder", value);
    });

    document.title = t.meta.title;

    const metaDesc = document.getElementById("meta-description");
    if (metaDesc) metaDesc.setAttribute("content", t.meta.description);

    updateThemeAria();

    if (navToggle) {
      const open = navToggle.classList.contains("is-open");
      navToggle.setAttribute(
        "aria-label",
        open ? t.a11y.closeMenu : t.a11y.openMenu
      );
    }
  };

  const LANG_EXPLICIT_KEY = "am-lang-explicit";

  const setLanguage = (lang, explicit = false) => {
    if (!window.AM_I18N?.[lang]) return;

    currentLang = lang;
    const t = dict();

    root.setAttribute("lang", t.lang);
    root.setAttribute("dir", t.dir);
    root.setAttribute("data-lang", lang);
    localStorage.setItem(LANG_KEY, lang);
    if (explicit) localStorage.setItem(LANG_EXPLICIT_KEY, "1");

    langButtons.forEach((btn) => {
      const active = btn.getAttribute("data-lang") === lang;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", String(active));
    });

    applyTranslations();
    restartTyping();
    renderExperience();
    renderProjectFilters();
    renderProjects();
    renderServices();
    if (!projectModal?.hidden) {
      const openId = projectModal.dataset.projectId;
      if (openId) openProjectModal(openId);
    }
  };

  const getPreferredLang = () => {
    const saved = localStorage.getItem(LANG_KEY);
    const explicit = localStorage.getItem(LANG_EXPLICIT_KEY) === "1";
    // Site default is English unless the user explicitly chose a language
    if (explicit && (saved === "en" || saved === "ar")) return saved;
    return "en";
  };

  langButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const lang = btn.getAttribute("data-lang");
      if (lang && lang !== currentLang) setLanguage(lang, true);
    });
  });

  /* ---------- Mobile nav ---------- */
  const setMenuOpen = (open) => {
    if (!navToggle || !navList) return;
    const t = dict()?.a11y;

    navToggle.classList.toggle("is-open", open);
    navList.classList.toggle("is-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute(
      "aria-label",
      open ? t?.closeMenu || "Close menu" : t?.openMenu || "Open menu"
    );
    document.body.classList.toggle("nav-open", open);

    if (navBackdrop) {
      navBackdrop.hidden = !open;
      navBackdrop.classList.toggle("is-visible", open);
    }
  };

  const closeMenu = () => setMenuOpen(false);

  navToggle?.addEventListener("click", () => {
    setMenuOpen(!navToggle.classList.contains("is-open"));
  });

  navBackdrop?.addEventListener("click", closeMenu);

  document.querySelectorAll(".nav__link").forEach((link) => {
    link.addEventListener("click", () => {
      document
        .querySelectorAll(".nav__link")
        .forEach((l) => l.classList.remove("is-active"));
      link.classList.add("is-active");
      closeMenu();
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 960) closeMenu();
  });

  /* ---------- Sticky header ---------- */
  const onScroll = () => {
    header?.classList.toggle("is-scrolled", window.scrollY > 8);
  };

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Typing effect ---------- */
  const getTypedPhrases = () => {
    const phrases = dict()?.hero?.typed;
    return Array.isArray(phrases) && phrases.length ? phrases : [""];
  };

  const typeLoop = () => {
    if (!typedEl) return;

    const phrases = getTypedPhrases();
    const current = phrases[typingIndex % phrases.length];
    const delay = isDeleting ? 36 : 72;

    if (!isDeleting) {
      charIndex += 1;
      typedEl.textContent = current.slice(0, charIndex);
      if (charIndex >= current.length) {
        isDeleting = true;
        typingTimer = window.setTimeout(typeLoop, 1600);
        return;
      }
    } else {
      charIndex -= 1;
      typedEl.textContent = current.slice(0, charIndex);
      if (charIndex <= 0) {
        isDeleting = false;
        typingIndex = (typingIndex + 1) % phrases.length;
        typingTimer = window.setTimeout(typeLoop, 320);
        return;
      }
    }

    typingTimer = window.setTimeout(typeLoop, delay);
  };

  const restartTyping = () => {
    if (typingTimer) window.clearTimeout(typingTimer);
    typingIndex = 0;
    charIndex = 0;
    isDeleting = false;
    if (typedEl) typedEl.textContent = "";
    typingTimer = window.setTimeout(typeLoop, 400);
  };

  /* ---------- Mouse parallax ---------- */
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (!prefersReducedMotion) {
    let rafId = 0;
    let targetX = 0;
    let targetY = 0;

    window.addEventListener(
      "mousemove",
      (event) => {
        const { innerWidth, innerHeight } = window;
        targetX = (event.clientX / innerWidth - 0.5) * 2;
        targetY = (event.clientY / innerHeight - 0.5) * 2;

        if (!rafId) {
          rafId = requestAnimationFrame(() => {
            parallaxOrbs.forEach((orb) => {
              const intensity = Number(orb.getAttribute("data-parallax")) || 0.04;
              orb.style.transform = `translate3d(${targetX * intensity * 100}px, ${
                targetY * intensity * 80
              }px, 0)`;
            });

            if (heroVisual && window.innerWidth > 960) {
              heroVisual.style.transform = `perspective(900px) rotateY(${
                targetX * -4
              }deg) rotateX(${targetY * 3}deg)`;
            }

            rafId = 0;
          });
        }
      },
      { passive: true }
    );
  }

  /* ---------- Profile photo fallback ---------- */
  document.querySelectorAll("[data-photo]").forEach((img) => {
    const fallback = img.parentElement?.querySelector(".photo-fallback");

    const showFallback = () => {
      img.classList.add("is-missing");
      if (fallback) {
        fallback.hidden = false;
        fallback.removeAttribute("hidden");
      }
    };

    const showPhoto = () => {
      img.classList.remove("is-missing");
      if (fallback) {
        fallback.hidden = true;
        fallback.setAttribute("hidden", "");
      }
    };

    // Only react to real load/error — avoid hiding photo before it finishes loading
    img.addEventListener("load", showPhoto);
    img.addEventListener("error", showFallback);

    if (img.complete) {
      if (img.naturalWidth > 0) showPhoto();
      else showFallback();
    }
  });

  /* ---------- Scroll reveal ---------- */
  let revealObserver = null;

  const observeReveals = (scope = document) => {
    const els = scope.querySelectorAll(".reveal:not(.is-visible)");

    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    if (!revealObserver) {
      revealObserver = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          });
        },
        { threshold: 0.16, rootMargin: "0px 0px -40px 0px" }
      );
    }

    els.forEach((el, index) => {
      el.style.transitionDelay = `${Math.min(index * 50, 250)}ms`;
      revealObserver.observe(el);
    });
  };

  /* ---------- Counter animation ---------- */
  const animateCounter = (el) => {
    const target = Number(el.getAttribute("data-counter")) || 0;
    const suffix = el.getAttribute("data-suffix") || "";
    const duration = 1400;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = `${Math.round(target * eased)}${suffix}`;
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  };

  const counters = document.querySelectorAll("[data-counter]");

  if ("IntersectionObserver" in window && counters.length) {
    const counterObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.5 }
    );

    counters.forEach((el) => counterObserver.observe(el));
  } else {
    counters.forEach(animateCounter);
  }

  /* ---------- Experience ---------- */
  const experienceTimeline = document.getElementById("experience-timeline");

  const renderExperience = () => {
    if (!experienceTimeline) return;
    const items = dict()?.experience?.items || [];

    experienceTimeline.innerHTML = items
      .map(
        (item, index) => `
      <li class="experience__item reveal" style="transition-delay:${index * 80}ms">
        <div class="experience__marker" aria-hidden="true"></div>
        <article class="experience__card">
          <div class="experience__meta">
            <span class="experience__period">${item.period}</span>
            <span class="experience__company">${item.company}</span>
          </div>
          <h3 class="experience__role">${item.role}</h3>
          <p class="experience__text">${item.text}</p>
        </article>
      </li>`
      )
      .join("");

    observeReveals(experienceTimeline);
  };

  /* ---------- Projects ---------- */
  const projectsGrid = document.getElementById("projects-grid");
  const projectsEmpty = document.getElementById("projects-empty");
  const projectFiltersEl = document.getElementById("project-filters");
  const projectSearch = document.getElementById("project-search");
  const projectModal = document.getElementById("project-modal");
  const projectModalContent = document.getElementById("project-modal-content");

  let activeFilter = "all";
  let searchQuery = "";
  let lastFocusedEl = null;

  const escapeHtml = (value) =>
    String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");

  const localizedProject = (project) => project[currentLang] || project.en;

  const getFilteredProjects = () => {
    const list = window.AM_PROJECTS || [];
    const q = searchQuery.trim().toLowerCase();

    return list.filter((project) => {
      if (activeFilter !== "all" && project.category !== activeFilter) return false;
      if (!q) return true;

      const loc = localizedProject(project);
      const haystack = [
        loc.title,
        loc.short,
        loc.business,
        project.category,
        ...(project.tech || []),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  };

  const renderProjectFilters = () => {
    if (!projectFiltersEl) return;
    const t = dict()?.projects;
    const categories = [
      "all",
      "links",
      "games",
      "realestate",
      "finance",
      "health",
      "iot",
      "social",
      "education",
      "islamic",
    ];

    projectFiltersEl.innerHTML = categories
      .map((key) => {
        const label =
          key === "all" ? t?.filterAll : t?.filters?.[key] || key;
        const active = activeFilter === key ? " is-active" : "";
        return `<button type="button" class="projects__filter${active}" data-filter="${key}">${escapeHtml(
          label
        )}</button>`;
      })
      .join("");
  };

  const bindImageFallback = (img, accent) => {
    img.addEventListener("error", () => {
      img.classList.add("is-missing");
      const shell = img.parentElement;
      if (shell) {
        shell.classList.add("has-fallback");
        shell.style.setProperty("--fallback-accent", accent || "#3B82F6");
      }
    });
  };

  const renderProjects = () => {
    if (!projectsGrid) return;
    const t = dict()?.projects;
    const filtered = getFilteredProjects();

    if (projectsEmpty) projectsEmpty.hidden = filtered.length > 0;

    projectsGrid.innerHTML = filtered
      .map((project) => {
        const loc = localizedProject(project);
        const tech = (project.tech || [])
          .slice(0, 4)
          .map((item) => `<span class="project-card__tech">${escapeHtml(item)}</span>`)
          .join("");

        return `
        <article class="project-card reveal" data-project-id="${escapeHtml(project.id)}">
          <button type="button" class="project-card__hit" data-open-project="${escapeHtml(
            project.id
          )}" aria-label="${escapeHtml(loc.title)}">
            <div class="project-card__media" style="--fallback-accent:${escapeHtml(
              project.accent || "#3B82F6"
            )}">
              <img src="${escapeHtml(project.cover)}" alt="${escapeHtml(
                loc.title
              )}" loading="lazy" decoding="async" data-project-img />
              <div class="project-card__shade"></div>
            </div>
            <div class="project-card__body">
              <div class="project-card__top">
                <h3 class="project-card__title">${escapeHtml(loc.title)}</h3>
                <span class="project-card__category">${escapeHtml(
                  t?.filters?.[project.category] || project.category
                )}</span>
              </div>
              <p class="project-card__short">${escapeHtml(loc.short)}</p>
              <div class="project-card__techs">${tech}</div>
              <span class="project-card__cta">${escapeHtml(t?.viewDetails || "View Details")}</span>
            </div>
          </button>
        </article>`;
      })
      .join("");

    projectsGrid.querySelectorAll("[data-project-img]").forEach((img) => {
      const accent =
        img.closest(".project-card__media")?.style.getPropertyValue("--fallback-accent") ||
        "#3B82F6";
      bindImageFallback(img, accent.trim());
    });

    observeReveals(projectsGrid);
  };

  /* ---------- Lightbox (full image browse) ---------- */
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const lightboxCaption = document.getElementById("lightbox-caption");
  const lightboxPrev = document.getElementById("lightbox-prev");
  const lightboxNext = document.getElementById("lightbox-next");

  let lightboxImages = [];
  let lightboxIndex = 0;

  const updateLightbox = () => {
    if (!lightboxImg || !lightboxImages.length) return;
    const t = dict()?.projects;
    const current = lightboxImages[lightboxIndex];
    lightboxImg.src = current.src;
    lightboxImg.alt = current.alt || "";
    if (lightboxCaption) {
      lightboxCaption.textContent = `${t?.imageOf || "Image"} ${lightboxIndex + 1} / ${
        lightboxImages.length
      }`;
    }
    const multi = lightboxImages.length > 1;
    if (lightboxPrev) lightboxPrev.hidden = !multi;
    if (lightboxNext) lightboxNext.hidden = !multi;
  };

  const openLightbox = (images, startIndex = 0) => {
    if (!lightbox || !images?.length) return;
    lightboxImages = images;
    lightboxIndex = Math.max(0, Math.min(startIndex, images.length - 1));
    updateLightbox();
    lightbox.hidden = false;
    document.body.classList.add("lightbox-open");
  };

  const closeLightbox = () => {
    if (!lightbox) return;
    lightbox.hidden = true;
    document.body.classList.remove("lightbox-open");
    if (lightboxImg) lightboxImg.removeAttribute("src");
  };

  const stepLightbox = (delta) => {
    if (!lightboxImages.length) return;
    lightboxIndex =
      (lightboxIndex + delta + lightboxImages.length) % lightboxImages.length;
    updateLightbox();
  };

  lightboxPrev?.addEventListener("click", () => stepLightbox(-1));
  lightboxNext?.addEventListener("click", () => stepLightbox(1));
  lightbox?.addEventListener("click", (event) => {
    if (event.target.closest("[data-close-lightbox]")) closeLightbox();
  });

  const closeProjectModal = () => {
    if (!projectModal) return;
    closeLightbox();
    projectModal.hidden = true;
    delete projectModal.dataset.projectId;
    document.body.classList.remove("modal-open");
    if (lastFocusedEl && typeof lastFocusedEl.focus === "function") {
      lastFocusedEl.focus();
    }
  };

  const openProjectModal = (id) => {
    const project = (window.AM_PROJECTS || []).find((item) => item.id === id);
    if (!project || !projectModal || !projectModalContent) return;

    const t = dict()?.projects;
    const loc = localizedProject(project);
    lastFocusedEl = document.activeElement;

    const galleryImages = [project.cover, ...(project.images || [])].filter(Boolean);
    const uniqueImages = [...new Set(galleryImages)];

    const gallery = uniqueImages
      .map(
        (src, index) => `
      <button type="button" class="project-modal__shot" data-lightbox-index="${index}" title="${escapeHtml(
          t?.viewImage || "View full image"
        )}">
        <img src="${escapeHtml(src)}" alt="${escapeHtml(
          loc.title
        )} — ${index + 1}" loading="lazy" data-project-img />
        <span class="project-modal__shot-hint">${escapeHtml(
          t?.viewImage || "View full image"
        )}</span>
      </button>`
      )
      .join("");

    const solutions = (loc.solutions || [])
      .map((item) => `<li>${escapeHtml(item)}</li>`)
      .join("");

    const tech = (project.tech || [])
      .map((item) => `<span class="project-card__tech">${escapeHtml(item)}</span>`)
      .join("");

    const actions = [];
    if (project.github) {
      actions.push(
        `<a class="btn btn--outline btn--sm" href="${escapeHtml(
          project.github
        )}" target="_blank" rel="noopener noreferrer">${escapeHtml(t?.github || "GitHub")}</a>`
      );
    }
    if (project.liveDemo) {
      actions.push(
        `<a class="btn btn--outline btn--sm" href="${escapeHtml(
          project.liveDemo
        )}" target="_blank" rel="noopener noreferrer">${escapeHtml(t?.liveDemo || "Live Demo")}</a>`
      );
    }

    // Google Play: only render when playStore URL exists
    const playStoreBlock = project.playStore
      ? `
      <div class="project-modal__play">
        <p class="project-modal__play-label">${escapeHtml(t?.playStore || "")}</p>
        <a class="btn btn--primary btn--sm" href="${escapeHtml(
          project.playStore
        )}" target="_blank" rel="noopener noreferrer">
          ${escapeHtml(t?.openPlay || "Open on Google Play")}
        </a>
      </div>`
      : "";

    projectModalContent.innerHTML = `
      <div class="project-modal__hero">
        <button type="button" class="project-modal__cover" data-lightbox-index="0" style="--fallback-accent:${escapeHtml(
          project.accent || "#3B82F6"
        )}" title="${escapeHtml(t?.viewImage || "View full image")}">
          <img src="${escapeHtml(project.cover)}" alt="${escapeHtml(
            loc.title
          )}" data-project-img />
          <span class="project-modal__shot-hint">${escapeHtml(
            t?.viewImage || "View full image"
          )}</span>
        </button>
        <div class="project-modal__intro">
          <p class="project-modal__category">${escapeHtml(
            t?.filters?.[project.category] || project.category
          )}</p>
          <h3 class="project-modal__title" id="project-modal-title">${escapeHtml(loc.title)}</h3>
          <p class="project-modal__short">${escapeHtml(loc.short)}</p>
          <div class="project-card__techs">${tech}</div>
          ${actions.length ? `<div class="project-modal__actions">${actions.join("")}</div>` : ""}
          ${playStoreBlock}
        </div>
      </div>

      <div class="project-modal__section">
        <h4>${escapeHtml(t?.business || "Business")}</h4>
        <p>${escapeHtml(loc.business)}</p>
      </div>

      <div class="project-modal__section">
        <h4>${escapeHtml(t?.solutions || "Solutions")}</h4>
        <ul class="project-modal__solutions">${solutions}</ul>
      </div>

      <div class="project-modal__section">
        <h4>${escapeHtml(t?.gallery || "Gallery")}</h4>
        <p class="project-modal__gallery-note">${escapeHtml(
          t?.viewImage || "Click to view full image"
        )}</p>
        <div class="project-modal__gallery">${gallery}</div>
      </div>
    `;

    const lightboxData = uniqueImages.map((src, index) => ({
      src,
      alt: `${loc.title} — ${index + 1}`,
    }));

    projectModalContent.querySelectorAll("[data-project-img]").forEach((img) => {
      bindImageFallback(img, project.accent);
    });

    projectModalContent.querySelectorAll("[data-lightbox-index]").forEach((el) => {
      el.addEventListener("click", () => {
        const index = Number(el.getAttribute("data-lightbox-index")) || 0;
        openLightbox(lightboxData, index);
      });
    });

    projectModal.dataset.projectId = id;
    projectModal.hidden = false;
    document.body.classList.add("modal-open");
    document.getElementById("project-modal-close")?.focus();
  };

  projectFiltersEl?.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-filter]");
    if (!btn) return;
    activeFilter = btn.getAttribute("data-filter") || "all";
    renderProjectFilters();
    renderProjects();
  });

  projectSearch?.addEventListener("input", (event) => {
    searchQuery = event.target.value || "";
    renderProjects();
  });

  projectsGrid?.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-open-project]");
    if (!trigger) return;
    openProjectModal(trigger.getAttribute("data-open-project"));
  });

  projectModal?.addEventListener("click", (event) => {
    if (event.target.closest("[data-close-modal]")) closeProjectModal();
  });

  document.addEventListener("keydown", (event) => {
    if (lightbox && !lightbox.hidden) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeLightbox();
        return;
      }
      if (event.key === "ArrowLeft") {
        stepLightbox(document.documentElement.dir === "rtl" ? 1 : -1);
        return;
      }
      if (event.key === "ArrowRight") {
        stepLightbox(document.documentElement.dir === "rtl" ? -1 : 1);
        return;
      }
    }

    if (event.key === "Escape" && projectModal && !projectModal.hidden) {
      closeProjectModal();
    }
  });

  /* ---------- Services ---------- */
  const servicesGrid = document.getElementById("services-grid");

  const serviceIcons = [
    `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true"><rect x="7" y="3" width="10" height="18" rx="2" stroke="currentColor" stroke-width="1.7"/><path d="M10 18h4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,
    `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true"><path d="M5 17c2.5-4 4-8 7-8s4.5 4 7 8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><circle cx="12" cy="8" r="2.2" stroke="currentColor" stroke-width="1.7"/></svg>`,
    `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true"><path d="M4 8h16M4 12h10M4 16h13" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><circle cx="19" cy="12" r="2" stroke="currentColor" stroke-width="1.7"/></svg>`,
    `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true"><path d="M12 8v5l3 2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.7"/><path d="M9 4l1.2 2M15 4l-1.2 2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,
    `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true"><path d="M4 16l4-8 4 5 3-3 5 6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true"><path d="M12 3v12m0 0l4-4m-4 4l-4-4M4 21h16" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  ];

  const renderServices = () => {
    if (!servicesGrid) return;
    const items = dict()?.services?.items || [];

    servicesGrid.innerHTML = items
      .map(
        (item, index) => `
      <article class="service-card reveal">
        <span class="service-card__icon">${serviceIcons[index % serviceIcons.length]}</span>
        <h3 class="service-card__title">${escapeHtml(item.title)}</h3>
        <p class="service-card__text">${escapeHtml(item.text)}</p>
      </article>`
      )
      .join("");

    observeReveals(servicesGrid);
  };

  /* ---------- Private contact links (not shown as text) ---------- */
  const contactTargets = {
    email: () => {
      const user = ["ahmed", "mahrous1092"].join(".");
      const host = ["gmail", "com"].join(".");
      return `mailto:${user}@${host}`;
    },
    whatsapp: () => {
      const phone = ["20111", "400", "9880"].join("");
      return `https://wa.me/${phone}`;
    },
  };

  document.querySelectorAll("[data-contact]").forEach((el) => {
    el.addEventListener("click", (event) => {
      const key = el.getAttribute("data-contact");
      const build = contactTargets[key];
      if (!build) return;

      event.preventDefault();
      const url = build();
      if (key === "email") {
        window.location.href = url;
      } else {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    });
  });

  /* ---------- Init ---------- */
  observeReveals();
  setLanguage(getPreferredLang());
})();

