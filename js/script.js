(() => {
  "use strict";

  const APP_PREFIX = "glamWorkshopPortal";
  const STORAGE = {
    lastPage: `${APP_PREFIX}:lastPage`,
    lastWorkshop: `${APP_PREFIX}:lastWorkshop`,
    checklist: `${APP_PREFIX}:checklist`,
    dayProgress: `${APP_PREFIX}:dayProgress`,
    notes: `${APP_PREFIX}:notes`,
    activeNote: `${APP_PREFIX}:activeNote`,
    prompts: `${APP_PREFIX}:prompts`,
    settings: `${APP_PREFIX}:settings`,
    announcements: `${APP_PREFIX}:announcements`,
    references: `${APP_PREFIX}:references`,
    downloadHistory: `${APP_PREFIX}:downloadHistory`,
    replayHistory: `${APP_PREFIX}:replayHistory`
  };

  const VALID_PAGES = new Set([
    "requirements",
    "portal-home",
    "announcements",
    "community",
    "quick-help",
    "common-mistakes",
    "settings",
    "prompt-dashboard",
    "journey",
    "day-one",
    "day-two",
    "references",
    "tools-resources",
    "sell",
    "shortcuts",
    "notebook",
    "prompts",
    "book-session",
    "replays",
    "bonuses",
    "downloads",
    "certificate",
    "website-dashboard",
    "beacon-dashboard",
    "chatgpt-dashboard",
    "payhip-dashboard"
  ]);

  const LOCKED_WORKSHOP_PAGES = new Set([
    "website-dashboard",
    "beacon-dashboard",
    "chatgpt-dashboard",
    "payhip-dashboard"
  ]);

  const PROMPT_WORKSHOP_PAGES = new Set([
    "prompt-dashboard",
    "journey",
    "requirements",
    "day-one",
    "day-two",
    "references",
    "downloads",
    "replays",
    "notebook",
    "prompts",
    "bonuses",
    "sell",
    "book-session",
    "certificate"
  ]);

  const MAX_REFERENCE_IMAGE_SIZE = 1_500_000;
  const MAX_REFERENCE_IMAGES = 8;

  const REPLAY_LINKS = {
    day1: "https://drive.google.com/file/d/1q4EOnJhgF7nMPv4_iGmuO7s-VnTfNmmn/view?usp=drive_link",
    day2: ""
  };

  const snippetLibrary = {
    dayOnePlan: `You are an expert prompt generator planner helping a complete beginner plan one professional prompt generator.\n\nAsk me for my generator idea first. Then create one concise Generator Build Plan that includes:\n\n• Generator name\n• Purpose\n• Target audience\n• What it creates\n• The problem it solves\n• Main categories\n• Important option choices\n• Required buttons and features\n• Final output format\n\nDo not generate HTML, CSS, or JavaScript yet. Keep the plan clear, practical, and beginner-friendly.`,

    dayOneProjectSetup: `You are helping a complete beginner set up a prompt generator project in Visual Studio Code.\n\nGuide me one small step at a time. Help me create this exact structure:\n\nproject-folder/\n  index.html\n  css/\n    style.css\n  js/\n    script.js\n  assets/\n    images/\n\nExplain exactly what to click and wait for me to say done after each step. Do not generate code yet.`,

    dayOneDesign: `You are an expert UI/UX designer helping a complete beginner create a Content & Design Guide for an approved prompt generator.\n\nUse my approved Generator Build Plan as the source of truth. Define:\n\n• Page sections and order\n• Header content\n• Category and control layout\n• Button placement\n• Prompt output area\n• Colors\n• Typography\n• Cards, borders, spacing, and shadows\n• Desktop, tablet, and mobile behavior\n\nDo not generate HTML, CSS, or JavaScript. Do not add features that are not in the approved plan.`,

    dayOneHtml: `You are an expert HTML developer helping a complete beginner build an approved prompt generator.\n\nUse the approved Generator Build Plan and Content & Design Guide as the source of truth. Create ONE complete index.html file only. Include every approved section, category, control, button, preset area, and output area.\n\nDo not generate CSS or JavaScript. Do not rename or invent features. Output only the complete HTML file.`,

    dayOneCss: `You are an expert CSS developer helping a complete beginner style an existing prompt generator.\n\nUse the approved Content & Design Guide and current index.html as the source of truth. Do not redesign the generator. Create ONE complete css/style.css file only. Style every visible section and control, include responsive desktop, tablet, and mobile rules, and preserve all existing classes and IDs.\n\nDo not generate HTML or JavaScript. Output only the complete CSS file.`,

    dayOneJavascript: `You are an expert JavaScript developer helping a complete beginner add functionality to an existing prompt generator.\n\nUse the current index.html and css/style.css as the source of truth. Create ONE complete js/script.js file only. Connect every existing choice, button, preset, prompt output, copy, clear, randomize, and lock feature that appears in the HTML. Preserve every existing ID, class, and data attribute.\n\nDo not generate HTML or CSS. Output only the complete JavaScript file.`,

    dayOneQuickTest: `You are helping a complete beginner test a prompt generator before moving on.\n\nStart by asking me to upload the current complete index.html, css/style.css, and js/script.js. Inspect the files first. Then test one small section at a time: page layout, selections, prompt generation, copy, clear, randomize, presets, custom text, and mobile layout. Fix only problems that are actually found.`,

    dayTwoReviewImprove: `Review my current working project before changing anything. Ask me to upload the complete project files. Identify what already works, what appears unfinished, and the 1–3 improvements that would make the biggest difference. Do not redesign or edit code yet.`,

    dayTwoImproveProject: `Use my current working project as the source of truth. Help me improve only the approved categories, options, sections, tabs, content, or interactions. Preserve all working files, IDs, classes, data attributes, and features. Make the smallest safe changes possible.`,

    dayTwoFinalizeFeatures: `Review my current project and finalize only the project-specific features I approve. For a prompt generator, this may include final presets, option behavior, locks, saved values, and output assembly. For a website or app, adapt the work to the features that actually exist. Do not force unrelated features into the project.`,

    addHeaderImage: `You are helping a complete beginner add or replace a header image in an existing project. First inspect the current index.html and project folder structure. Tell me the exact image folder, filename, HTML location, and CSS needed. Preserve the existing layout and do not redesign unrelated sections.`,

    addMarquee: `You are helping a complete beginner add a professional scrolling marquee to an existing project. First inspect the current HTML and CSS. Ask what text should appear. Then provide only the smallest HTML and CSS changes required. Do not redesign or remove any working content.`,

    updateCopyright: `You are helping a complete beginner update the footer and copyright in an existing project. First inspect the current HTML. Ask for the exact business name, website, and copyright wording. Then provide only the smallest replacement needed without changing unrelated code.`,

    dayTwoPremiumFeatures: `Review my current working project and recommend only premium features that make this specific project more useful. Do not add anything automatically. After I approve a feature, update one file at a time and preserve every working section and connection.`,

    dayTwoFinalTest: `You are helping a complete beginner complete a final test of an existing project. Ask me to upload the complete current project. Inspect it first. Then test navigation, buttons, forms, links, downloads, outputs, local storage, desktop, tablet, and mobile behavior one section at a time. Fix only verified problems and do not redesign the project.`
  };

  const state = {
    currentPage: "portal-home",
    notes: [],
    activeNoteId: null,
    prompts: [],
    referenceImages: [],
    saveTimer: null
  };

  const dom = {};

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    cacheDom();
    bindNavigation();
    bindMobileMenu();
    bindGlobalSearch();
    bindWorkshopCards();
    bindLockedWorkshops();
    bindPageButtons();
    bindCopyButtons();
    bindFlipCards();
    bindCompletionControls();
    bindChecklists();
    bindNotebook();
    bindSavedPrompts();
    bindReferenceLibrary();
    bindDownloads();
    bindReplays();
    bindAnnouncements();
    bindCommunityPlaceholders();
    bindSettings();
    bindExternalLinkConfirmation();
    bindReset();
    bindKeyboardSupport();
    restoreLastPage();
    updatePortalProgress();
    refreshIcons();
  }

  function cacheDom() {
    dom.pages = [...document.querySelectorAll(".page")];
    dom.navLinks = [...document.querySelectorAll(".nav-link")];
    dom.sidebar = document.querySelector(".sidebar");
    dom.mobileMenuBtn = document.getElementById("mobileMenuBtn");
    dom.globalSearch = document.getElementById("globalSearch");
    dom.toast = document.getElementById("toast");
    dom.completionPopup = document.getElementById("completionPopup");
    dom.completionTitle = document.getElementById("completionTitle");
    dom.completionText = document.getElementById("completionText");
    dom.workshopLockPopup = document.getElementById("workshopLockPopup");
    dom.workshopCodeMessage = document.getElementById("workshopCodeMessage");
  }

  function safeJsonParse(value, fallback) {
    try {
      return value ? JSON.parse(value) : fallback;
    } catch (error) {
      console.warn("Stored portal data could not be read.", error);
      return fallback;
    }
  }

  function readStorage(key, fallback = null) {
    try {
      const value = localStorage.getItem(key);
      if (value === null) return fallback;
      return safeJsonParse(value, fallback);
    } catch (error) {
      console.warn("Local storage is unavailable.", error);
      return fallback;
    }
  }

  function writeStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn("Portal data could not be saved.", error);
      showToast("This browser could not save that change.", true);
      return false;
    }
  }

  function removeStorage(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn("Stored portal data could not be removed.", error);
    }
  }

  function refreshIcons() {
    if (window.lucide && typeof window.lucide.createIcons === "function") {
      window.lucide.createIcons();
    }
  }

  function showToast(message, isError = false) {
    if (!dom.toast) return;
    dom.toast.textContent = message;
    dom.toast.classList.toggle("error", isError);
    dom.toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => {
      dom.toast.classList.remove("show", "error");
    }, 2600);
  }

  function showPage(pageId, options = {}) {
    const { save = true, focus = true } = options;
    const target = document.getElementById(pageId);

    if (LOCKED_WORKSHOP_PAGES.has(pageId)) {
      openWorkshopLockPopup(`${pageLabel(pageId)} is locked and not available yet.`);
      return false;
    }

    if (pageId === "certificate" && !readStorage(STORAGE.dayProgress, {}).dayTwo) {
      showToast("Complete Day 2 before opening your certificate.", true);
      return false;
    }

    if (!target || !target.classList.contains("page")) {
      showToast("That portal page is not available yet.", true);
      return false;
    }

    dom.pages.forEach((page) => {
      const isActive = page === target;
      page.classList.toggle("active-page", isActive);
      page.setAttribute("aria-hidden", String(!isActive));
    });

    dom.navLinks.forEach((link) => {
      const isActive = link.dataset.page === pageId;
      link.classList.toggle("active", isActive);
      if (isActive) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });

    state.currentPage = pageId;
    document.body.dataset.currentPage = pageId;

    if (save) writeStorage(STORAGE.lastPage, pageId);

    closeMobileMenu();
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });

    if (focus) {
      const heading = target.querySelector("h1, h2");
      if (heading) {
        heading.setAttribute("tabindex", "-1");
        window.setTimeout(() => heading.focus({ preventScroll: true }), 100);
      }
    }

    updatePortalProgress();
    return true;
  }

  function restoreLastPage() {
    const savedPage = readStorage(STORAGE.lastPage, "portal-home");
    const startPage = VALID_PAGES.has(savedPage) &&
      !LOCKED_WORKSHOP_PAGES.has(savedPage) &&
      document.getElementById(savedPage)
      ? savedPage
      : "portal-home";
    showPage(startPage, { save: false, focus: false });
  }

  function bindNavigation() {
    document.querySelectorAll("[data-page]").forEach((control) => {
      control.addEventListener("click", (event) => {
        event.preventDefault();
        const pageId = control.dataset.page;

        if (!pageId || !document.getElementById(pageId)) {
          openWorkshopLockPopup("This workshop is not available in your portal yet.");
          return;
        }

        if (PROMPT_WORKSHOP_PAGES.has(pageId)) {
          writeStorage(STORAGE.lastWorkshop, pageId);
        }
        showPage(pageId);
      });
    });

    document.querySelectorAll("[data-open-page]").forEach((control) => {
      control.addEventListener("click", (event) => {
        event.preventDefault();
        showPage(control.dataset.openPage);
      });
    });
  }

  function bindMobileMenu() {
    dom.mobileMenuBtn?.addEventListener("click", () => {
      const isOpen = dom.sidebar?.classList.toggle("open") ?? false;
      document.body.classList.toggle("menu-open", isOpen);
      dom.mobileMenuBtn.setAttribute("aria-expanded", String(isOpen));
      dom.mobileMenuBtn.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
    });

    document.addEventListener("click", (event) => {
      if (window.innerWidth > 900 || !dom.sidebar?.classList.contains("open")) return;
      if (dom.sidebar.contains(event.target) || dom.mobileMenuBtn?.contains(event.target)) return;
      closeMobileMenu();
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 900) closeMobileMenu();
    });
  }

  function closeMobileMenu() {
    dom.sidebar?.classList.remove("open");
    document.body.classList.remove("menu-open");
    dom.mobileMenuBtn?.setAttribute("aria-expanded", "false");
    dom.mobileMenuBtn?.setAttribute("aria-label", "Open menu");
  }

  function bindGlobalSearch() {
    if (!dom.globalSearch) return;

    dom.globalSearch.addEventListener("input", () => {
      const query = dom.globalSearch.value.trim().toLowerCase();
      clearSearchHighlights();
      if (query.length < 2) return;

      const matches = dom.pages.filter((page) => {
        return !LOCKED_WORKSHOP_PAGES.has(page.id) &&
          page.textContent.toLowerCase().includes(query);
      });
      const currentMatch = matches.find((page) => page.id === state.currentPage);

      if (currentMatch) {
        highlightSearchCards(currentMatch, query);
        return;
      }

      if (matches[0]) {
        showPage(matches[0].id);
        highlightSearchCards(matches[0], query);
        showToast(`Showing results in ${pageLabel(matches[0].id)}.`);
      }
    });

    dom.globalSearch.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        dom.globalSearch.value = "";
        clearSearchHighlights();
        dom.globalSearch.blur();
      }
    });
  }

  function highlightSearchCards(page, query) {
    page.querySelectorAll("article, details, .card").forEach((item) => {
      if (item.textContent.toLowerCase().includes(query)) {
        item.classList.add("search-match");
      }
    });
  }

  function clearSearchHighlights() {
    document.querySelectorAll(".search-match").forEach((item) => item.classList.remove("search-match"));
  }

  function pageLabel(pageId) {
    const page = document.getElementById(pageId);
    return page?.querySelector("h1")?.textContent.trim() || pageId;
  }

  function bindWorkshopCards() {
    document.getElementById("continueBtn")?.addEventListener("click", () => {
      const lastPage = readStorage(STORAGE.lastPage, null);
      const lastWorkshop = readStorage(STORAGE.lastWorkshop, "prompt-dashboard");
      const destination = lastPage && PROMPT_WORKSHOP_PAGES.has(lastPage)
        ? lastPage
        : lastWorkshop;
      showPage(document.getElementById(destination) ? destination : "prompt-dashboard");
    });
  }

  function bindLockedWorkshops() {
    document.querySelectorAll(".locked-workshop").forEach((link) => {
      link.setAttribute("aria-haspopup", "dialog");
      link.addEventListener("click", (event) => {
        event.preventDefault();
        const workshopName = link.dataset.workshop
          || link.closest(".workshop-card")?.querySelector("h2")?.textContent.trim()
          || "This workshop";
        openWorkshopLockPopup(`${workshopName} is locked and not available yet.`);
      });
    });

    document.getElementById("closeWorkshopLockPopup")?.addEventListener("click", closeWorkshopLockPopup);
    dom.workshopLockPopup?.addEventListener("click", (event) => {
      if (event.target === dom.workshopLockPopup) closeWorkshopLockPopup();
    });

  }

  function openWorkshopLockPopup(customMessage = "") {
    if (!dom.workshopLockPopup) {
      showToast(customMessage || "This workshop is locked.", true);
      return;
    }
    dom.workshopLockPopup.classList.remove("hidden");
    document.body.classList.add("modal-open");
    if (dom.workshopCodeMessage) dom.workshopCodeMessage.textContent = customMessage;
    window.setTimeout(() => document.getElementById("closeWorkshopLockPopup")?.focus(), 50);
  }

  function closeWorkshopLockPopup() {
    dom.workshopLockPopup?.classList.add("hidden");
    document.body.classList.remove("modal-open");
    if (dom.workshopCodeMessage) dom.workshopCodeMessage.textContent = "";
  }

  function bindPageButtons() {
    document.querySelector("#sell .launch-checklist-front .primary-btn")?.addEventListener("click", () => {
      document.querySelector(".launch-checklist-card")?.classList.add("is-flipped");
    });
    document.querySelector("#sell .launch-checklist-back .secondary-btn")?.addEventListener("click", () => {
      document.querySelector(".launch-checklist-card")?.classList.remove("is-flipped");
    });

    document.getElementById("copyReusableWelcomePromptBtn")?.addEventListener("click", () => {
      copyElementValue("reusableWelcomeMasterPrompt", "HTML template copied.");
    });

    document.getElementById("downloadReusableWelcomePromptBtn")?.addEventListener("click", () => {
      const content = document.getElementById("reusableWelcomeMasterPrompt")?.value || "";
      downloadTextFile("reusable-app-welcome-page.html", decodeHtmlEntities(content), "text/html");
      recordDownload("Reusable App Welcome Page Template");
    });
  }

  function bindCopyButtons() {
    document.querySelectorAll(".copy-snippet-btn[data-snippet]").forEach((button) => {
      button.addEventListener("click", () => {
        const text = snippetLibrary[button.dataset.snippet];
        if (!text) {
          showToast("That workshop prompt has not been added yet.", true);
          return;
        }
        copyText(text, "Workshop prompt copied.");
      });
    });

    document.querySelectorAll(".copy-btn[data-copy-target]").forEach((button) => {
      button.addEventListener("click", () => copyElementValue(button.dataset.copyTarget));
    });
  }

  async function copyText(text, successMessage = "Copied!") {
    if (!text) {
      showToast("There is nothing to copy.", true);
      return false;
    }

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const temporary = document.createElement("textarea");
        temporary.value = text;
        temporary.setAttribute("readonly", "");
        temporary.style.position = "fixed";
        temporary.style.opacity = "0";
        document.body.appendChild(temporary);
        temporary.select();
        const copied = document.execCommand("copy");
        temporary.remove();
        if (!copied) throw new Error("Copy command failed.");
      }
      showToast(successMessage);
      return true;
    } catch (error) {
      console.warn("Copy failed.", error);
      showToast("Copy failed. Select the text and press Ctrl + C.", true);
      return false;
    }
  }

  function copyElementValue(elementId, message = "Copied!") {
    const element = document.getElementById(elementId);
    const value = element?.value ?? element?.textContent ?? "";
    return copyText(value.trim(), message);
  }

  function bindFlipCards() {
    document.querySelectorAll(".flip-card").forEach((card) => {
      card.setAttribute("tabindex", "0");
      card.setAttribute("role", "button");
      card.setAttribute("aria-pressed", "false");

      const toggle = (event) => {
        if (event.target.closest("button, a, input, textarea, select")) return;
        const flipped = card.classList.toggle("is-flipped");
        card.setAttribute("aria-pressed", String(flipped));
      };

      card.addEventListener("click", toggle);
      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          toggle(event);
        }
      });
    });
  }

  function bindCompletionControls() {
    document.getElementById("markDayOneCompleteBtn")?.addEventListener("click", () => {
      setDayComplete("dayOne", true);
      showCompletion(
        "Day 1 Complete",
        "Your Day 1 progress has been saved. You are ready for Day 2.",
        "day-two",
        "Go to Day 2"
      );
    });

    document.getElementById("markDayTwoCompleteBtn")?.addEventListener("click", () => {
      setDayComplete("dayTwo", true);
      showCompletion(
        "Workshop Complete",
        "Day 2 is complete. Your certificate is now unlocked.",
        "certificate",
        "View Certificate"
      );
    });

    document.getElementById("completionActionButton")?.addEventListener("click", () => {
      closeAchievementPopup();
    });

    document.getElementById("closeCompletionPopup")?.addEventListener("click", closeAchievementPopup);
    dom.completionPopup?.addEventListener("click", (event) => {
      if (event.target === dom.completionPopup) closeAchievementPopup();
    });

    window.closeAchievementPopup = closeAchievementPopup;
  }

  function setDayComplete(day, complete) {
    const progress = readStorage(STORAGE.dayProgress, {});
    progress[day] = Boolean(complete);
    writeStorage(STORAGE.dayProgress, progress);
    updatePortalProgress();
  }

  function showCompletion(title, text, nextPage, actionLabel = "Continue") {
    if (!dom.completionPopup) {
      showToast(text);
      if (nextPage) showPage(nextPage);
      return;
    }

    if (dom.completionTitle) dom.completionTitle.textContent = title;
    if (dom.completionText) dom.completionText.textContent = text;
    const actionButton = document.getElementById("completionActionButton");
    if (actionButton) actionButton.textContent = actionLabel;
    dom.completionPopup.dataset.nextPage = nextPage || "";
    dom.completionPopup.classList.remove("hidden");
    document.body.classList.add("modal-open");
    window.setTimeout(() => document.getElementById("closeCompletionPopup")?.focus(), 50);
  }

  function closeAchievementPopup() {
    const nextPage = dom.completionPopup?.dataset.nextPage;
    dom.completionPopup?.classList.add("hidden");
    document.body.classList.remove("modal-open");
    if (nextPage && document.getElementById(nextPage)) showPage(nextPage);
  }

  function bindChecklists() {
    const checkboxes = [...document.querySelectorAll(".page input[type='checkbox']")];
    const saved = readStorage(STORAGE.checklist, {});

    checkboxes.forEach((checkbox, index) => {
      const key = checkboxKey(checkbox, index);
      checkbox.dataset.storageKey = key;
      if (Object.prototype.hasOwnProperty.call(saved, key)) checkbox.checked = Boolean(saved[key]);

      checkbox.addEventListener("change", () => {
        const current = readStorage(STORAGE.checklist, {});
        current[key] = checkbox.checked;
        writeStorage(STORAGE.checklist, current);
        updatePortalProgress();
      });
    });
  }

  function checkboxKey(checkbox, index) {
    const page = checkbox.closest(".page")?.id || "page";
    const item = checkbox.closest("li")?.textContent.replace(/\s+/g, " ").trim() || `checkbox-${index}`;
    return `${page}:${item}`;
  }

  function updatePortalProgress() {
    const checkboxes = [...document.querySelectorAll(".page input[type='checkbox']")]
      .filter((box) => !box.closest("#settings"));
    const completed = checkboxes.filter((box) => box.checked).length;
    const percentage = checkboxes.length ? Math.round((completed / checkboxes.length) * 100) : 0;
    const dayProgress = readStorage(STORAGE.dayProgress, {});
    const adjusted = Math.max(percentage, dayProgress.dayTwo ? 100 : dayProgress.dayOne ? 50 : 0);

    document.documentElement.style.setProperty("--portal-progress", `${adjusted}%`);
    document.body.dataset.progress = String(adjusted);

    let progressBadge = document.getElementById("portalProgressBadge");
    if (!progressBadge) {
      const headerActions = document.querySelector("#portal-home .header-actions");
      if (headerActions) {
        progressBadge = document.createElement("div");
        progressBadge.id = "portalProgressBadge";
        progressBadge.className = "portal-progress-badge";
        progressBadge.setAttribute("role", "status");
        headerActions.prepend(progressBadge);
      }
    }

    if (progressBadge) progressBadge.textContent = `${adjusted}% Complete`;
  }

  function bindNotebook() {
    state.notes = readStorage(STORAGE.notes, []);
    if (!Array.isArray(state.notes)) state.notes = [];
    state.activeNoteId = readStorage(STORAGE.activeNote, null);

    document.getElementById("newNoteBtn")?.addEventListener("click", createNewNote);
    document.getElementById("deleteNoteBtn")?.addEventListener("click", deleteActiveNote);

    const editor = document.getElementById("mainNote");
    editor?.addEventListener("input", () => {
      updateNoteCharacterCount(editor.value.length);
      setNoteStatus("Saving...");
      clearTimeout(state.saveTimer);
      state.saveTimer = window.setTimeout(saveActiveNote, 500);
    });

    renderNotesList();
    if (state.activeNoteId && state.notes.some((note) => note.id === state.activeNoteId)) {
      loadNote(state.activeNoteId);
    } else if (state.notes[0]) {
      loadNote(state.notes[0].id);
    } else {
      clearNoteEditor();
    }
  }

  function createNewNote() {
    const now = new Date();
    const note = {
      id: createId("note"),
      title: "New Note",
      content: "",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };
    state.notes.unshift(note);
    state.activeNoteId = note.id;
    persistNotes();
    renderNotesList();
    loadNote(note.id);
    document.getElementById("mainNote")?.focus();
  }

  function loadNote(noteId) {
    const note = state.notes.find((item) => item.id === noteId);
    if (!note) return;
    state.activeNoteId = note.id;
    writeStorage(STORAGE.activeNote, note.id);

    const editor = document.getElementById("mainNote");
    const title = document.getElementById("currentNoteTitle");
    const timestamp = document.getElementById("noteTimestamp");
    const deleteButton = document.getElementById("deleteNoteBtn");

    if (editor) editor.value = note.content;
    if (title) title.textContent = note.title;
    if (timestamp) timestamp.textContent = `Last saved ${formatDate(note.updatedAt)}`;
    if (deleteButton) deleteButton.disabled = false;
    updateNoteCharacterCount(note.content.length);
    setNoteStatus("Saved in this browser.");
    renderNotesList();
  }

  function saveActiveNote() {
    const editor = document.getElementById("mainNote");
    if (!editor) return;

    if (!state.activeNoteId) createNewNote();
    const note = state.notes.find((item) => item.id === state.activeNoteId);
    if (!note) return;

    note.content = editor.value;
    note.title = deriveNoteTitle(note.content);
    note.updatedAt = new Date().toISOString();
    persistNotes();
    renderNotesList();

    const title = document.getElementById("currentNoteTitle");
    const timestamp = document.getElementById("noteTimestamp");
    if (title) title.textContent = note.title;
    if (timestamp) timestamp.textContent = `Last saved ${formatDate(note.updatedAt)}`;
    setNoteStatus("Saved automatically.");
  }

  function deleteActiveNote() {
    if (!state.activeNoteId) return;
    const note = state.notes.find((item) => item.id === state.activeNoteId);
    if (!note) return;
    if (!window.confirm(`Delete “${note.title}”? This cannot be undone.`)) return;

    state.notes = state.notes.filter((item) => item.id !== state.activeNoteId);
    state.activeNoteId = state.notes[0]?.id || null;
    persistNotes();
    renderNotesList();

    if (state.activeNoteId) loadNote(state.activeNoteId);
    else clearNoteEditor();
    showToast("Note deleted.");
  }

  function persistNotes() {
    writeStorage(STORAGE.notes, state.notes);
    writeStorage(STORAGE.activeNote, state.activeNoteId);
  }

  function renderNotesList() {
    const list = document.getElementById("savedNotesList");
    if (!list) return;
    list.innerHTML = "";

    if (!state.notes.length) {
      const empty = document.createElement("p");
      empty.className = "empty-notes-message";
      empty.textContent = "No saved notes yet.";
      list.appendChild(empty);
      return;
    }

    state.notes.forEach((note) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "saved-note-item";
      button.classList.toggle("active", note.id === state.activeNoteId);
      button.innerHTML = `<strong>${escapeHtml(note.title)}</strong><span>${escapeHtml(formatDate(note.updatedAt))}</span>`;
      button.addEventListener("click", () => loadNote(note.id));
      list.appendChild(button);
    });
  }

  function clearNoteEditor() {
    const editor = document.getElementById("mainNote");
    if (editor) editor.value = "";
    const title = document.getElementById("currentNoteTitle");
    if (title) title.textContent = "New Note";
    const timestamp = document.getElementById("noteTimestamp");
    if (timestamp) timestamp.textContent = "Start typing to save this note.";
    const deleteButton = document.getElementById("deleteNoteBtn");
    if (deleteButton) deleteButton.disabled = true;
    updateNoteCharacterCount(0);
    setNoteStatus("Your note will save automatically.");
  }

  function deriveNoteTitle(content) {
    const firstLine = content.split(/\r?\n/).find((line) => line.trim())?.trim();
    if (!firstLine) return "New Note";
    return firstLine.length > 48 ? `${firstLine.slice(0, 45)}...` : firstLine;
  }

  function setNoteStatus(message) {
    const status = document.getElementById("noteSaveStatus");
    if (status) status.textContent = message;
  }

  function updateNoteCharacterCount(count) {
    let counter = document.getElementById("noteCharacterCounter");
    const editor = document.getElementById("mainNote");
    if (!counter && editor) {
      counter = document.createElement("p");
      counter.id = "noteCharacterCounter";
      counter.className = "note-character-counter";
      editor.insertAdjacentElement("afterend", counter);
    }
    if (counter) counter.textContent = `${count.toLocaleString()} characters`;
  }

  function bindSavedPrompts() {
    state.prompts = readStorage(STORAGE.prompts, []);
    if (!Array.isArray(state.prompts)) state.prompts = [];

    document.getElementById("savePromptLibraryBtn")?.addEventListener("click", savePrompt);
    document.getElementById("clearPromptFormBtn")?.addEventListener("click", clearPromptForm);

    addPromptSearchField();
    renderSavedPrompts();
  }

  function addPromptSearchField() {
    const card = document.querySelector("#prompts .prompt-list-card");
    const heading = card?.querySelector(".prompt-list-heading");
    if (!card || !heading || document.getElementById("savedPromptSearch")) return;

    const search = document.createElement("input");
    search.id = "savedPromptSearch";
    search.type = "search";
    search.placeholder = "Search saved prompts...";
    search.setAttribute("aria-label", "Search saved prompts");
    search.addEventListener("input", renderSavedPrompts);
    heading.insertAdjacentElement("afterend", search);
  }

  function savePrompt() {
    const titleInput = document.getElementById("savedPromptTitle");
    const textInput = document.getElementById("savedPromptText");
    const title = titleInput?.value.trim() || "Untitled Prompt";
    const text = textInput?.value.trim() || "";

    if (!text) {
      showToast("Add your prompt before saving it.", true);
      textInput?.focus();
      return;
    }

    state.prompts.unshift({
      id: createId("prompt"),
      title,
      text,
      createdAt: new Date().toISOString()
    });
    writeStorage(STORAGE.prompts, state.prompts);
    clearPromptForm();
    renderSavedPrompts();
    showToast("Prompt saved.");
  }

  function clearPromptForm() {
    const titleInput = document.getElementById("savedPromptTitle");
    const textInput = document.getElementById("savedPromptText");
    if (titleInput) titleInput.value = "";
    if (textInput) textInput.value = "";
    titleInput?.focus();
  }

  function renderSavedPrompts() {
    const list = document.getElementById("savedPromptsList");
    const empty = document.getElementById("savedPromptsEmpty");
    const count = document.getElementById("savedPromptCount");
    const search = document.getElementById("savedPromptSearch")?.value.trim().toLowerCase() || "";
    if (!list) return;

    const filtered = state.prompts.filter((prompt) => {
      return !search || prompt.title.toLowerCase().includes(search) || prompt.text.toLowerCase().includes(search);
    });

    list.innerHTML = "";
    if (count) count.textContent = `${state.prompts.length} saved`;
    if (empty) empty.hidden = filtered.length > 0;

    filtered.forEach((prompt) => {
      const article = document.createElement("article");
      article.className = "saved-prompt-item";
      article.innerHTML = `
        <div class="saved-prompt-heading">
          <div>
            <h3>${escapeHtml(prompt.title)}</h3>
            <p>${escapeHtml(formatDate(prompt.createdAt))}</p>
          </div>
        </div>
        <pre>${escapeHtml(prompt.text)}</pre>
        <div class="saved-prompt-actions">
          <button type="button" class="secondary-btn copy-saved-prompt">Copy</button>
          <button type="button" class="danger-btn delete-saved-prompt">Delete</button>
        </div>`;

      article.querySelector(".copy-saved-prompt")?.addEventListener("click", () => copyText(prompt.text, "Prompt copied."));
      article.querySelector(".delete-saved-prompt")?.addEventListener("click", () => deletePrompt(prompt.id));
      list.appendChild(article);
    });
  }

  function deletePrompt(promptId) {
    const prompt = state.prompts.find((item) => item.id === promptId);
    if (!prompt || !window.confirm(`Delete “${prompt.title}”?`)) return;
    state.prompts = state.prompts.filter((item) => item.id !== promptId);
    writeStorage(STORAGE.prompts, state.prompts);
    renderSavedPrompts();
    showToast("Prompt deleted.");
  }

  function bindReferenceLibrary() {
    state.referenceImages = readStorage(STORAGE.references, []);
    if (!Array.isArray(state.referenceImages)) state.referenceImages = [];

    document.getElementById("referenceImageUpload")?.addEventListener("change", handleReferenceUpload);
    document.getElementById("clearReferenceImagesBtn")?.addEventListener("click", clearReferenceImages);
    renderReferenceImages();
  }

  async function handleReferenceUpload(event) {
    const files = [...(event.target.files || [])];
    if (!files.length) return;

    const availableSlots = Math.max(0, MAX_REFERENCE_IMAGES - state.referenceImages.length);
    if (!availableSlots) {
      showToast(`You can save up to ${MAX_REFERENCE_IMAGES} images in this browser.`, true);
      event.target.value = "";
      return;
    }

    const accepted = files.slice(0, availableSlots);
    let skipped = 0;

    for (const file of accepted) {
      if (!file.type.startsWith("image/") || file.size > MAX_REFERENCE_IMAGE_SIZE) {
        skipped += 1;
        continue;
      }
      try {
        const dataUrl = await fileToDataUrl(file);
        state.referenceImages.unshift({
          id: createId("image"),
          name: file.name,
          dataUrl,
          addedAt: new Date().toISOString()
        });
      } catch (error) {
        console.warn("Reference image could not be read.", error);
        skipped += 1;
      }
    }

    if (!writeStorage(STORAGE.references, state.referenceImages)) {
      state.referenceImages = readStorage(STORAGE.references, []);
    }
    event.target.value = "";
    renderReferenceImages();
    showToast(skipped ? "Some images were skipped. Use images under 1.5 MB." : "Reference images saved.", skipped > 0);
  }

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error || new Error("File could not be read."));
      reader.readAsDataURL(file);
    });
  }

  function renderReferenceImages() {
    const grid = document.getElementById("uploadedReferenceGrid");
    const count = document.getElementById("referenceImageCount");
    const clearButton = document.getElementById("clearReferenceImagesBtn");
    if (!grid) return;

    grid.innerHTML = "";
    if (count) count.textContent = `${state.referenceImages.length} image${state.referenceImages.length === 1 ? "" : "s"}`;
    if (clearButton) clearButton.disabled = state.referenceImages.length === 0;

    if (!state.referenceImages.length) {
      const empty = document.createElement("div");
      empty.className = "reference-empty-state";
      empty.id = "referenceEmptyState";
      empty.innerHTML = `<i data-lucide="images"></i><h3>No uploaded images yet</h3><p>Click <strong>Choose Images</strong> to add your first reference image.</p>`;
      grid.appendChild(empty);
      refreshIcons();
      return;
    }

    state.referenceImages.forEach((image) => {
      const card = document.createElement("article");
      card.className = "reference-image-card uploaded-reference-card";
      card.innerHTML = `
        <div class="reference-image-frame"><img src="${image.dataUrl}" alt="${escapeHtml(image.name)}"></div>
        <div class="reference-image-card-body">
          <div><h3>${escapeHtml(image.name)}</h3><p>Saved ${escapeHtml(formatDate(image.addedAt))}</p></div>
          <button type="button" class="danger-btn remove-reference-image">Remove</button>
        </div>`;
      card.querySelector(".remove-reference-image")?.addEventListener("click", () => removeReferenceImage(image.id));
      grid.appendChild(card);
    });
  }

  function removeReferenceImage(imageId) {
    state.referenceImages = state.referenceImages.filter((item) => item.id !== imageId);
    writeStorage(STORAGE.references, state.referenceImages);
    renderReferenceImages();
    showToast("Reference image removed.");
  }

  function clearReferenceImages() {
    if (!state.referenceImages.length) return;
    if (!window.confirm("Remove all uploaded reference images from this browser?")) return;
    state.referenceImages = [];
    writeStorage(STORAGE.references, []);
    renderReferenceImages();
    showToast("All uploaded reference images were removed.");
  }

  function bindDownloads() {
    const downloadContent = {
      publish: {
        filename: "Workshop-Publish-Checklist.txt",
        title: "Publish Checklist",
        body: `WORKSHOP PUBLISH CHECKLIST\n\n1. Save index.html, css/style.css, and js/script.js.\n2. Test the project with Live Server.\n3. Confirm every button, link, image, and download works.\n4. Commit the final files to GitHub.\n5. Push the latest commit.\n6. Connect the repository to Netlify.\n7. Publish the site.\n8. Open the live link and test it again.\n9. Test the mobile layout.\n10. Save the final live URL.`
      },
      selling: {
        filename: "Workshop-Selling-Guide.txt",
        title: "Selling Guide",
        body: `WORKSHOP SELLING GUIDE\n\n1. Prepare the live generator link.\n2. Create buyer instructions.\n3. Take clear screenshots.\n4. Create a product mockup.\n5. Write a clear product title and description.\n6. Explain who the product helps.\n7. List what the buyer receives.\n8. Add simple terms of use.\n9. Upload the product to your selling platform.\n10. Test the purchase and delivery process before launch.`
      }
    };

    document.querySelectorAll(".download-btn[data-download]").forEach((button) => {
      button.addEventListener("click", () => {
        const item = downloadContent[button.dataset.download];
        if (!item) {
          showToast("That download is not available yet.", true);
          return;
        }
        downloadTextFile(item.filename, item.body);
        recordDownload(item.title);
        button.textContent = "Downloaded";
        button.dataset.status = "downloaded";
      });
    });
  }

  function downloadTextFile(filename, content, type = "text/plain") {
    try {
      const blob = new Blob([content], { type: `${type};charset=utf-8` });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      showToast("Download started.");
    } catch (error) {
      console.warn("Download failed.", error);
      showToast("The download could not be created.", true);
    }
  }

  function recordDownload(name) {
    const history = readStorage(STORAGE.downloadHistory, []);
    history.unshift({ name, date: new Date().toISOString() });
    writeStorage(STORAGE.downloadHistory, history.slice(0, 25));
  }

  function bindReplays() {
    document.querySelectorAll(".replay-btn[data-replay]").forEach((button) => {
      button.addEventListener("click", () => {
        const replayName = button.dataset.replay === "day1" ? "Day 1" : "Day 2";
        const replayUrl = REPLAY_LINKS[button.dataset.replay];

        if (!replayUrl) {
          showToast(`${replayName} replay link has not been added yet.`);
          return;
        }

        const history = readStorage(STORAGE.replayHistory, {});
        history[button.dataset.replay] = { openedAt: new Date().toISOString(), progress: 0 };
        writeStorage(STORAGE.replayHistory, history);
        window.open(replayUrl, "_blank", "noopener,noreferrer");
      });
    });
  }

  function bindAnnouncements() {
    const page = document.getElementById("announcements");
    const announcement = page?.querySelector(".lesson-block");
    if (!announcement) return;

    const status = readStorage(STORAGE.announcements, {});
    const id = "welcome-announcement";
    const read = Boolean(status[id]);

    const badge = document.createElement("span");
    badge.className = `announcement-badge${read ? " read" : ""}`;
    badge.textContent = read ? "Read" : "New";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "secondary-btn announcement-read-btn";
    button.textContent = read ? "Marked as Read" : "Mark as Read";
    button.disabled = read;
    button.addEventListener("click", () => {
      status[id] = true;
      writeStorage(STORAGE.announcements, status);
      badge.textContent = "Read";
      badge.classList.add("read");
      button.textContent = "Marked as Read";
      button.disabled = true;
      showToast("Announcement marked as read.");
    });

    announcement.prepend(badge);
    announcement.appendChild(button);
  }

  function bindCommunityPlaceholders() {
    const block = document.querySelector("#community .lesson-block");
    if (!block || block.querySelector(".community-placeholder-actions")) return;

    const pinned = document.createElement("div");
    pinned.className = "community-pinned-note";
    pinned.innerHTML = `<strong>📌 Pinned:</strong> Community posting and replies are coming soon.`;

    const actions = document.createElement("div");
    actions.className = "community-placeholder-actions";
    actions.innerHTML = `
      <button type="button" class="secondary-btn community-like-btn" aria-pressed="false">♡ Like</button>
      <button type="button" class="secondary-btn community-reply-btn">Reply</button>`;

    actions.querySelector(".community-like-btn")?.addEventListener("click", (event) => {
      const button = event.currentTarget;
      const liked = button.getAttribute("aria-pressed") !== "true";
      button.setAttribute("aria-pressed", String(liked));
      button.textContent = liked ? "♥ Liked" : "♡ Like";
    });
    actions.querySelector(".community-reply-btn")?.addEventListener("click", () => {
      showToast("Community replies are coming soon.");
    });

    block.prepend(pinned);
    block.appendChild(actions);
  }

  function bindSettings() {
    const page = document.getElementById("settings");
    const boxes = [...(page?.querySelectorAll("input[type='checkbox']") || [])];
    const saved = readStorage(STORAGE.settings, {});

    boxes.forEach((box, index) => {
      const label = box.closest("li")?.textContent.trim() || `setting-${index}`;
      const key = slugify(label);
      box.dataset.setting = key;
      if (Object.prototype.hasOwnProperty.call(saved, key)) box.checked = Boolean(saved[key]);

      box.addEventListener("change", () => {
        const current = readStorage(STORAGE.settings, {});
        current[key] = box.checked;
        writeStorage(STORAGE.settings, current);
        document.body.setAttribute(`data-setting-${key}`, String(box.checked));
        showToast("Preference saved.");
      });

      document.body.setAttribute(`data-setting-${key}`, String(box.checked));
    });
  }

  function bindExternalLinkConfirmation() {
    document.querySelectorAll("#book-session a[target='_blank']").forEach((link) => {
      link.addEventListener("click", (event) => {
        const approved = window.confirm("This will open the booking page in a new tab. Continue?");
        if (!approved) event.preventDefault();
      });
    });

    document.querySelectorAll("a[target='_blank']").forEach((link) => {
      link.rel = "noopener noreferrer";
    });
  }

  function bindReset() {
    document.getElementById("resetDataBtn")?.addEventListener("click", () => {
      const approved = window.confirm("Reset all saved notes, prompts, checklists, progress, preferences, and uploaded reference images on this device?");
      if (!approved) return;

      Object.values(STORAGE).forEach(removeStorage);
      showToast("Workshop data reset.");
      window.setTimeout(() => window.location.reload(), 600);
    });
  }

  function bindKeyboardSupport() {
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeMobileMenu();
        closeWorkshopLockPopup();
        if (dom.completionPopup && !dom.completionPopup.classList.contains("hidden")) closeAchievementPopup();
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        dom.globalSearch?.focus();
      }
    });
  }

  function createId(prefix) {
    if (window.crypto?.randomUUID) return `${prefix}-${window.crypto.randomUUID()}`;
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function formatDate(value) {
    const date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) return "just now";
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
      hour: "numeric",
      minute: "2-digit"
    }).format(date);
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function slugify(value) {
    return String(value)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function decodeHtmlEntities(value) {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = value;
    return textarea.value;
  }

  function prefersReducedMotion() {
    return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  }
})();
