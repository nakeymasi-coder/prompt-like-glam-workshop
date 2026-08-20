(() => {
  "use strict";

  const APP_PREFIX = "glamWorkshopPortal";
  const SUPABASE_URL = "https://zaylygsgbqtulnilcvrg.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_9OrEqYDv9NV8E29JakoepA_rIgYDsMk";
  const COMMUNITY_IMAGE_BUCKET = "community-images";
  const MAX_COMMUNITY_IMAGE_SIZE = 5_000_000;
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
    websiteWorkshopAccess: `${APP_PREFIX}:websiteWorkshopAccess`,
    websiteWorkshopDate: `${APP_PREFIX}:websiteWorkshopDate`,
    promptWorkshopAccess: `${APP_PREFIX}:promptWorkshopAccess`,
    replayHistory: `${APP_PREFIX}:replayHistory`,
  };

  const VALID_PAGES = new Set([
    "requirements",
    "portal-home",
    "announcements",
    "community",
    "back-room",
    "quick-help",
    "common-mistakes",
    "settings",
    "prompt-access",
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
    "website-access",
    "website-dashboard",
    "beacon-dashboard",
    "chatgpt-dashboard",
    "payhip-dashboard",
  ]);

  const LOCKED_WORKSHOP_PAGES = new Set([
    "website-dashboard",
    "beacon-dashboard",
    "chatgpt-dashboard",
    "payhip-dashboard",
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
    "certificate",
  ]);

  const MAX_REFERENCE_IMAGE_SIZE = 1_500_000;
  const MAX_REFERENCE_IMAGES = 8;

  const REPLAY_LINKS = {
    day1: "https://drive.google.com/file/d/1R5-puzbimQdwxj0atVYkDeuhm36pHnyT/view?usp=sharing",
    day2: "https://drive.google.com/file/d/1EXFI6FIvZATbPO9tfLVoxczRD-TMx15j/view?usp=sharing",
  };

  const snippetLibrary = {
    dayOnePlan: `You are a friendly project-planning guide helping me turn an idea into a clear plan I can build with vibe coding. I may be completely new to coding, so use plain everyday language, keep things simple, and never assume I know technical terms.\n\nGuide me by asking ONE short question at a time. Do not give me a long questionnaire. If I already answered something, remember it and do not ask me again.\n\nStart with these questions, one at a time:\n\n1. Ask: \"What am I helping you create today?\" Give a few simple examples such as a prompt generator, website, web app/tool, landing page, or something else. Let me describe my idea in my own words too.\n\n2. Ask where I plan to create or code it. Give simple examples such as VS Code, ChatGPT Sites, another coding platform/editor, or \"I'm not sure yet.\" If I name a file type or term that is not actually a building platform, explain the difference in one simple sentence and help me choose the right option.\n\n3. Ask: \"How experienced are you with vibe coding?\" Give three choices: Beginner, Intermediate, or Advanced.\n\n4. Ask how much guidance I want while building. Give two choices: \"Walk me through it step by step\" or \"I know my way around—just guide me when needed.\" Match all later explanations to that choice.\n\n5. Ask whether I already know the specific kind of project I want to make. If yes, let me explain it and use what I tell you. If no, help me narrow the idea with only a few relevant examples based on the type of project I chose.\n\n6. Ask whether I have a reference image, screenshot, example website, or other visual I want to use. If yes, ask me to upload it or share it. Analyze it for me instead of making me describe things I may not know the name of. If it is my own original image, ask whether I want to use it as inspiration or recreate it closely.\n\nAfter those questions, ask ONLY for details that are truly needed to plan the specific project I chose. Do not automatically ask for a target audience. Ask about audience only if it actually affects what I am building. Do not automatically ask whether something is an image generator or text generator; ask only if that distinction matters for my project.\n\nUse my answers as the source of truth. Do not add features I did not ask for. If you think something important is missing, explain it simply and ask before adding it.\n\nWhen you have enough information, say so and create a short, clear Project Foundation I can approve before we move on. The Project Foundation should capture what I am building, what it needs to do, the basic user experience, the important features I approved, my reference direction if I used one, anything I specifically do not want, and what a successful finished project should feel like.\n\nKeep the Project Foundation concise—about 300 to 500 words. Do not generate HTML, CSS, JavaScript, code IDs, selectors, giant option lists, or technical build instructions yet. Keep the conversation smooth, beginner-friendly, and easy to follow.`,

    dayOneProjectSetup: `You are helping a complete beginner set up the project folder for a prompt generator on Windows.

Guide the user ONE small step at a time. Never dump all the steps at once. Wait for the user to say "done" before continuing.

Start by asking:
"Do you already have a finished prompt-generator project folder on your Desktop that you can copy and reuse?"

If YES:

- Walk them through copying the whole folder on the Desktop.
- Have them rename the copied folder using the approved generator name.
- Confirm the copy contains index.html, css/style.css, js/script.js, and an assets folder.
- Then show them how to open that copied folder in Visual Studio Code.

If NO:

- Walk them through creating one main project folder on the Desktop.
- Inside it, create index.html, a css folder with style.css, a js folder with script.js, and an assets folder with an images folder.
- Then show them how to open the finished main folder in Visual Studio Code.

Use beginner-friendly Windows directions with exact clicks. Do not generate code. Do not explain coding concepts unless the user asks.

When setup is verified, end with: "Your project folder is ready. Return to the Workshop Companion and continue to Choose Your Content & Design."`,

    dayOneDesign: `You are continuing the same project from the previous steps.

The project idea and Build Plan have already been completed and approved. The project folder has also been set up.

Use everything already established in this conversation.

Do not ask the user to paste the Build Plan again.

Do not make the user repeat answers they already gave.

Do not restart the planning process.

Now help the user decide exactly how their project should look and be organized before building the HTML.

Keep this process simple, visual, and beginner-friendly.

Start by briefly saying:

“Now that we know what we’re building and your project folder is ready, let’s decide how you want it to look.”

Then review what you already know from the conversation, including any:

• Reference images or screenshots
• Brand colors
• Style preferences
• Layout ideas
• Required sections, pages, or tabs
• Features already approved

If a reference image was already uploaded, use it. Do not ask the user to upload it again.

Ask only about IMPORTANT design decisions that are still missing.

Ask one question at a time.

Ask no more than 5 design questions total.

Do not ask questions just to fill the limit.

Possible questions may include:

• What overall look or vibe do you want?
• What colors do you want?
• Do you want a simple one-page layout, sections, pages, or tabs?
• How do you want your choices or controls displayed?
• Are there any special visual details you definitely want included or avoided?

Only ask questions that apply to this project.

If the user already answered one of these earlier, do not ask it again.

If enough design information already exists, skip the questions and move directly to the design guide.

When the design direction is clear, briefly summarize it and ask:

“Does this look right before we build it?”

After approval, create a short CONTENT & DESIGN GUIDE containing only what the coding steps actually need:

1. Overall Look
2. Colors
3. Fonts
4. Page, Section, or Tab Layout
5. Cards, Choices & Controls
6. Buttons
7. Output or Results Area
8. Important Visual Details
9. Mobile Layout

Keep it concise.

Do not create a long design document.

Do not explain technical coding details.

Do not include IDs, selectors, DOM terminology, state architecture, implementation contracts, or developer jargon.

Do not write HTML, CSS, or JavaScript yet.

End with:

“Your design is approved and ready to build. Continue to Build the HTML.”`,

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

    dayTwoFinalTest: `You are helping a complete beginner complete a final test of an existing project. Ask me to upload the complete current project. Inspect it first. Then test navigation, buttons, forms, links, downloads, outputs, local storage, desktop, tablet, and mobile behavior one section at a time. Fix only verified problems and do not redesign the project.`,
  };

  snippetLibrary.dayOnePlan = `You are helping someone plan and build a coding project using AI.

Your job is to make the process simple, clear, conversational, and easy to follow.

The user may be brand new to vibe coding even if they already know what they want to create.

Use plain everyday language.

Do not use unnecessary technical jargon.
Do not overwhelm the user.
Do not give a long questionnaire.
Do not ask questions the user has already answered.
Do not ask for information that is not needed to build their project.
Give simple examples whenever they help explain a question.

IMPORTANT QUESTION LIMIT:

Ask no more than 6 important core questions.

After you know what the user is creating, you may ask up to 4 additional project-specific questions ONLY when they are necessary.

NEVER ask more than 10 total questions during this planning step.

If you already have enough information before reaching the limit, STOP asking questions and move forward.

Ask ONE question at a time and wait for the answer.

────────────────────
CORE QUESTIONS
────────────────────

QUESTION 1

Ask:

“What are we creating today?

For example:
• Prompt Generator
• Website
• App
• Landing Page
• Interactive Tool
• Something else

If you’re not sure what to call it, just tell me what you want it to do.”

Wait for the answer.

QUESTION 2

Ask:

“Where are you planning to build it?

For example:
• VS Code
• Replit
• Another coding tool
• I’m not sure yet”

Wait for the answer.

QUESTION 3

Ask:

“How comfortable are you with vibe coding?

• Beginner — walk me through everything step by step
• Intermediate — I know the basics but still need guidance
• Advanced — I’m comfortable working with code”

Use this answer to control how you explain things for the rest of the project.

Wait for the answer.

QUESTION 4

Ask:

“Do you already know exactly what you want to create, or do you want me to help you develop the idea?”

Wait for the answer.

QUESTION 5

Ask:

“Do you have any reference images, screenshots, websites, designs, or examples you want to use for inspiration?

You can upload them if you have them. If not, we can keep going without them.”

Never require a reference.

Wait for the answer.

QUESTION 6

Ask a question specific to the project they selected:

“What is the main thing you want this project to do?”

Give a few examples that match THEIR project.

Do not give unrelated examples.

Wait for the answer.

────────────────────
PROJECT-SPECIFIC QUESTIONS
────────────────────

After the 6 core questions, decide whether you actually need more information.

You may ask a MAXIMUM of 4 additional questions.

Do not automatically ask all four.

Only ask what is necessary to understand and build the project correctly.

The total number of planning questions must NEVER exceed 10.

Choose questions based on what the user is creating.

IF THEY CHOOSE AN APP OR INTERACTIVE TOOL:

Make sure you understand, when relevant:

• What the user should be able to do
• Whether it needs one screen, multiple pages, tabs, or sections
• What users will enter, select, upload, or click
• What the app should produce, show, save, or download
• Whether information needs to be saved
• Whether it needs history
• Whether it needs user accounts or login
• Whether it needs uploads
• Whether it needs external services
• Any must-have interactive features

Do NOT ask about every item on this list.

Combine related information naturally and ask only the most important missing questions.

Never exceed the 10-question total.

IF THEY CHOOSE A WEBSITE:

Make sure you understand, when relevant:

• What type of website they want
• What pages or main sections it needs
• Whether visitors need to click, book, buy, sign up, submit forms, watch videos, download something, or perform another action
• Whether the website needs interactive features
• Whether they already have content, images, branding, or links
• Any must-have features

Only ask about information that is still missing.

Never exceed the 10-question total.

IF THEY CHOOSE A PROMPT GENERATOR:

Ask only what is necessary to determine:

• What kind of prompts it should create
• What choices or categories the user should control
• Whether it needs custom text fields
• Whether it needs presets
• Whether it needs Randomize
• Whether it needs Locks
• Whether it needs Copy or Clear
• Whether it creates one output or multiple outputs
• Any special rules the generator must follow

Do not turn this into a technical questionnaire.

Never exceed the 10-question total.

IF THEY CHOOSE A LANDING PAGE:

Focus only on:

• What the page is promoting
• What sections it needs
• The main action visitors should take
• Any forms, buttons, videos, checkout links, booking links, or other interactive features that are needed

IF THEY CHOOSE SOMETHING ELSE:

Adapt the questions to their project.

Ask only what you actually need to understand how it should work.

────────────────────
IMPORTANT RULES
────────────────────

Do not ask for a target audience unless knowing the audience would actually change what needs to be built.

Do not ask the user to make technical decisions they may not understand.

When a technical decision is necessary, explain it simply and recommend the best choice.

If the user says “I don’t know,” help them decide instead of repeatedly questioning them.

If the user provides a reference image or example, use it to reduce the number of questions you need to ask.

If the user already answered something naturally in an earlier response, count it as answered and DO NOT ask it again.

Do not use the full 10 questions just because you are allowed to.

The goal is to understand the project using the FEWEST questions necessary.

────────────────────
CONFIRM THE IDEA
────────────────────

When you have enough information, STOP asking questions.

Briefly summarize what you understand the user wants to create.

Keep the summary short.

Then ask:

“Did I get that right, or is there anything you want to change or add before I make your Build Plan?”

This confirmation does NOT restart the discovery questions.

After the user approves it, create the Build Plan.

────────────────────
BUILD PLAN
────────────────────

Keep the Build Plan clear, useful, and concise.

Include only information that will actually help build this specific project.

The Build Plan may include:

• Project name
• What is being created
• Where it will be built
• Main purpose
• Main sections, pages, or tabs
• Important inputs or choices
• Important interactive features
• What the project produces or does
• Visual/reference direction
• Must-have features
• Important rules
• What needs to be built next

Only include sections that apply.

Do NOT create:

• Huge planning documents
• DOM contracts
• Selector contracts
• State architecture documents
• ARIA specification documents
• Developer documentation
• Long technical explanations
• Repetitive summaries

Keep technical implementation details for the actual coding steps.

End with:

“Your Build Plan is ready. Stay in this same ChatGPT conversation so I can use everything we already decided when we move to the next step.”`;

  const state = {
    currentPage: "portal-home",
    notes: [],
    activeNoteId: null,
    prompts: [],
    referenceImages: [],
    saveTimer: null,
    communityClient: null,
    communityUser: null,
    communityProfile: null,
    communityIsAdmin: false,
    communityChannel: null,
    communityRefreshTimer: null,
  };

  const dom = {};

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    cacheDom();
    bindNavigation();
    bindMobileMenu();
    bindGlobalSearch();
    bindWorkshopCards();
    bindWebsiteWorkshopAccess();
    bindPromptWorkshopAccess();
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
    await bindCommunity();
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

  // PRIVATE BACK ROOM
  if (pageId === "back-room" && !state.communityIsAdmin) {
    showToast("Back Room access is for the instructor only.", true);
    pageId = "portal-home";
  }

  // GLOBAL WORKSHOP AVAILABILITY FROM BACK ROOM
  const workshopAvailability = state.portalWorkshops || {};

  if (
    (pageId === "prompt-access" ||
      pageId === "prompt-dashboard") &&
    workshopAvailability.prompt === false
  ) {
    showToast("The Prompt Generator Workshop is not currently available.", true);
    pageId = "portal-home";
  }

  if (
    (pageId === "website-access" ||
      pageId === "website-dashboard") &&
    workshopAvailability.website === false
  ) {
    showToast("The Website Workshop is not currently available.", true);
    pageId = "portal-home";
  }

  const target = document.getElementById(pageId);

  // EXISTING INDIVIDUAL WORKSHOP ACCESS
  if (pageId === "prompt-dashboard") {
    const hasPromptAccess = readStorage(
      STORAGE.promptWorkshopAccess,
      false,
    );

    if (!hasPromptAccess) {
      return showPage("prompt-access", {
        save,
        focus,
      });
    }
  } else if (pageId === "website-dashboard") {
    const hasWebsiteAccess = readStorage(
      STORAGE.websiteWorkshopAccess,
      false,
    );

    if (!hasWebsiteAccess) {
      return showPage("website-access", {
        save,
        focus,
      });
    }
  } else if (LOCKED_WORKSHOP_PAGES.has(pageId)) {
    openWorkshopLockPopup(
      `${pageLabel(pageId)} is locked and not available yet.`,
    );
    return false;
  }

    if (
      pageId === "certificate" &&
      !readStorage(STORAGE.dayProgress, {}).dayTwo
    ) {
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
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });

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
  const requestedPage = new URLSearchParams(window.location.search).get("page");

  const firstPage =
    requestedPage && VALID_PAGES.has(requestedPage)
      ? requestedPage
      : "portal-home";

  showPage(firstPage, { save: false, focus: false });
}

  function bindNavigation() {
    document.querySelectorAll("[data-page]").forEach((control) => {
      control.addEventListener("click", (event) => {
        event.preventDefault();
        const pageId = control.dataset.page;

        if (!pageId || !document.getElementById(pageId)) {
          openWorkshopLockPopup(
            "This workshop is not available in your portal yet.",
          );
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
      dom.mobileMenuBtn.setAttribute(
        "aria-label",
        isOpen ? "Close menu" : "Open menu",
      );
    });

    document.addEventListener("click", (event) => {
      if (window.innerWidth > 900 || !dom.sidebar?.classList.contains("open"))
        return;
      if (
        dom.sidebar.contains(event.target) ||
        dom.mobileMenuBtn?.contains(event.target)
      )
        return;
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
        return (
          !LOCKED_WORKSHOP_PAGES.has(page.id) &&
          page.textContent.toLowerCase().includes(query)
        );
      });
      const currentMatch = matches.find(
        (page) => page.id === state.currentPage,
      );

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
    document
      .querySelectorAll(".search-match")
      .forEach((item) => item.classList.remove("search-match"));
  }

  function pageLabel(pageId) {
    const page = document.getElementById(pageId);
    return page?.querySelector("h1")?.textContent.trim() || pageId;
  }

  function bindWorkshopCards() {
    document.getElementById("continueBtn")?.addEventListener("click", () => {
      const lastPage = readStorage(STORAGE.lastPage, null);
      const lastWorkshop = readStorage(
        STORAGE.lastWorkshop,
        "prompt-dashboard",
      );
      const destination =
        lastPage && PROMPT_WORKSHOP_PAGES.has(lastPage)
          ? lastPage
          : lastWorkshop;
      showPage(
        document.getElementById(destination) ? destination : "prompt-dashboard",
      );
    });
  }

  function bindWebsiteWorkshopAccess() {
    const unlockBtn = document.getElementById("unlockWebsiteWorkshopBtn");
    const licenseInput = document.getElementById("websiteLicenseKey");
    const message = document.getElementById("websiteLicenseMessage");
    const lockedState = document.getElementById("websiteWorkshopLockedState");
    const unlockedState = document.getElementById(
      "websiteWorkshopUnlockedState",
    );

    if (!unlockBtn || !licenseInput || !lockedState || !unlockedState) return;

    const savedAccess = readStorage(STORAGE.websiteWorkshopAccess, false);

    if (savedAccess === true) {
      lockedState.hidden = true;
      unlockedState.hidden = false;
    }

    unlockBtn.addEventListener("click", async () => {
      const licenseKey = licenseInput.value.trim();

      if (!licenseKey) {
        message.textContent = "Please enter your workshop access key.";
        return;
      }

      unlockBtn.disabled = true;
      unlockBtn.textContent = "Checking Access...";

      if (message) {
        message.textContent = "Verifying your purchase...";
      }

      try {
        const response = await fetch("/.netlify/functions/verify-license", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            licenseKey,
          }),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          if (message) {
            message.textContent =
              result.message || "That access key could not be verified.";
          }
          return;
        }

        writeStorage(STORAGE.websiteWorkshopAccess, true);

        lockedState.hidden = true;
        unlockedState.hidden = false;

        if (message) {
          message.textContent = "";
        }

        showToast("Website Workshop unlocked!");
      } catch (error) {
        if (message) {
          message.textContent =
            "We could not verify your access right now. Please try again.";
        }
      } finally {
        unlockBtn.disabled = false;
        unlockBtn.textContent = "Unlock Workshop";
      }
    });
  }

  function bindPromptWorkshopAccess() {
    const unlockBtn = document.getElementById("unlockPromptWorkshopBtn");
    const licenseInput = document.getElementById("promptLicenseKey");
    const message = document.getElementById("promptLicenseMessage");
    const lockedState = document.getElementById("promptWorkshopLockedState");
    const unlockedState = document.getElementById(
      "promptWorkshopUnlockedState",
    );
    const existingStudentInput = document.getElementById(
      "existingPromptStudentCode",
    );
    const existingStudentBtn = document.getElementById(
      "unlockExistingPromptStudentBtn",
    );
    const existingStudentMessage = document.getElementById(
      "existingPromptStudentMessage",
    );

    if (!unlockBtn || !licenseInput || !lockedState || !unlockedState) return;

    const savedAccess = readStorage(STORAGE.promptWorkshopAccess, false);

    if (savedAccess === true) {
      lockedState.hidden = true;
      unlockedState.hidden = false;
    }

    existingStudentBtn?.addEventListener("click", () => {
      const studentCode = existingStudentInput?.value.trim();

      if (!studentCode) {
        if (existingStudentMessage) {
          existingStudentMessage.textContent =
            "Please enter your original student access code.";
        }
        return;
      }

      if (studentCode !== "GLAM2026") {
        if (existingStudentMessage) {
          existingStudentMessage.textContent =
            "That existing student code is incorrect.";
        }
        return;
      }

      writeStorage(STORAGE.promptWorkshopAccess, true);

      lockedState.hidden = true;
      unlockedState.hidden = false;

      if (existingStudentMessage) {
        existingStudentMessage.textContent = "";
      }

      showToast("Prompt Generator Workshop unlocked!");
    });

    unlockBtn.addEventListener("click", async () => {
      const licenseKey = licenseInput.value.trim();

      if (!licenseKey) {
        message.textContent =
          "Please enter your Prompt Generator Workshop access key.";
        return;
      }

      unlockBtn.disabled = true;
      unlockBtn.textContent = "Checking Access...";

      if (message) {
        message.textContent = "Verifying your purchase...";
      }

      try {
        const response = await fetch(
          "/.netlify/functions/verify-prompt-license",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              licenseKey,
            }),
          },
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          if (message) {
            message.textContent =
              result.message || "That access key could not be verified.";
          }
          return;
        }

        writeStorage(STORAGE.promptWorkshopAccess, true);

        lockedState.hidden = true;
        unlockedState.hidden = false;

        if (message) {
          message.textContent = "";
        }

        showToast("Prompt Generator Workshop unlocked!");
      } catch (error) {
        if (message) {
          message.textContent =
            "We could not verify your access right now. Please try again.";
        }
      } finally {
        unlockBtn.disabled = false;
        unlockBtn.textContent = "Unlock Workshop";
      }
    });
  }

  function bindLockedWorkshops() {
    document.querySelectorAll(".locked-workshop").forEach((link) => {
      link.setAttribute("aria-haspopup", "dialog");
      link.addEventListener("click", (event) => {
        event.preventDefault();
        const workshopName =
          link.dataset.workshop ||
          link
            .closest(".workshop-card")
            ?.querySelector("h2")
            ?.textContent.trim() ||
          "This workshop";
        openWorkshopLockPopup(
          `${workshopName} is locked and not available yet.`,
        );
      });
    });

    document
      .getElementById("closeWorkshopLockPopup")
      ?.addEventListener("click", closeWorkshopLockPopup);
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
    if (dom.workshopCodeMessage)
      dom.workshopCodeMessage.textContent = customMessage;
    window.setTimeout(
      () => document.getElementById("closeWorkshopLockPopup")?.focus(),
      50,
    );
  }

  function closeWorkshopLockPopup() {
    dom.workshopLockPopup?.classList.add("hidden");
    document.body.classList.remove("modal-open");
    if (dom.workshopCodeMessage) dom.workshopCodeMessage.textContent = "";
  }

  function bindPageButtons() {
    document
      .querySelector("#sell .launch-checklist-front .primary-btn")
      ?.addEventListener("click", () => {
        document
          .querySelector(".launch-checklist-card")
          ?.classList.add("is-flipped");
      });
    document
      .querySelector("#sell .launch-checklist-back .secondary-btn")
      ?.addEventListener("click", () => {
        document
          .querySelector(".launch-checklist-card")
          ?.classList.remove("is-flipped");
      });

    document
      .getElementById("copyReusableWelcomePromptBtn")
      ?.addEventListener("click", () => {
        copyElementValue(
          "reusableWelcomeMasterPrompt",
          "HTML template copied.",
        );
      });

    document
      .getElementById("downloadReusableWelcomePromptBtn")
      ?.addEventListener("click", () => {
        const content =
          document.getElementById("reusableWelcomeMasterPrompt")?.value || "";
        downloadTextFile(
          "reusable-app-welcome-page.html",
          decodeHtmlEntities(content),
          "text/html",
        );
        recordDownload("Reusable App Welcome Page Template");
      });
  }

  function bindCopyButtons() {
    document
      .querySelectorAll(".copy-snippet-btn[data-snippet]")
      .forEach((button) => {
        button.addEventListener("click", () => {
          const text = snippetLibrary[button.dataset.snippet];
          if (!text) {
            showToast("That workshop prompt has not been added yet.", true);
            return;
          }
          copyText(text, "Workshop prompt copied.");
        });
      });

    document
      .querySelectorAll(".copy-btn[data-copy-target]")
      .forEach((button) => {
        button.addEventListener("click", () =>
          copyElementValue(button.dataset.copyTarget),
        );
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
    document
      .getElementById("markDayOneCompleteBtn")
      ?.addEventListener("click", () => {
        setDayComplete("dayOne", true);
        showCompletion(
          "Day 1 Complete",
          "Your Day 1 progress has been saved. You are ready for Day 2.",
          "day-two",
          "Go to Day 2",
        );
      });

    document
      .getElementById("markDayTwoCompleteBtn")
      ?.addEventListener("click", () => {
        setDayComplete("dayTwo", true);
        showCompletion(
          "Workshop Complete",
          "Day 2 is complete. Your certificate is now unlocked.",
          "certificate",
          "View Certificate",
        );
      });

    document
      .getElementById("completionActionButton")
      ?.addEventListener("click", () => {
        closeAchievementPopup();
      });

    document
      .getElementById("closeCompletionPopup")
      ?.addEventListener("click", closeAchievementPopup);
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
    window.setTimeout(
      () => document.getElementById("closeCompletionPopup")?.focus(),
      50,
    );
  }

  function closeAchievementPopup() {
    const nextPage = dom.completionPopup?.dataset.nextPage;
    dom.completionPopup?.classList.add("hidden");
    document.body.classList.remove("modal-open");
    if (nextPage && document.getElementById(nextPage)) showPage(nextPage);
  }

  function bindChecklists() {
  const checkboxes = [
  ...document.querySelectorAll(".page input[type='checkbox']"),
].filter((box) => !box.closest("#back-room"));
    const saved = readStorage(STORAGE.checklist, {});

    checkboxes.forEach((checkbox, index) => {
      const key = checkboxKey(checkbox, index);
      checkbox.dataset.storageKey = key;
      if (Object.prototype.hasOwnProperty.call(saved, key))
        checkbox.checked = Boolean(saved[key]);

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
    const item =
      checkbox.closest("li")?.textContent.replace(/\s+/g, " ").trim() ||
      `checkbox-${index}`;
    return `${page}:${item}`;
  }

  function updatePortalProgress() {
    const checkboxes = [
      ...document.querySelectorAll(".page input[type='checkbox']"),
    ].filter(
  (box) =>
    !box.closest("#settings") &&
    !box.closest("#back-room"),
);
    const completed = checkboxes.filter((box) => box.checked).length;
    const percentage = checkboxes.length
      ? Math.round((completed / checkboxes.length) * 100)
      : 0;
    const dayProgress = readStorage(STORAGE.dayProgress, {});
    const adjusted = Math.max(
      percentage,
      dayProgress.dayTwo ? 100 : dayProgress.dayOne ? 50 : 0,
    );

    document.documentElement.style.setProperty(
      "--portal-progress",
      `${adjusted}%`,
    );
    document.body.dataset.progress = String(adjusted);

    let progressBadge = document.getElementById("portalProgressBadge");
    if (!progressBadge) {
      const headerActions = document.querySelector(
        "#portal-home .header-actions",
      );
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

    document
      .getElementById("newNoteBtn")
      ?.addEventListener("click", createNewNote);
    document
      .getElementById("deleteNoteBtn")
      ?.addEventListener("click", deleteActiveNote);

    const editor = document.getElementById("mainNote");
    editor?.addEventListener("input", () => {
      updateNoteCharacterCount(editor.value.length);
      setNoteStatus("Saving...");
      clearTimeout(state.saveTimer);
      state.saveTimer = window.setTimeout(saveActiveNote, 500);
    });

    renderNotesList();
    if (
      state.activeNoteId &&
      state.notes.some((note) => note.id === state.activeNoteId)
    ) {
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
      updatedAt: now.toISOString(),
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
    if (timestamp)
      timestamp.textContent = `Last saved ${formatDate(note.updatedAt)}`;
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
    if (timestamp)
      timestamp.textContent = `Last saved ${formatDate(note.updatedAt)}`;
    setNoteStatus("Saved automatically.");
  }

  function deleteActiveNote() {
    if (!state.activeNoteId) return;
    const note = state.notes.find((item) => item.id === state.activeNoteId);
    if (!note) return;
    if (!window.confirm(`Delete “${note.title}”? This cannot be undone.`))
      return;

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
    const firstLine = content
      .split(/\r?\n/)
      .find((line) => line.trim())
      ?.trim();
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
    // Saved Prompts is handled by js/saved-prompts-prd.js.
    // Keep the legacy helpers below intact for backward compatibility,
    // but do not bind or render them here so both systems do not compete.
    return;
  }

  function addPromptSearchField() {
    const card = document.querySelector("#prompts .prompt-list-card");
    const heading = card?.querySelector(".prompt-list-heading");
    if (!card || !heading || document.getElementById("savedPromptSearch"))
      return;

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
      createdAt: new Date().toISOString(),
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
    const search =
      document
        .getElementById("savedPromptSearch")
        ?.value.trim()
        .toLowerCase() || "";
    if (!list) return;

    const filtered = state.prompts.filter((prompt) => {
      return (
        !search ||
        prompt.title.toLowerCase().includes(search) ||
        prompt.text.toLowerCase().includes(search)
      );
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

      article
        .querySelector(".copy-saved-prompt")
        ?.addEventListener("click", () =>
          copyText(prompt.text, "Prompt copied."),
        );
      article
        .querySelector(".delete-saved-prompt")
        ?.addEventListener("click", () => deletePrompt(prompt.id));
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

    document
      .getElementById("referenceImageUpload")
      ?.addEventListener("change", handleReferenceUpload);
    document
      .getElementById("clearReferenceImagesBtn")
      ?.addEventListener("click", clearReferenceImages);
    renderReferenceImages();
  }

  async function handleReferenceUpload(event) {
    const files = [...(event.target.files || [])];
    if (!files.length) return;

    const availableSlots = Math.max(
      0,
      MAX_REFERENCE_IMAGES - state.referenceImages.length,
    );
    if (!availableSlots) {
      showToast(
        `You can save up to ${MAX_REFERENCE_IMAGES} images in this browser.`,
        true,
      );
      event.target.value = "";
      return;
    }

    const accepted = files.slice(0, availableSlots);
    let skipped = 0;

    for (const file of accepted) {
      if (
        !file.type.startsWith("image/") ||
        file.size > MAX_REFERENCE_IMAGE_SIZE
      ) {
        skipped += 1;
        continue;
      }
      try {
        const dataUrl = await fileToDataUrl(file);
        state.referenceImages.unshift({
          id: createId("image"),
          name: file.name,
          dataUrl,
          addedAt: new Date().toISOString(),
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
    showToast(
      skipped
        ? "Some images were skipped. Use images under 1.5 MB."
        : "Reference images saved.",
      skipped > 0,
    );
  }

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () =>
        reject(reader.error || new Error("File could not be read."));
      reader.readAsDataURL(file);
    });
  }

  function renderReferenceImages() {
    const grid = document.getElementById("uploadedReferenceGrid");
    const count = document.getElementById("referenceImageCount");
    const clearButton = document.getElementById("clearReferenceImagesBtn");
    if (!grid) return;

    grid.innerHTML = "";
    if (count)
      count.textContent = `${state.referenceImages.length} image${state.referenceImages.length === 1 ? "" : "s"}`;
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
      card
        .querySelector(".remove-reference-image")
        ?.addEventListener("click", () => removeReferenceImage(image.id));
      grid.appendChild(card);
    });
  }

  function removeReferenceImage(imageId) {
    state.referenceImages = state.referenceImages.filter(
      (item) => item.id !== imageId,
    );
    writeStorage(STORAGE.references, state.referenceImages);
    renderReferenceImages();
    showToast("Reference image removed.");
  }

  function clearReferenceImages() {
    if (!state.referenceImages.length) return;
    if (
      !window.confirm("Remove all uploaded reference images from this browser?")
    )
      return;
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
        body: `WORKSHOP PUBLISH CHECKLIST\n\n1. Save index.html, css/style.css, and js/script.js.\n2. Test the project with Live Server.\n3. Confirm every button, link, image, and download works.\n4. Commit the final files to GitHub.\n5. Push the latest commit.\n6. Connect the repository to Netlify.\n7. Publish the site.\n8. Open the live link and test it again.\n9. Test the mobile layout.\n10. Save the final live URL.`,
      },
      selling: {
        filename: "Workshop-Selling-Guide.txt",
        title: "Selling Guide",
        body: `WORKSHOP SELLING GUIDE\n\n1. Prepare the live generator link.\n2. Create buyer instructions.\n3. Take clear screenshots.\n4. Create a product mockup.\n5. Write a clear product title and description.\n6. Explain who the product helps.\n7. List what the buyer receives.\n8. Add simple terms of use.\n9. Upload the product to your selling platform.\n10. Test the purchase and delivery process before launch.`,
      },
    };

    document
      .querySelectorAll(".download-btn[data-download]")
      .forEach((button) => {
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
        history[button.dataset.replay] = {
          openedAt: new Date().toISOString(),
          progress: 0,
        };
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

  async function bindCommunity() {
    const authCard = document.getElementById("communityAuthCard");
    if (!authCard) return;

    if (!window.supabase?.createClient) {
      setCommunityAuthMessage(
        "The community connection could not load. Refresh the page and try again.",
        true,
      );
      return;
    }

    state.communityClient = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY,
    );
    await loadPortalAnnouncement();
    await loadPortalReplays();
    await loadPortalWorkshops();
await loadPortalResource();

    document
      .getElementById("communitySignUpBtn")
      ?.addEventListener("click", communitySignUp);
    document
      .getElementById("communitySignInBtn")
      ?.addEventListener("click", communitySignIn);
      
document
  .getElementById("communityForgotPasswordBtn")
  ?.addEventListener("click", communityForgotPassword);
    document
      .getElementById("communitySignOutBtn")
      ?.addEventListener("click", communitySignOut);
    document
      .getElementById("communityPostBtn")
      ?.addEventListener("click", createCommunityPost);
    document
      .getElementById("communityClearPostBtn")
      ?.addEventListener("click", clearCommunityPostForm);
    document
      .getElementById("communityRefreshBtn")
      ?.addEventListener("click", loadCommunityFeed);
      document
  .getElementById("saveBackRoomAnnouncementBtn")
  ?.addEventListener("click", saveBackRoomAnnouncement);
  document
  .getElementById("saveBackRoomReplaysBtn")
  ?.addEventListener("click", saveBackRoomReplays);

  document
  .getElementById("saveBackRoomWorkshopsBtn")
  ?.addEventListener("click", saveBackRoomWorkshops);
  
  document
  .getElementById("saveBackRoomResourceBtn")
  ?.addEventListener("click", saveBackRoomResource);

    document
      .getElementById("communityFeedFilter")
      ?.addEventListener("change", loadCommunityFeed);

    const {
      data: { session },
    } = await state.communityClient.auth.getSession();

    const isPasswordReset =
  new URLSearchParams(window.location.search).get("reset") === "1";

if (isPasswordReset && session?.user) {
  state.communityUser = session.user;
  showPasswordResetPanel();
} else {
  await applyCommunitySession(session);
}

state.communityClient.auth.onAuthStateChange((event, nextSession) => {
  window.setTimeout(async () => {
    if (event === "PASSWORD_RECOVERY") {
      state.communityUser = nextSession?.user || null;
      showPasswordResetPanel();
      return;
    }

    await applyCommunitySession(nextSession);
  }, 0);
});
  }

  function hasWorkshopCommunityAccess() {
    return Boolean(
      readStorage(STORAGE.promptWorkshopAccess, false) ||
        readStorage(STORAGE.websiteWorkshopAccess, false),
    );
  }

  async function communitySignUp() {
    if (!state.communityClient) return;

    if (!hasWorkshopCommunityAccess()) {
      setCommunityAuthMessage(
        "Unlock one of your purchased workshops before creating a community account.",
        true,
      );
      return;
    }

    const displayName =
      document.getElementById("communityDisplayName")?.value.trim() || "";
    const email = document.getElementById("communityEmail")?.value.trim() || "";
    const password =
      document.getElementById("communityPassword")?.value || "";

    if (!displayName) {
      setCommunityAuthMessage("Enter the name you want shown on your posts.", true);
      return;
    }

    if (!email || !password) {
      setCommunityAuthMessage("Enter your email and a password.", true);
      return;
    }

    if (password.length < 8) {
      setCommunityAuthMessage("Use a password with at least 8 characters.", true);
      return;
    }

    setCommunityAuthMessage("Creating your community account...");

    const { data, error } = await state.communityClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    });

    if (error) {
      setCommunityAuthMessage(error.message, true);
      return;
    }

    if (!data.session) {
      setCommunityAuthMessage(
        "Account created. Check your email to confirm your account, then return here and sign in.",
      );
      return;
    }

    await ensureCommunityProfile(data.user, displayName);
    setCommunityAuthMessage("Community account created.");
  }

  async function communityForgotPassword() {
  if (!state.communityClient) return;

  const email =
    document.getElementById("communityEmail")?.value.trim() || "";

  if (!email) {
    setCommunityAuthMessage(
      "Enter your email address first, then click Forgot Password.",
      true,
    );
    return;
  }

  setCommunityAuthMessage("Sending your password reset email...");

  const { error } =
    await state.communityClient.auth.resetPasswordForEmail(email, {
      redirectTo:
        "https://workshop-poratl.netlify.app/portal.html?reset=1",
    });

  if (error) {
    setCommunityAuthMessage(error.message, true);
    return;
  }

  setCommunityAuthMessage(
    "Password reset email sent. Check your inbox and spam folder.",
  );
}

  async function communitySignIn() {
    if (!state.communityClient) return;

    

    const email = document.getElementById("communityEmail")?.value.trim() || "";
    const password =
      document.getElementById("communityPassword")?.value || "";

    if (!email || !password) {
      setCommunityAuthMessage("Enter your email and password.", true);
      return;
    }

    setCommunityAuthMessage("Signing you in...");

    const { data, error } =
      await state.communityClient.auth.signInWithPassword({
        email,
        password,
      });

    if (error) {
      setCommunityAuthMessage(error.message, true);
      return;
    }

    const displayName =
      document.getElementById("communityDisplayName")?.value.trim() ||
      data.user?.user_metadata?.display_name ||
      email.split("@")[0];

    await ensureCommunityProfile(data.user, displayName);
    setCommunityAuthMessage("Signed in.");
  }

  function showPasswordResetPanel() {
  const existing = document.getElementById("passwordResetPanel");
  if (existing) {
    existing.hidden = false;
    return;
  }

  const panel = document.createElement("div");
  panel.id = "passwordResetPanel";
  panel.style.position = "fixed";
  panel.style.inset = "0";
  panel.style.zIndex = "9999";
  panel.style.display = "grid";
  panel.style.placeItems = "center";
  panel.style.padding = "20px";
  panel.style.background = "rgba(2, 7, 17, 0.92)";
  panel.style.backdropFilter = "blur(18px)";

  panel.innerHTML = `
    <div class="lesson-block" style="width:min(520px,100%);margin:0;">
      <span class="lesson-tag">SECURE ACCOUNT RESET</span>
      <h2>Create Your New Password</h2>
      <p>Enter a new password below. Use at least 8 characters.</p>

      <label for="newCommunityPassword">New Password</label>
      <input
        id="newCommunityPassword"
        type="password"
        minlength="8"
        autocomplete="new-password"
        placeholder="Enter your new password"
      />

      <label for="confirmCommunityPassword">Confirm New Password</label>
      <input
        id="confirmCommunityPassword"
        type="password"
        minlength="8"
        autocomplete="new-password"
        placeholder="Enter it again"
      />

      <div class="builder-buttons" style="margin-top:18px;">
        <button
          class="primary-btn"
          id="saveNewCommunityPasswordBtn"
          type="button"
        >
          Save New Password
        </button>
      </div>

      <p id="passwordResetMessage" aria-live="polite"></p>
    </div>
  `;

  document.body.appendChild(panel);

  document
    .getElementById("saveNewCommunityPasswordBtn")
    ?.addEventListener("click", saveNewCommunityPassword);
}

async function saveNewCommunityPassword() {
  if (!state.communityClient) return;

  const password =
    document.getElementById("newCommunityPassword")?.value || "";
  const confirmPassword =
    document.getElementById("confirmCommunityPassword")?.value || "";
  const message = document.getElementById("passwordResetMessage");

  if (password.length < 8) {
    if (message) message.textContent = "Use at least 8 characters.";
    return;
  }

  if (password !== confirmPassword) {
    if (message) message.textContent = "The passwords do not match.";
    return;
  }

  if (message) message.textContent = "Saving your new password...";

  const { error } = await state.communityClient.auth.updateUser({
    password,
  });

  if (error) {
    if (message) message.textContent = error.message;
    return;
  }

  if (message) {
    message.textContent =
      "Password updated successfully. You can now sign in with your new password.";
  }

  window.setTimeout(() => {
    document.getElementById("passwordResetPanel")?.remove();
    window.history.replaceState({}, "", "portal.html?page=community");
  }, 1800);
}

  async function communitySignOut() {
    if (!state.communityClient) return;
    await state.communityClient.auth.signOut();
    setCommunityAuthMessage("Signed out.");
  }

  async function applyCommunitySession(session) {
    state.communityUser = session?.user || null;
    state.communityProfile = null;
    state.communityIsAdmin = false;

    const fields = document.getElementById("communityAuthFields");
    const signedInBar = document.getElementById("communitySignedInBar");
    const app = document.getElementById("communityApp");
    const name = document.getElementById("communitySignedInName");
    const notice = document.getElementById("communityAccessNotice");

    if (!state.communityUser) {
      const backRoomNav = document.getElementById("backRoomNav");

if (backRoomNav) {
  backRoomNav.hidden = true;
}
      if (fields) fields.hidden = false;
      if (signedInBar) signedInBar.hidden = true;
      if (app) app.hidden = true;
      if (notice) {
        notice.textContent = hasWorkshopCommunityAccess()
          ? "Create your community account or sign in below."
          : "Unlock at least one workshop first, then create your community account or sign in below.";
      }
      stopCommunityRealtime();
      return;
    }
await loadCommunityAdminStatus();
  if (!hasWorkshopCommunityAccess() && !state.communityIsAdmin) {
      await state.communityClient.auth.signOut();
      setCommunityAuthMessage(
        "Your community account is valid, but this browser has not unlocked a workshop yet.",
        true,
      );
      return;
    }

    await ensureCommunityProfile(
      state.communityUser,
      state.communityUser.user_metadata?.display_name,
    );
    await loadCurrentCommunityProfile();
  const backRoomStatus = document.getElementById("backRoomAdminStatus");

if (backRoomStatus) {
  backRoomStatus.textContent = state.communityIsAdmin
    ? "Instructor access confirmed. Your Back Room controls are active."
    : "Instructor access is not available for this account.";
}

const backRoomNav = document.getElementById("backRoomNav");

if (backRoomNav) {
  backRoomNav.hidden = !state.communityIsAdmin;
}
    if (fields) fields.hidden = true;
    if (signedInBar) signedInBar.hidden = false;
    if (app) app.hidden = false;
    if (name) {
      name.textContent =
        state.communityProfile?.display_name ||
        state.communityUser.email ||
        "Workshop Member";
    }
    if (notice) notice.textContent = "Your workshop community account is connected.";

    const categorySelect = document.getElementById("communityPostCategory");
    const updatesOption = categorySelect?.querySelector('option[value="updates"]');
    if (updatesOption) updatesOption.disabled = !state.communityIsAdmin;
    if (categorySelect?.value === "updates" && !state.communityIsAdmin) {
      categorySelect.value = "questions";
    }

    await loadCommunityFeed();
    startCommunityRealtime();
  }

  async function ensureCommunityProfile(user, preferredName = "") {
    if (!state.communityClient || !user) return;

    const displayName =
      String(preferredName || "").trim() ||
      user.user_metadata?.display_name ||
      user.email?.split("@")[0] ||
      "Workshop Member";

    const { error } = await state.communityClient
      .from("community_profiles")
      .upsert(
        {
          user_id: user.id,
          display_name: displayName.slice(0, 60),
        },
        { onConflict: "user_id" },
      );

    if (error) console.warn("Community profile could not be saved.", error);
  }

  async function loadCurrentCommunityProfile() {
    if (!state.communityClient || !state.communityUser) return;

    const { data, error } = await state.communityClient
      .from("community_profiles")
      .select("user_id, display_name, avatar_url")
      .eq("user_id", state.communityUser.id)
      .maybeSingle();

    if (error) {
      console.warn("Community profile could not be loaded.", error);
      return;
    }

    state.communityProfile = data || null;
  }

  async function loadCommunityAdminStatus() {
    if (!state.communityClient || !state.communityUser) return;

    const { data, error } =
      await state.communityClient.rpc("is_community_admin");

    if (error) {
      console.warn("Community admin status could not be checked.", error);
      state.communityIsAdmin = false;
      return;
    }

    state.communityIsAdmin = Boolean(data);
  }

  async function loadPortalAnnouncement() {
  if (!state.communityClient) return;

  const { data, error } = await state.communityClient
    .from("portal_settings")
    .select("value")
    .eq("key", "announcement")
    .maybeSingle();

  if (error) {
    console.warn("Portal announcement could not be loaded.", error);
    return;
  }

  const announcement = data?.value;
  const titleInput = document.getElementById("backRoomAnnouncementTitle");
const bodyInput = document.getElementById("backRoomAnnouncementBody");

if (titleInput) {
  titleInput.value = announcement?.title || "";
}

if (bodyInput) {
  bodyInput.value = announcement?.body || "";
}

  if (!announcement?.active) return;

  const page = document.getElementById("announcements");
  const block = page?.querySelector(".lesson-block");

  if (!block) return;

  const title = block.querySelector("h2");
  const body = block.querySelector("p");

  if (title && announcement.title) {
    title.textContent = announcement.title;
  }

  if (body && announcement.body) {
    body.textContent = announcement.body;
  }
}

async function loadPortalReplays() {
  if (!state.communityClient) return;

  const { data, error } = await state.communityClient
    .from("portal_settings")
    .select("value")
    .eq("key", "replays")
    .maybeSingle();

  if (error) {
    console.warn("Replay links could not be loaded.", error);
    return;
  }

  const replays = data?.value;

  if (!replays) return;

  if (replays.day1) {
    REPLAY_LINKS.day1 = replays.day1;
  }

  if (replays.day2) {
    REPLAY_LINKS.day2 = replays.day2;
  }

  const day1Input = document.getElementById("backRoomReplayDay1");
  const day2Input = document.getElementById("backRoomReplayDay2");

  if (day1Input) day1Input.value = replays.day1 || "";
  if (day2Input) day2Input.value = replays.day2 || "";
}

async function loadPortalWorkshops() {
  if (!state.communityClient) return;

  const defaults = {
    prompt: true,
    website: true,
    beacon: false,
    chatgpt: false,
    payhip: false,
  };

  const { data, error } = await state.communityClient
    .from("portal_settings")
    .select("value")
    .eq("key", "workshops")
    .maybeSingle();

  if (error) {
    console.warn("Workshop settings could not be loaded.", error);
  }

  const workshops = {
    ...defaults,
    ...(data?.value || {}),
  };

  state.portalWorkshops = workshops;

  const fields = {
    prompt: "backRoomPromptWorkshopEnabled",
    website: "backRoomWebsiteWorkshopEnabled",
    beacon: "backRoomBeaconWorkshopEnabled",
    chatgpt: "backRoomChatGPTWorkshopEnabled",
    payhip: "backRoomPayhipWorkshopEnabled",
  };

  Object.entries(fields).forEach(([key, id]) => {
    const checkbox = document.getElementById(id);

    if (checkbox) {
      checkbox.checked = Boolean(workshops[key]);
    }
  });
}

async function loadPortalResource() {
  if (!state.communityClient) return;

  const { data, error } = await state.communityClient
    .from("portal_settings")
    .select("value")
    .eq("key", "featured_resource")
    .maybeSingle();

  if (error) {
    console.warn("Featured resource could not be loaded.", error);
    return;
  }

  const resource = data?.value;

  const titleInput = document.getElementById("backRoomResourceTitle");
  const urlInput = document.getElementById("backRoomResourceUrl");

  if (titleInput) {
    titleInput.value = resource?.title || "";
  }

  if (urlInput) {
    urlInput.value = resource?.url || "";
  }

  const page = document.getElementById("tools-resources");

  if (!page) return;

  let resourceBlock = document.getElementById("featuredPortalResource");

  if (!resource?.active || !resource.title || !resource.url) {
    resourceBlock?.remove();
    return;
  }

  if (!resourceBlock) {
    resourceBlock = document.createElement("article");
    resourceBlock.id = "featuredPortalResource";
    resourceBlock.className = "lesson-block";

    const pageHeader = page.querySelector(".page-header");

    if (pageHeader) {
      pageHeader.insertAdjacentElement("afterend", resourceBlock);
    } else {
      page.prepend(resourceBlock);
    }
  }

  resourceBlock.innerHTML = "";

  const tag = document.createElement("span");
  tag.className = "lesson-tag";
  tag.textContent = "FEATURED RESOURCE";

  const heading = document.createElement("h2");
  heading.textContent = resource.title;

  const description = document.createElement("p");
  description.textContent =
    "A featured workshop resource selected by your instructor.";

  const link = document.createElement("a");
  link.className = "primary-btn";
  link.href = resource.url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = "Open Resource";

  resourceBlock.append(tag, heading, description, link);
}

async function saveBackRoomResource() {
  if (!state.communityClient || !state.communityUser) return;

  const message = document.getElementById("backRoomMessage");

  if (!state.communityIsAdmin) {
    if (message) message.textContent = "Instructor access is required.";
    return;
  }

  const title =
    document.getElementById("backRoomResourceTitle")?.value.trim() || "";

  const url =
    document.getElementById("backRoomResourceUrl")?.value.trim() || "";

  if (!title || !url) {
    if (message) {
      message.textContent = "Add both a resource name and link before saving.";
    }
    return;
  }

  try {
    new URL(url);
  } catch {
    if (message) {
      message.textContent = "Please enter a valid resource link.";
    }
    return;
  }

  if (message) {
    message.textContent = "Saving resource...";
  }

  const { error } = await state.communityClient
    .from("portal_settings")
    .upsert(
      {
        key: "featured_resource",
        value: {
          title,
          url,
          active: true,
        },
        updated_by: state.communityUser.id,
      },
      {
        onConflict: "key",
      },
    );

  if (error) {
    console.warn("Resource could not be saved.", error);

    if (message) {
      message.textContent =
        error.message || "Resource could not be saved.";
    }

    return;
  }

  if (message) {
    message.textContent = "Resource saved for your students.";
  }

  await loadPortalResource();

  showToast("Resource saved.");
}




async function saveBackRoomWorkshops() {
  if (!state.communityClient || !state.communityUser) return;

  const message = document.getElementById("backRoomMessage");

  if (!state.communityIsAdmin) {
    if (message) message.textContent = "Instructor access is required.";
    return;
  }

  const workshops = {
    prompt: Boolean(
      document.getElementById("backRoomPromptWorkshopEnabled")?.checked,
    ),
    website: Boolean(
      document.getElementById("backRoomWebsiteWorkshopEnabled")?.checked,
    ),
    beacon: Boolean(
      document.getElementById("backRoomBeaconWorkshopEnabled")?.checked,
    ),
    chatgpt: Boolean(
      document.getElementById("backRoomChatGPTWorkshopEnabled")?.checked,
    ),
    payhip: Boolean(
      document.getElementById("backRoomPayhipWorkshopEnabled")?.checked,
    ),
  };

  if (message) {
    message.textContent = "Saving workshop settings...";
  }

  const { error } = await state.communityClient
    .from("portal_settings")
    .upsert(
      {
        key: "workshops",
        value: workshops,
        updated_by: state.communityUser.id,
      },
      {
        onConflict: "key",
      },
    );

  if (error) {
    console.warn("Workshop settings could not be saved.", error);

    if (message) {
      message.textContent =
        error.message || "Workshop settings could not be saved.";
    }

    return;
  }
state.portalWorkshops = workshops;


  if (message) {
    message.textContent = "Workshop settings saved for your students.";
  }

  showToast("Workshop access updated.");
}



async function saveBackRoomReplays() {
  if (!state.communityClient || !state.communityUser) return;

  const message = document.getElementById("backRoomMessage");

  if (!state.communityIsAdmin) {
    if (message) message.textContent = "Instructor access is required.";
    return;
  }

  const day1 =
    document.getElementById("backRoomReplayDay1")?.value.trim() || "";

  const day2 =
    document.getElementById("backRoomReplayDay2")?.value.trim() || "";

  if (!day1 && !day2) {
    if (message) {
      message.textContent = "Add at least one replay link before saving.";
    }
    return;
  }

  if (message) message.textContent = "Saving replay links...";

  const { error } = await state.communityClient
    .from("portal_settings")
    .upsert(
      {
        key: "replays",
        value: {
          day1,
          day2,
        },
        updated_by: state.communityUser.id,
      },
      {
        onConflict: "key",
      },
    );

  if (error) {
    console.warn("Replay links could not be saved.", error);

    if (message) {
      message.textContent = error.message || "Replay links could not be saved.";
    }

    return;
  }

  REPLAY_LINKS.day1 = day1;
  REPLAY_LINKS.day2 = day2;

  if (message) {
    message.textContent = "Replay links saved for your students.";
  }

  showToast("Replay links saved.");
}

  async function saveBackRoomAnnouncement() {
  if (!state.communityClient || !state.communityUser) return;

  const message = document.getElementById("backRoomMessage");

  if (!state.communityIsAdmin) {
    if (message) {
      message.textContent = "Instructor access is required.";
    }
    return;
  }

  const title =
    document.getElementById("backRoomAnnouncementTitle")?.value.trim() || "";

  const body =
    document.getElementById("backRoomAnnouncementBody")?.value.trim() || "";

  if (!title || !body) {
    if (message) {
      message.textContent =
        "Add both an announcement title and message before saving.";
    }
    return;
  }

  if (message) {
    message.textContent = "Saving announcement...";
  }

  const { error } = await state.communityClient
    .from("portal_settings")
    .upsert(
      {
        key: "announcement",
        value: {
          title,
          body,
          active: true,
        },
        updated_by: state.communityUser.id,
      },
      {
        onConflict: "key",
      },
    );

  if (error) {
    console.warn("Announcement could not be saved.", error);

    if (message) {
      message.textContent = error.message || "Announcement could not be saved.";
    }

    return;
  }

  if (message) {
    message.textContent = "Announcement saved for your students.";
  }

  await loadPortalAnnouncement();

  showToast("Announcement saved.");
}

  function setCommunityAuthMessage(message, isError = false) {
    const element = document.getElementById("communityAuthMessage");
    if (!element) return;
    element.textContent = message || "";
    element.classList.toggle("error", Boolean(isError));
  }

  function setCommunityPostMessage(message, isError = false) {
    const element = document.getElementById("communityPostMessage");
    if (!element) return;
    element.textContent = message || "";
    element.classList.toggle("error", Boolean(isError));
  }

  async function createCommunityPost() {
    if (!state.communityClient || !state.communityUser) {
      setCommunityPostMessage("Sign in before posting.", true);
      return;
    }

    const category =
      document.getElementById("communityPostCategory")?.value || "questions";
    const body =
      document.getElementById("communityPostBody")?.value.trim() || "";
    const imageInput = document.getElementById("communityPostImage");
    const imageFile = imageInput?.files?.[0] || null;

    if (!body) {
      setCommunityPostMessage("Write something before posting.", true);
      return;
    }

    if (category === "updates" && !state.communityIsAdmin) {
      setCommunityPostMessage(
        "Instructor Updates can only be posted by the instructor.",
        true,
      );
      return;
    }

    if (imageFile && imageFile.size > MAX_COMMUNITY_IMAGE_SIZE) {
      setCommunityPostMessage("Use an image smaller than 5 MB.", true);
      return;
    }

    const button = document.getElementById("communityPostBtn");
    if (button) {
      button.disabled = true;
      button.textContent = "Posting...";
    }
    setCommunityPostMessage("Posting to the community...");

    let imagePath = null;

    try {
      if (imageFile) {
        imagePath = await uploadCommunityImage(imageFile);
      }

      const { error } = await state.communityClient
        .from("community_posts")
        .insert({
          author_id: state.communityUser.id,
          category,
          body,
          image_path: imagePath,
        });

      if (error) throw error;

      clearCommunityPostForm();
      setCommunityPostMessage("Your post is live.");
      await loadCommunityFeed();
    } catch (error) {
      console.warn("Community post could not be created.", error);
      setCommunityPostMessage(
        error?.message || "Your post could not be created.",
        true,
      );
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = "Post to Community";
      }
    }
  }

  async function uploadCommunityImage(file) {
    if (!state.communityClient || !state.communityUser) return null;

    const extension =
      file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ||
      "jpg";
    const path = `${state.communityUser.id}/${Date.now()}-${createId("img")}.${extension}`;

    const { error } = await state.communityClient.storage
      .from(COMMUNITY_IMAGE_BUCKET)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) throw error;
    return path;
  }

  function clearCommunityPostForm() {
    const body = document.getElementById("communityPostBody");
    const image = document.getElementById("communityPostImage");
    if (body) body.value = "";
    if (image) image.value = "";
    setCommunityPostMessage("");
  }

  async function loadCommunityFeed() {
    const feed = document.getElementById("communityFeed");
    if (!feed || !state.communityClient || !state.communityUser) return;

    feed.innerHTML = "<p>Loading community posts...</p>";

    let query = state.communityClient
      .from("community_posts")
      .select(
        "id, author_id, category, body, image_path, is_pinned, created_at, updated_at",
      )
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(100);

    const filter = document.getElementById("communityFeedFilter")?.value || "all";
    if (filter !== "all") query = query.eq("category", filter);

    const { data: posts, error } = await query;

    if (error) {
      console.warn("Community feed could not be loaded.", error);
      feed.innerHTML = `<p>Community posts could not be loaded. Please try again.</p>`;
      return;
    }

    if (!posts?.length) {
      feed.innerHTML =
        "<p>No posts here yet. Be the first person to start the conversation.</p>";
      return;
    }

    const postIds = posts.map((post) => post.id);
    const authorIds = [...new Set(posts.map((post) => post.author_id))];

    const [
      { data: profiles },
      { data: comments },
      { data: reactions },
    ] = await Promise.all([
      state.communityClient
        .from("community_profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", authorIds),
      state.communityClient
        .from("community_comments")
        .select("id, post_id, author_id, body, created_at")
        .in("post_id", postIds)
        .order("created_at", { ascending: true }),
      state.communityClient
        .from("community_reactions")
        .select("post_id, user_id, reaction")
        .in("post_id", postIds),
    ]);

    const commentAuthors = [
      ...new Set((comments || []).map((comment) => comment.author_id)),
    ];
    let allProfiles = profiles || [];

    const missingProfileIds = commentAuthors.filter(
      (id) => !allProfiles.some((profile) => profile.user_id === id),
    );

    if (missingProfileIds.length) {
      const { data: extraProfiles } = await state.communityClient
        .from("community_profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", missingProfileIds);
      allProfiles = [...allProfiles, ...(extraProfiles || [])];
    }

    const profileMap = new Map(
      allProfiles.map((profile) => [profile.user_id, profile]),
    );

    feed.innerHTML = "";

    for (const post of posts) {
      const postComments = (comments || []).filter(
        (comment) => comment.post_id === post.id,
      );
      const postReactions = (reactions || []).filter(
        (reaction) => reaction.post_id === post.id,
      );
      const signedImageUrl = post.image_path
        ? await getCommunityImageUrl(post.image_path)
        : null;

      feed.appendChild(
        buildCommunityPostCard({
          post,
          profile: profileMap.get(post.author_id),
          comments: postComments,
          reactions: postReactions,
          profileMap,
          signedImageUrl,
        }),
      );
    }

    refreshIcons();
  }

  function buildCommunityPostCard({
    post,
    profile,
    comments,
    reactions,
    profileMap,
    signedImageUrl,
  }) {
    const article = document.createElement("article");
    article.className = "lesson-block community-post-card";
    article.dataset.postId = post.id;

    const liked = reactions.some(
      (reaction) => reaction.user_id === state.communityUser?.id,
    );
    const canDelete =
      post.author_id === state.communityUser?.id || state.communityIsAdmin;

    const categoryLabels = {
      questions: "Question",
      wins: "Win",
      feedback: "Feedback",
      updates: "Instructor Update",
    };

    const commentsHtml = comments
      .map((comment) => {
        const commenter = profileMap.get(comment.author_id);
        const canDeleteComment =
          comment.author_id === state.communityUser?.id || state.communityIsAdmin;

        return `
          <div class="community-comment" data-comment-id="${comment.id}">
            <p>
              <strong>${escapeHtml(commenter?.display_name || "Workshop Member")}</strong>
              <span> · ${escapeHtml(formatDate(comment.created_at))}</span>
            </p>
            <p>${escapeHtml(comment.body).replaceAll("\n", "<br>")}</p>
            ${
              canDeleteComment
                ? '<button type="button" class="danger-btn community-delete-comment-btn">Delete Reply</button>'
                : ""
            }
          </div>`;
      })
      .join("");

    article.innerHTML = `
      <div class="saved-prompt-heading">
        <div>
          <span class="lesson-tag">${escapeHtml(categoryLabels[post.category] || post.category)}</span>
          ${post.is_pinned ? '<span class="status-pill">📌 Pinned</span>' : ""}
          <h3>${escapeHtml(profile?.display_name || "Workshop Member")}</h3>
          <p>${escapeHtml(formatDate(post.created_at))}</p>
        </div>
      </div>

      <p>${escapeHtml(post.body).replaceAll("\n", "<br>")}</p>

      ${
        signedImageUrl
          ? `<div class="reference-image-frame"><img src="${escapeHtml(signedImageUrl)}" alt="Community post image"></div>`
          : ""
      }

      <div class="builder-buttons community-post-actions">
        <button
          type="button"
          class="secondary-btn community-like-post-btn"
          aria-pressed="${liked}"
        >
          ${liked ? "♥ Liked" : "♡ Like"} (${reactions.length})
        </button>

        <button type="button" class="secondary-btn community-reply-toggle-btn">
          Reply (${comments.length})
        </button>

        ${
          state.communityIsAdmin
            ? `<button type="button" class="secondary-btn community-pin-post-btn">${post.is_pinned ? "Unpin" : "Pin"}</button>`
            : ""
        }

        ${
          canDelete
            ? '<button type="button" class="danger-btn community-delete-post-btn">Delete</button>'
            : ""
        }
      </div>

      <div class="community-reply-area" hidden>
        <label>Write a Reply</label>
        <textarea
          class="community-reply-input"
          rows="3"
          maxlength="3000"
          placeholder="Write your reply..."
        ></textarea>
        <button type="button" class="primary-btn community-submit-reply-btn">
          Post Reply
        </button>
      </div>

      <div class="community-comments">
        ${commentsHtml || "<p>No replies yet.</p>"}
      </div>
    `;

    article
      .querySelector(".community-like-post-btn")
      ?.addEventListener("click", () => toggleCommunityLike(post.id, liked));

    article
      .querySelector(".community-reply-toggle-btn")
      ?.addEventListener("click", () => {
        const area = article.querySelector(".community-reply-area");
        if (!area) return;
        area.hidden = !area.hidden;
        if (!area.hidden) article.querySelector(".community-reply-input")?.focus();
      });

    article
      .querySelector(".community-submit-reply-btn")
      ?.addEventListener("click", () => submitCommunityReply(article, post.id));

    article
      .querySelector(".community-delete-post-btn")
      ?.addEventListener("click", () => deleteCommunityPost(post.id, post.image_path));

    article
      .querySelector(".community-pin-post-btn")
      ?.addEventListener("click", () =>
        setCommunityPostPinned(post.id, !post.is_pinned),
      );

    article
      .querySelectorAll(".community-comment")
      .forEach((commentElement) => {
        commentElement
          .querySelector(".community-delete-comment-btn")
          ?.addEventListener("click", () =>
            deleteCommunityComment(commentElement.dataset.commentId),
          );
      });

    return article;
  }

  async function getCommunityImageUrl(path) {
    if (!state.communityClient || !path) return null;

    const { data, error } = await state.communityClient.storage
      .from(COMMUNITY_IMAGE_BUCKET)
      .createSignedUrl(path, 3600);

    if (error) {
      console.warn("Community image URL could not be created.", error);
      return null;
    }

    return data?.signedUrl || null;
  }

  async function toggleCommunityLike(postId, currentlyLiked) {
    if (!state.communityClient || !state.communityUser) return;

    let error;

    if (currentlyLiked) {
      ({ error } = await state.communityClient
        .from("community_reactions")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", state.communityUser.id));
    } else {
      ({ error } = await state.communityClient
        .from("community_reactions")
        .insert({
          post_id: postId,
          user_id: state.communityUser.id,
          reaction: "like",
        }));
    }

    if (error) {
      showToast("That reaction could not be saved.", true);
      return;
    }

    await loadCommunityFeed();
  }

  async function submitCommunityReply(article, postId) {
    if (!state.communityClient || !state.communityUser) return;

    const input = article.querySelector(".community-reply-input");
    const body = input?.value.trim() || "";

    if (!body) {
      showToast("Write your reply first.", true);
      return;
    }

    const { error } = await state.communityClient
      .from("community_comments")
      .insert({
        post_id: postId,
        author_id: state.communityUser.id,
        body,
      });

    if (error) {
      showToast(error.message || "Reply could not be posted.", true);
      return;
    }

    if (input) input.value = "";
    await loadCommunityFeed();
  }

  async function deleteCommunityComment(commentId) {
    if (!state.communityClient || !commentId) return;
    if (!window.confirm("Delete this reply?")) return;

    const { error } = await state.communityClient
      .from("community_comments")
      .delete()
      .eq("id", commentId);

    if (error) {
      showToast("Reply could not be deleted.", true);
      return;
    }

    await loadCommunityFeed();
  }

  async function deleteCommunityPost(postId, imagePath = null) {
    if (!state.communityClient || !postId) return;
    if (!window.confirm("Delete this community post?")) return;

    const { error } = await state.communityClient
      .from("community_posts")
      .delete()
      .eq("id", postId);

    if (error) {
      showToast("Post could not be deleted.", true);
      return;
    }

    if (imagePath) {
      await state.communityClient.storage
        .from(COMMUNITY_IMAGE_BUCKET)
        .remove([imagePath]);
    }

    await loadCommunityFeed();
  }

  async function setCommunityPostPinned(postId, shouldPin) {
    if (!state.communityClient || !state.communityIsAdmin) return;

    const { error } = await state.communityClient
      .from("community_posts")
      .update({ is_pinned: Boolean(shouldPin) })
      .eq("id", postId);

    if (error) {
      showToast("Pinned status could not be changed.", true);
      return;
    }

    await loadCommunityFeed();
  }

  function startCommunityRealtime() {
    if (!state.communityClient || !state.communityUser) return;
    stopCommunityRealtime();

    state.communityChannel = state.communityClient
      .channel("workshop-community-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "community_posts" },
        scheduleCommunityRefresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "community_comments" },
        scheduleCommunityRefresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "community_reactions" },
        scheduleCommunityRefresh,
      )
      .subscribe();
  }

  function stopCommunityRealtime() {
    if (state.communityClient && state.communityChannel) {
      state.communityClient.removeChannel(state.communityChannel);
    }
    state.communityChannel = null;
    clearTimeout(state.communityRefreshTimer);
  }

  function scheduleCommunityRefresh() {
    clearTimeout(state.communityRefreshTimer);
    state.communityRefreshTimer = window.setTimeout(() => {
      if (state.communityUser) loadCommunityFeed();
    }, 250);
  }

  function bindSettings() {
    const page = document.getElementById("settings");
    const boxes = [...(page?.querySelectorAll("input[type='checkbox']") || [])];
    const saved = readStorage(STORAGE.settings, {});

    boxes.forEach((box, index) => {
      const label = box.closest("li")?.textContent.trim() || `setting-${index}`;
      const key = slugify(label);
      box.dataset.setting = key;
      if (Object.prototype.hasOwnProperty.call(saved, key))
        box.checked = Boolean(saved[key]);

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
    document
      .querySelectorAll("#book-session a[target='_blank']")
      .forEach((link) => {
        link.addEventListener("click", (event) => {
          const approved = window.confirm(
            "This will open the booking page in a new tab. Continue?",
          );
          if (!approved) event.preventDefault();
        });
      });

    document.querySelectorAll("a[target='_blank']").forEach((link) => {
      link.rel = "noopener noreferrer";
    });
  }

  function bindReset() {
    document.getElementById("resetDataBtn")?.addEventListener("click", () => {
      const approved = window.confirm(
        "Reset all saved notes, prompts, checklists, progress, preferences, and uploaded reference images on this device?",
      );
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
        if (
          dom.completionPopup &&
          !dom.completionPopup.classList.contains("hidden")
        )
          closeAchievementPopup();
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        dom.globalSearch?.focus();
      }
    });
  }

  function createId(prefix) {
    if (window.crypto?.randomUUID)
      return `${prefix}-${window.crypto.randomUUID()}`;
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function formatDate(value) {
    const date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) return "just now";
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year:
        date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
      hour: "numeric",
      minute: "2-digit",
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
    return (
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
    );
  }
})();
