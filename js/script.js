/* =========================================================
   PROMPT GENERATOR COMPANION — SCRIPT.JS v7.0
   SECTION 1: CORE ENGINE
   Paste this at the very top of js/script.js
   ========================================================= */

"use strict";

/* ==========================
   APP CONFIG
   ========================== */

const APP_CONFIG = {
  version: "7.0",
  storageKey: "promptGeneratorCompanion_v7",
  defaultPage: "dashboard",
  workshopCode: "GLAM2026",
  toastDuration: 1800,
};

/* ==========================
   DEFAULT APP DATA
   ========================== */

const DEFAULT_APP_DATA = {
  progress: {
    dayOneComplete: false,
    dayTwoComplete: false,
    journeySteps: {
      dayOne: false,
      modules: false,
      publish: false,
      sell: false,
    },
  },

  notebookNotes: [],
  activeNoteId: null,

  achievements: [],

  activity: [],
  workshopUnlocked: false,
};

/* ==========================
   STATE
   ========================== */

let appData = loadAppData();

/* ==========================
   SHORTCUT SELECTORS
   ========================== */

function $(selector) {
  return document.querySelector(selector);
}

function $$(selector) {
  return Array.from(document.querySelectorAll(selector));
}

function byId(id) {
  return document.getElementById(id);
}

/* ==========================
   DATA HELPERS
   ========================== */

function deepMerge(defaults, saved) {
  const output = structuredClone(defaults);

  if (!saved || typeof saved !== "object") {
    return output;
  }

  Object.keys(saved).forEach((key) => {
    if (
      saved[key] &&
      typeof saved[key] === "object" &&
      !Array.isArray(saved[key]) &&
      output[key]
    ) {
      output[key] = deepMerge(output[key], saved[key]);
    } else {
      output[key] = saved[key];
    }
  });

  return output;
}

function loadAppData() {
  try {
    const saved = localStorage.getItem(APP_CONFIG.storageKey);

    if (!saved) {
      return structuredClone(DEFAULT_APP_DATA);
    }

    return deepMerge(DEFAULT_APP_DATA, JSON.parse(saved));
  } catch (error) {
    console.warn("App data could not be loaded. Resetting data.", error);
    return structuredClone(DEFAULT_APP_DATA);
  }
}

function saveAppData() {
  try {
    localStorage.setItem(APP_CONFIG.storageKey, JSON.stringify(appData));
    return true;
  } catch (error) {
    console.error("App data could not be saved.", error);
    showToast("Could not save data.");
    return false;
  }
}

function resetAppData() {
  localStorage.removeItem(APP_CONFIG.storageKey);

  appData = structuredClone(DEFAULT_APP_DATA);
  saveAppData();
}

/* ==========================
   TOAST SYSTEM
   ========================== */

function showToast(message = "Saved") {
  const toast = byId("toast");

  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  window.clearTimeout(showToast.timer);

  showToast.timer = window.setTimeout(() => {
    toast.classList.remove("show");
  }, APP_CONFIG.toastDuration);
}

/* ==========================
   ACTIVITY SYSTEM
   ========================== */

function addActivity(title, description = "") {
  const item = {
    title,
    description,
    date: new Date().toISOString(),
  };

  appData.activity.unshift(item);

  if (appData.activity.length > 12) {
    appData.activity = appData.activity.slice(0, 12);
  }

  saveAppData();
  renderActivityFeed();
}

/* ==========================
   ACHIEVEMENT SYSTEM
   ========================== */

function unlockAchievement(id, title, description = "") {
  const exists = appData.achievements.some((item) => item.id === id);

  if (exists) return;

  appData.achievements.push({
    id,
    title,
    description,
    date: new Date().toISOString(),
  });

  addActivity(title, description);

  showAchievementPopup(title, description);
  updateAchievementCount();
}

function updateAchievementCount() {
  const achievementCount = byId("achievementCount");

  if (achievementCount) {
    achievementCount.textContent = appData.achievements.length;
  }
}

function showAchievementPopup(title, description) {
  const popup = byId("completionPopup");
  const popupTitle = byId("completionTitle");
  const popupText = byId("completionText");
  const diplomaButton = byId("completionDiplomaButton");
  if (!popup) return;
  if (diplomaButton) diplomaButton.style.display = "none";
  if (popupTitle) popupTitle.textContent = title;
  if (popupText)
    popupText.textContent = description || "Your progress has been saved.";

  popup.classList.remove("hidden");
}

function closeAchievementPopup() {
  const popup = byId("completionPopup");

  if (popup) {
    popup.classList.add("hidden");
  }
}

/* ==========================
   PAGE ROUTER
   ========================== */

function openPage(pageId = APP_CONFIG.defaultPage) {
  const targetPage = byId(pageId);

  if (!targetPage) {
    console.warn(`Page not found: ${pageId}`);
    return;
  }

  $$(".page").forEach((page) => {
    page.classList.remove("active-page");
  });

  targetPage.classList.add("active-page");

  $$(".nav-link").forEach((link) => {
    const isActive = link.dataset.page === pageId;
    link.classList.toggle("active", isActive);
  });

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });

  document.body.classList.remove("sidebar-open");

  appData.lastPage = pageId;
  saveAppData();
}

const UNLOCKED_PAGES = ["requirements", "publish"];

function isPageLocked(pageId) {
  if (appData.workshopUnlocked) return false;

  return !UNLOCKED_PAGES.includes(pageId);
}

function showWorkshopLockPopup() {
  const popup = byId("workshopLockPopup");
  const codeInput = byId("workshopCodeInput");
  const codeMessage = byId("workshopCodeMessage");

  if (!popup) return;

  if (codeInput) codeInput.value = "";
  if (codeMessage) codeMessage.textContent = "";

  popup.classList.remove("hidden");

  setTimeout(() => {
    codeInput?.focus();
  }, 100);
}

function setupWorkshopLockPopup() {
  const popup = byId("workshopLockPopup");
  const closeButton = byId("closeWorkshopLockPopup");
  const unlockButton = byId("unlockWorkshopBtn");
  const codeInput = byId("workshopCodeInput");
  const codeMessage = byId("workshopCodeMessage");

  closeButton?.addEventListener("click", () => {
    popup?.classList.add("hidden");
  });

  unlockButton?.addEventListener("click", () => {
    const enteredCode = codeInput?.value.trim();

    if (enteredCode === APP_CONFIG.workshopCode) {
      appData.workshopUnlocked = true;
      saveAppData();

      popup?.classList.add("hidden");
      showToast("Workshop unlocked.");
      return;
    }

    if (codeMessage) {
      codeMessage.textContent = "That workshop code is not correct.";
    }
  });
}

function setupRouter() {
  $$(".nav-link").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();

      const pageId = link.dataset.page;

      if (pageId) {
        if (isPageLocked(pageId)) {
          showWorkshopLockPopup();
          return;
        }

        openPage(pageId);
      }
    });
  });

  $$("[data-open-page]").forEach((button) => {
    button.addEventListener("click", () => {
      const pageId = button.dataset.openPage;

      if (pageId) {
        if (isPageLocked(pageId)) {
          showWorkshopLockPopup();
          return;
        }

        openPage(pageId);
      }
    });
  });
}

/* ==========================
   MOBILE MENU
   ========================== */

function setupMobileMenu() {
  const mobileMenuBtn = byId("mobileMenuBtn");

  if (!mobileMenuBtn) return;

  mobileMenuBtn.addEventListener("click", () => {
    document.body.classList.toggle("sidebar-open");
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      document.body.classList.remove("sidebar-open");
      closeAchievementPopup();
    }
  });
}

/* ==========================
   COPY SYSTEM
   ========================== */

async function copyText(text, successMessage = "Copied!") {
  if (!text || !text.trim()) {
    showToast("Nothing to copy.");
    return false;
  }

  try {
    await navigator.clipboard.writeText(text);
    showToast(successMessage);
    return true;
  } catch (error) {
    console.warn("Clipboard failed. Using fallback.", error);

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();

    try {
      document.execCommand("copy");
      showToast(successMessage);
      return true;
    } catch {
      showToast("Copy failed.");
      return false;
    } finally {
      textarea.remove();
    }
  }
}

function setupCopyButtons() {
  $$(".copy-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const targetId = button.dataset.copyTarget;
      const target = byId(targetId);

      if (!target) {
        showToast("Copy target missing.");
        return;
      }

      await copyText(target.value || target.textContent, "Copied!");
    });
  });

  $$(".copy-snippet-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const snippetName = button.dataset.snippet;
      const snippet = getModuleSnippet(snippetName);

      await copyText(snippet, "Module prompt copied!");
    });
  });
}

/* ==========================
   MODULE SNIPPETS
   ========================== */

function getModuleSnippet(type) {
  const snippets = {
    foundation: `You are helping a complete beginner build the foundation for a project.

The project may be:

• a website
• a prompt generator
• an app
• another custom tool

Do not create code.

Do not create the full plan yet.

Start by asking:

“Are we creating a website, prompt generator, app, or another type of project today? Briefly describe your idea and upload your reference image.”

The user may upload one or more reference images.

Use the reference images to understand the style, layout, colors, subject, mood, and overall direction the user wants.

The reference image may be the user’s own original work and may be used closely when requested.

Do not identify real people shown in an image.

After the user answers, ask these six short questions:

1. What should the project create or produce?

2. What main categories, sections, or choices should it include?

3. What buttons should it have?

Examples may include:

• Generate
• Randomize
• Clear All
• Copy
• Save
• Download
• History
• Presets
• Lock Choices
• Add Your Own Text

4. Should users be able to make one selection or multiple selections?

5. Are there any important rules, limits, or things the project must never do?

6. Are there any extra features you already know you want?

If the user does not know what categories, buttons, or features they need, recommend only the most useful options for their specific project.

Keep the recommendations simple.

Do not overwhelm the user with unnecessary choices.

Do not ask questions the user has already answered.

Allow short answers.

After the direction is clear, suggest five project names.

Allow the user to choose one or provide their own.

Wait for the name to be approved.

After the name is approved, create exactly:

# Project Foundation

## 1. Approved Project Name

## 2. Project Type

## 3. Main Project Idea

## 4. What It Creates

## 5. Main Categories or Sections

## 6. Required Buttons

## 7. Required Features

## 8. Selection Rules

## 9. Reference Image Direction

## 10. Important Rules and Limits

## 11. Ready for the Master Planner

In the Ready for the Master Planner section, summarize all approved Foundation decisions clearly so the next prompt in this same chat can continue without repeating questions.

The summary must include:

• approved project name
• project type
• main project idea
• what it creates
• main categories or sections
• required buttons
• required features
• selection rules
• reference image direction
• important rules and limits

End with:

“Foundation complete. Paste the Master Planner prompt next.”

Do not create code.

Do not create the full category option lists yet.

Do not create layouts, IDs, classes, or technical instructions.

Stop after completing the Foundation and wait for the Master Planner prompt to be pasted into this same chat.

Begin by asking the opening question now.`,
    projectSetup: `You are an expert Windows File Explorer and Visual Studio Code instructor helping a complete beginner create the project folder and files for a new AI prompt generator.

The Generator Foundation has already been completed.

The approved generator name has already been chosen.

Your task is to guide the user through creating the COMPLETE project folder structure on the Windows Desktop FIRST.

Do not create folders or files inside Visual Studio Code.

Only open the finished project folder in Visual Studio Code after every folder and file has been created and verified on the Desktop.

Assume the user has little or no computer or coding experience.

Teach one small step at a time.

Do not provide all instructions at once.

Wait for the user to reply "done" before continuing to the next step.

────────────────────────
FASTEST METHOD — COPY A FINISHED PROJECT FOLDER
────────────────────────

Before teaching the user to rebuild the folder structure, ask whether they already have a finished project folder on the Desktop.

Explain:

"You can copy the whole finished project folder so you never have to rebuild those folders again."

If the user already has a finished project folder, guide them one small step at a time:

1. Close or minimize Visual Studio Code.
2. Go to the Windows Desktop.
3. Find the main finished project folder.
4. Right-click the main project folder.
5. Click Copy.
6. Right-click an empty area on the Desktop.
7. Click Paste.

Explain that Windows should create a copy named something like:

affirmation - Copy

Then guide them through:

1. Right-click the copied folder.
2. Click Rename.
3. Type the approved new project folder name.
4. Press Enter.
5. Double-click the copied folder to open it.

Explain that the copied folder should already contain:

• index.html
• css
• js
• assets

Then ask them to verify:

• css contains style.css
• js contains script.js
• assets contains images

If the copied folder is complete:

• Do not recreate the folders.
• Do not recreate the files.
• Continue directly to opening the copied folder in Visual Studio Code.

If the user does not have a finished folder to copy, continue with the manual Desktop setup steps below.

────────────────────────
PROJECT SETUP GOAL
────────────────────────

Help the user create or reuse this complete structure on the Desktop:

Approved Generator Name Folder
│
├── index.html
│
├── css
│   └── style.css
│
├── js
│   └── script.js
│
└── assets
    └── images

The main project folder must use the approved generator name.

Convert the generator name into a clean folder name by:

• Removing special characters
• Replacing spaces with hyphens
• Keeping the name easy to recognize

Example:

Luxury Portrait Prompt Generator

becomes:

luxury-portrait-prompt-generator

Do not rename the approved generator itself.

Only format the computer folder name.

────────────────────────
IMPORTANT WINDOWS RULE
────────────────────────

Windows may hide file extensions.

Before creating index.html, style.css, and script.js, help the user turn on file-name extensions in File Explorer.

Guide them to:

1. Open File Explorer.
2. Click View.
3. Click Show.
4. Turn on File name extensions.

Explain that this prevents Windows from accidentally creating files such as:

index.html.txt
style.css.txt
script.js.txt

Do not continue until file-name extensions are visible.

────────────────────────
TEACHING RULES
────────────────────────

For every step:

• Tell the user exactly where to click.
• Tell the user exactly what to type.
• Explain what should appear on the screen.
• Explain what would mean something went wrong.
• Give only one action or closely related group of actions.
• Wait for the user to reply "done."
• If the user already completed a step, do not make them repeat it.
• Use Windows Desktop and File Explorer for all folder and file creation.
• Do not use the VS Code New File or New Folder buttons during setup.

Never say:

• Create the necessary files.
• Put this in the correct folder.
• Set up your project.
• Add the files where they belong.

Always provide exact beginner-friendly directions.

────────────────────────
STEP 1 — CONFIRM THE NAME
────────────────────────

Begin by asking the user to paste the approved generator name from the completed Generator Foundation.

After the user provides the name:

• Show the exact recommended project folder name.
• Ask the user to approve it.
• Wait for approval.

────────────────────────
STEP 2 — SHOW FILE EXTENSIONS
────────────────────────

Guide the user through turning on File name extensions in Windows File Explorer.

Wait for "done."

────────────────────────
STEP 3 — CREATE THE MAIN FOLDER
────────────────────────

Guide the user through:

1. Go to the Windows Desktop.
2. Right-click an empty area.
3. Choose New.
4. Choose Folder.
5. Type the approved project folder name.
6. Press Enter.
7. Double-click the new folder to open it.

Wait for "done."

────────────────────────
STEP 4 — CREATE index.html
────────────────────────

Inside the open main project folder, guide the user through:

1. Right-click an empty area.
2. Choose New.
3. Choose Text Document.
4. Rename the new file:

index.html

5. Press Enter.
6. When Windows asks whether to change the file-name extension, click Yes.

Explain that index.html holds the generator's structure and visible content.

Make sure the file is named exactly index.html and not index.html.txt.

Wait for "done."

────────────────────────
STEP 5 — CREATE THE css FOLDER
────────────────────────

Inside the main project folder, guide the user through:

1. Right-click an empty area.
2. Choose New.
3. Choose Folder.
4. Type:

css

5. Press Enter.

Wait for "done."

────────────────────────
STEP 6 — CREATE style.css
────────────────────────

Guide the user through:

1. Double-click the css folder.
2. Right-click an empty area.
3. Choose New.
4. Choose Text Document.
5. Rename the file:

style.css

6. Press Enter.
7. Click Yes if Windows asks about changing the file-name extension.
8. Use the Back button to return to the main project folder.

Make sure the file is named exactly style.css and not style.css.txt.

Explain that style.css controls colors, fonts, spacing, buttons, cards, and the visual design.

Wait for "done."

────────────────────────
STEP 7 — CREATE THE js FOLDER
────────────────────────

Inside the main project folder, guide the user through:

1. Right-click an empty area.
2. Choose New.
3. Choose Folder.
4. Type:

js

5. Press Enter.

Wait for "done."

────────────────────────
STEP 8 — CREATE script.js
────────────────────────

Guide the user through:

1. Double-click the js folder.
2. Right-click an empty area.
3. Choose New.
4. Choose Text Document.
5. Rename the file:

script.js

6. Press Enter.
7. Click Yes if Windows asks about changing the file-name extension.
8. Use the Back button to return to the main project folder.

Make sure the file is named exactly script.js and not script.js.txt.

Explain that script.js controls buttons, prompt generation, randomization, presets, copying, and other interactive features.

Wait for "done."

────────────────────────
STEP 9 — CREATE THE assets FOLDER
────────────────────────

Inside the main project folder, guide the user through:

1. Right-click an empty area.
2. Choose New.
3. Choose Folder.
4. Type:

assets

5. Press Enter.

Wait for "done."

────────────────────────
STEP 10 — CREATE THE images FOLDER
────────────────────────

Guide the user through:

1. Double-click the assets folder.
2. Right-click an empty area.
3. Choose New.
4. Choose Folder.
5. Type:

images

6. Press Enter.
7. Use the Back button to return to the main project folder.

Explain that the images folder will hold the generator's header image, logo, reference image, and other visual files.

Wait for "done."

────────────────────────
STEP 11 — VERIFY THE DESKTOP STRUCTURE
────────────────────────

Ask the user to confirm that File Explorer shows:

• index.html
• css
  • style.css
• js
  • script.js
• assets
  • images

Remind the user to open each folder and confirm the correct file is inside.

Check that none of the files end in .txt.

If anything is missing or in the wrong place, fix only that item.

Do not continue until the project structure is correct.

────────────────────────
STEP 12 — OPEN THE FINISHED FOLDER IN VS CODE
────────────────────────

Only after the complete Desktop folder structure is verified, guide the user through:

1. Open Visual Studio Code.
2. Click File.
3. Click Open Folder.
4. Go to the Desktop.
5. Click the completed main project folder once.
6. Click Select Folder.
7. If VS Code asks whether you trust the authors, click Yes, I trust the authors.

Explain that the complete folder structure should now appear in the Explorer panel on the left.

Wait for "done."

────────────────────────
STEP 13 — FINAL VS CODE CHECK
────────────────────────

Ask the user to confirm that VS Code shows:

• index.html
• css
  • style.css
• js
  • script.js
• assets
  • images

If anything is missing, return to the Desktop folder and fix it there.

Do not create missing folders or files inside VS Code during this setup lesson.

────────────────────────
STEP 14 — FINISH
────────────────────────

Explain that the files may be empty because code has not been added yet.

Tell the user that the project workspace is now ready for the Master Generator Planner and later code-building steps.

End with:

"Your complete project folder was created on the Desktop and opened correctly in Visual Studio Code. Return to the Workshop Companion and continue to the Master Generator Planner."

Do not generate HTML, CSS, or JavaScript code.

Begin by asking:

"What is the approved generator name from your Generator Foundation, and do you already have a finished project folder on your Desktop that contains index.html, css, js, and assets?"`,

    masterGeneratorPlanner: `You are helping a complete beginner create the full plan for their project.

The Project Foundation has already been completed in this same chat.

Review the completed Foundation and use it as the source of truth.

Do not ask the user to paste it again.

Do not repeat questions that were already answered.

Do not create code yet.

Your job is to quietly make the smart planning decisions needed to build the project.

Ask only six short questions about anything important that is still missing.

Only ask about things such as:

• final categories or sections
• choices users need
• buttons
• extra features
• selection limits
• important rules

If the user does not know, recommend the strongest option for their project.

Do not overwhelm them with long lists.

After the missing information is approved, create exactly:

# Master Project Planner

## 1. Project Overview

Include only:

• project name
• project type
• main idea
• what it creates
• reference-image direction
• important rules

## 2. Page Sections

List the final page sections in order.

For each section, include one short sentence explaining what appears there.

## 3. Categories and Choices

For every category include only:

• category name
• whether users choose one or more than one
• complete final choice list
• whether custom text is allowed

Do not explain Randomize, Locks, or Presets under every category.

Automatically make all suitable categories work with Randomize, Locks, and Presets.

## 4. Buttons

List the final approved buttons.

After each button, include one short sentence explaining what it does.

Do not write long button instructions.

## 5. Features

List the final approved features.

After each feature, include one short sentence explaining how it works.

Automatically connect approved features to the correct categories, buttons, and results.

## 6. Presets

Choose the final presets automatically from the approved category choices.

Only provide:

• preset name
• one short description

Do not list every category value used inside each preset.

The future code-building step should create the exact preset combinations automatically from the approved options.

## 7. Final Result

Briefly explain:

• what the project creates
• the order of the final result
• what should be left out when empty
• how repeated wording should be avoided

Keep this section short.

## 8. Final Build Summary

Provide one compact summary containing:

• project name
• page sections
• category names
• buttons
• features
• preset names
• important rules

Do not repeat the full category option lists here.

## 9. Ready for the Content and Design Builder

Write a short handoff for the next prompt in this same chat.

Do not repeat the entire planner.

End with:

“Master Planner complete. Paste the Content and Design Builder prompt next.”

Do not create HTML.

Do not create CSS.

Do not create JavaScript.

Do not use technical coding language.

Do not include IDs, classes, selectors, data names, or code structure.

Do not create the visual design yet.

Do not repeat information across sections.

Keep the completed Master Planner focused, clear, and reasonably short.

Begin by reviewing the completed Project Foundation already in this chat.`,
    contentDesignBuilder: `You are helping a complete beginner plan the look, layout, and wording for their project.

The Project Foundation and Master Project Planner have already been completed in this same chat.

Use them as the source of truth.

Do not ask the user to paste them again.

Do not change the approved categories, choices, buttons, presets, features, rules, or results.

Do not create code yet.

Your job is to decide how the finished project should look and how the information should be arranged.

Use the approved reference image as the main visual guide.

Study:

• colors
• fonts
• layout
• spacing
• card style
• button style
• background
• overall mood
• image placement

Ask only the most important missing design questions.

Ask no more than six short questions at one time.

Questions may include:

1. Which colors should be used?

2. Should the style feel luxury, bold, playful, clean, feminine, professional, minimal, or another direction?

3. Should the page use a header image, video, logo, or text-only header?

4. Should categories appear as cards, dropdowns, tabs, accordions, or another simple layout?

5. Should the output appear at the bottom, in a side panel, or in a pop-up area?

6. Are there any design elements the project must include or avoid?

Do not ask questions that were already answered.

If the user does not know, recommend the best choice based on the project and reference image.

Keep recommendations simple.

After the design direction is approved, create exactly:

# Content and Design Plan

## 1. Overall Look

Describe:

• visual style
• mood
• colors
• background
• overall feel

## 2. Fonts

Choose:

• heading font
• body font
• button font

Keep the font choices easy to read and suitable for the project.

## 3. Page Order

List every page section from top to bottom.

For each section explain:

• what appears there
• how it should be arranged
• whether it should always show or open when clicked

## 4. Header Area

Describe:

• title
• subtitle
• logo
• image or video
• introductory text
• top buttons

Only include approved items.

## 5. Category Design

Explain how the approved categories should appear.

This may include:

• cards
• dropdowns
• selection buttons
• tabs
• collapsible sections
• text boxes
• sliders
• uploads

Do not add new categories.

## 6. Button Design

Describe how each approved button should look and where it should appear.

Include:

• main buttons
• secondary buttons
• small action buttons
• selected appearance
• disabled appearance

Do not rename approved buttons unless the user approves it.

## 7. Preset Design

If presets are approved, explain:

• where they appear
• how each preset card looks
• how users know which preset is active
• how presets should display on mobile

## 8. Output Design

Explain:

• where the finished result appears
• how the result card looks
• where Copy, Save, Download, or Variation buttons appear
• how long results should display
• what users see before anything is generated

## 9. Extra Feature Design

Explain how approved features should appear.

This may include:

• History
• Save
• Locks
• Randomize
• Variations
• Multiple characters
• Multiple scenes
• Custom text
• Uploads
• Quality checker

Only include approved features.

## 10. Messages and Instructions

Write the final simple wording for:

• page title
• subtitle
• section headings
• helper text
• button labels
• empty messages
• error messages
• success messages
• footer

Keep all wording short and beginner-friendly.

## 11. Images and Icons

Explain:

• which images are needed
• where they appear
• image shape and size
• icon style
• what should happen if an image is missing
• which decorative elements should be avoided

## 12. Mobile Design

Explain how the project should look on a phone.

Include:

• stacking sections
• button size
• category layout
• output layout
• image size
• text size
• spacing

Keep mobile use simple and easy to tap.

## 13. Final Design Summary

Provide one clean summary containing:

• visual style
• colors
• fonts
• page order
• section layout
• button design
• preset design
• output design
• feature design
• messages
• image direction
• mobile design
• non-negotiable design rules

## 14. Ready for the Code Builder

Summarize the approved design decisions so the next prompt in this same chat can build the project without asking the same questions again.

End with:

“Content and Design Plan complete. Paste the Code Builder prompt next.”

Do not create HTML.

Do not create CSS.

Do not create JavaScript.

Do not use technical coding language.

Do not ask for IDs, classes, selectors, data names, or code structure.

Do not continue into the next step.

Begin by reviewing the completed Foundation and Master Planner already in this chat.`,
    generatorCodeBuilder: `You are an expert HTML, CSS, JavaScript, accessibility, and front-end application architect specializing in professional AI prompt generators.

Your task is to generate the complete working code for any approved AI prompt generator.

The completed Generator Foundation, Master Generator Planner, and Content & Design Builder are the single source of truth.

Work one file at a time in this order:

1. index.html
2. style.css
3. script.js

────────────────────────
UNIVERSAL IMPLEMENTATION PERMISSION
────────────────────────

The planning documents control approved user-facing features, categories, controls, option values, presets, behavior, output relationships, IDs, repeated naming patterns, data contracts, visual direction, and responsive rules.

You are explicitly authorized to create the technical details required to implement those approved requirements, including:

• semantic wrapper elements
• reusable CSS classes
• layout classes
• component classes
• visual-state classes
• ARIA attributes
• supporting data attributes
• internal JavaScript variables
• functions
• state objects
• configuration objects
• utilities
• rendering helpers
• event delegation
• accessibility helpers

These implementation details do not count as inventing features when they:

• implement an approved requirement
• preserve all approved unique IDs
• preserve approved repeated naming patterns
• preserve approved workflow
• remain synchronized across all three files
• do not add new user-facing functionality
• do not remove approved functionality

Do not stop because decorative CSS class names, wrapper names, or internal function names were not manually specified.

────────────────────────
AUTHORITY ORDER
────────────────────────

1. Generator Foundation controls purpose, audience, final output, boundaries, and non-negotiable requirements.
2. Master Generator Planner controls categories, inputs, IDs, options, presets, behavior, output mappings, repeated patterns, validation, and DOM/selector contract.
3. Content & Design Builder controls presentation, interface copy, layout, typography, spacing, responsive behavior, and visual states.
4. Completed index.html becomes the final authority for DOM structure.
5. Completed style.css becomes the final authority for presentation hooks and state classes.

If documents conflict:

• follow the most specific approved instruction
• preserve all approved functionality
• do not delete features to solve conflicts
• ask one focused question only when the conflict cannot be safely resolved

────────────────────────
FILE 1 — index.html
────────────────────────

Generate one complete external index.html file.

Use every approved:

• section
• unique ID
• repeated ID pattern
• data attribute
• category
• input
• option
• preset
• button
• output
• variation area
• history area
• validation area
• quality-result area
• toast
• modal
• empty state
• footer

Create all necessary semantic wrappers, reusable classes, layout classes, component classes, ARIA attributes, and supporting data attributes required to implement the approved plan.

Do not create unapproved user-facing features.

Do not stop because a decorative class name or wrapper name was not preapproved.

Output only one complete HTML code block.

After the user confirms the file is saved, continue to style.css.

────────────────────────
FILE 2 — style.css
────────────────────────

Generate one complete external style.css file.

Use:

• completed index.html
• Content & Design Builder
• approved visual states
• approved responsive rules
• approved accessibility rules

Style every element, component, class, and state used by the completed HTML.

Do not create selectors for elements that do not exist.

Output only one complete CSS code block.

After the user confirms the file is saved, continue to script.js.

────────────────────────
FILE 3 — script.js
────────────────────────

Generate one complete external script.js file.

Use:

• Generator Foundation
• Master Generator Planner
• completed index.html
• completed style.css

Create the internal architecture required to implement all approved functionality.

Implement every approved feature, including where applicable:

• input handling
• dropdowns
• chip groups
• multi-select rules
• repeated panels
• accordions
• locks
• Randomize
• presets
• Generate
• Clear All
• Copy
• Save
• history
• delete history
• variations
• counters
• quality checker
• validation
• toast
• modal
• empty states
• loading
• persistence only when approved
• keyboard accessibility
• application initialization

Use only selectors that exist in the completed HTML.

Do not leave disconnected controls, placeholder arrays, incomplete presets, or unfinished functions.

Output only one complete JavaScript code block.

────────────────────────
FILE SIZE RULE
────────────────────────

Generate each complete file in one response whenever it fits safely.

If a file cannot fit without truncation:

• divide it into the fewest possible consecutive parts
• clearly label each part
• continue directly
• never repeat code
• never use placeholders
• never use ellipses
• never provide patches

────────────────────────
FINAL INTEGRATION CHECK
────────────────────────

Before completion, silently verify:

• every approved section exists
• every approved input exists
• every option exists
• every preset exists
• every unique ID is valid
• every repeated pattern is consistent
• every required data attribute exists
• every button is connected
• all selectors exist
• Randomize respects locks
• presets use approved values
• Clear All works
• prompt/output assembly follows the approved order
• variations work
• history works when approved
• toast works
• modal works
• validation works
• responsive layouts work
• keyboard navigation works
• there are no duplicate IDs
• there are no duplicate listeners
• there are no console errors
• all three files work together immediately

Begin by asking for the completed Generator Foundation, Master Generator Planner, and Content & Design Builder.`,
    cssBuilder: `You are an expert CSS developer, UI designer, accessibility specialist, and front-end application architect specializing in professional AI prompt generators.

Your task is to generate the complete external style.css file for any approved AI prompt generator.

The completed index.html and Content & Design Builder are the primary sources of truth for presentation.

The Master Generator Planner remains authoritative for approved states, relationships, repeated patterns, and behavior.

Do not generate HTML.

Do not generate JavaScript.

Do not redesign or remove approved functionality.

You are allowed to style every class and state that exists in the completed index.html, including structural and visual classes created by the Generator Code Builder.

Do not stop because a CSS class name was not manually preapproved in the planning documents.

The completed index.html is the selector authority.

Generate one complete style.css file whenever it fits safely.

If it cannot fit without truncation, divide it into the fewest possible consecutive parts without repeating code.

Include where applicable:

• design tokens
• reset
• typography
• font loading support
• page shell
• navigation
• accordions
• category cards
• repeated panels
• controls
• chip groups
• preset cards
• action buttons
• output cards
• variations
• history
• counters
• quality results
• validation summary
• empty states
• toast
• modal
• hover
• focus-visible
• active
• selected
• locked
• disabled
• loading
• error
• warning
• success
• desktop
• tablet
• mobile
• reduced-motion support

Do not create selectors for elements that do not exist in completed index.html.

Do not leave placeholders or unfinished sections.

Output only the complete CSS code inside one fenced CSS code block.`,

    expandCategoryOptions: `You are an expert AI prompt generator architect, JavaScript data specialist, option-system designer, and prompt engineering specialist helping a complete beginner expand the option lists inside a completed AI prompt generator.

The generator was already built during Day 1.

It already contains:

• completed index.html
• completed style.css
• completed script.js
• working categories
• starter option lists
• temporary presets
• Randomize
• locks
• prompt generation
• other approved features

Your task is to expand and improve the generator’s existing option data before the final presets are rebuilt.

Do not create final presets yet.

Do not redesign the generator.

Do not create new categories unless the user explicitly requests them.

Do not remove or rename existing categories, IDs, state keys, controls, or workflows.

────────────────────────
SOURCE OF TRUTH
────────────────────────

Begin by asking the user to upload:

• current complete index.html
• current complete script.js

Request the Master Generator Planner only when the current files do not provide enough information.

Request style.css only when a visual issue is involved.

The completed index.html is the authority for:

• existing categories
• controls
• IDs
• data attributes
• control types
• repeated structures
• selection limits shown in the interface

The completed script.js is the authority for:

• current option-data objects
• field definitions
• state keys
• default values
• multi-select limits
• Randomize rules
• compatibility rules
• prompt assembly
• current temporary presets

Inspect the files before recommending changes.

────────────────────────
YOUR TASK
────────────────────────

Help the user expand, improve, clean, or repair the existing option lists.

This may include:

• adding more useful options
• adding missing real-world choices
• removing exact duplicates
• repairing inconsistent spelling
• correcting invalid option values
• improving option variety
• organizing options logically
• keeping None first when used
• updating Randomize support
• updating multi-select limits when approved
• updating compatibility rules when necessary
• confirming new options appear in the correct controls
• confirming new options appear in generated prompts correctly

Do not automatically expand every category.

First identify which categories the user wants to improve.

If the user is unsure, review the current option data and recommend the categories that are noticeably limited, repetitive, incomplete, or weak.

────────────────────────
OPTION EXPANSION RULES
────────────────────────

For every expanded option list:

• preserve the existing option-data key
• preserve the existing field key
• preserve the existing control type
• preserve the existing ID
• preserve the existing default value
• keep None first when the current generator uses None
• use clear user-facing values
• avoid exact duplicates
• avoid near-duplicate wording unless the choices produce meaningfully different results
• avoid vague values
• avoid placeholder values
• keep capitalization and punctuation consistent
• ensure values work naturally inside the final prompt
• ensure Randomize can safely use the new values
• ensure presets can later use the new values
• ensure custom-text fields continue to work

Do not rename existing values when presets, state, or prompt logic depend on them unless all connected references are updated safely.

────────────────────────
CATEGORY REVIEW
────────────────────────

For each category being expanded, determine:

• current option-data key
• current field key
• current control type
• current values
• current selection limit
• current default
• current Randomize behavior
• current prompt inclusion rule
• duplicate or weak options
• missing useful options
• compatibility requirements
• connected presets that may temporarily reference old values

The existing presets are temporary.

Do not rebuild them during this step.

Only identify preset values that may need to be updated later.

────────────────────────
CONTROL-TYPE RULES
────────────────────────

For single-select controls:

• values must remain strings
• only one value may be active
• None behavior must remain consistent

For multi-select controls:

• values must remain arrays in state and presets
• preserve or update the maximum selection limit only with approval
• preserve None conflict behavior
• preserve deselection behavior
• confirm Randomize does not exceed the maximum

For dropdowns:

• preserve the option value format expected by the HTML and JavaScript

For repeated controls:

• update the shared option source instead of manually duplicating options for every repeated panel

────────────────────────
RANDOMIZE AND COMPATIBILITY
────────────────────────

After adding options, inspect whether any connected logic must also change.

Update where necessary:

• Randomize field lists
• random selection counts
• multi-select limits
• compatibility maps
• conflict rules
• dependent controls
• validation rules
• prompt assembly formatting

Do not change unrelated functionality.

Examples of compatibility that may require review include:

• hairstyle and hair length
• hairstyle and hair texture
• composition and visible footwear
• group mode and character count
• output type and required fields
• platform and format
• product type and category
• scene type and environment

Only apply compatibility rules relevant to the current generator.

────────────────────────
OUTPUT MODE
────────────────────────

After reviewing the files, choose the safest output.

MODE A — OPTION REVIEW

Use when the user wants recommendations before changing code.

Provide:

• categories reviewed
• weak or limited option lists
• duplicate values
• missing useful choices
• recommended additions
• values that should remain unchanged

MODE B — REPLACE OPTION DATA SECTION

Use when only the option-data object needs to change.

Provide:

• the full corrected option-data section
• exact beginning and ending replacement boundaries
• any connected limit or Randomize changes

MODE C — REPLACE CONNECTED JAVASCRIPT SECTIONS

Use when option expansion also requires updates to:

• field definitions
• limits
• Randomize
• compatibility
• validation
• prompt assembly

Provide every complete replacement section in the correct order.

MODE D — FULL SCRIPT REPLACEMENT

Use only when the option system is deeply connected throughout script.js and partial replacement would be unsafe.

Provide one complete corrected script.js file.

Preserve all unrelated working functionality.

────────────────────────
BEGINNER INSTRUCTIONS
────────────────────────

When code changes are required:

• tell the user the exact file to open
• identify the exact object or function to locate
• clearly state what to replace
• provide complete replacement code
• give one safe method
• do not provide vague instructions
• do not give several competing fixes
• do not tell the user to search through thousands of lines without a specific search term

────────────────────────
FINAL VALIDATION
────────────────────────

Before finishing, silently verify:

• every added option is unique
• every added option uses the correct value type
• None remains first where required
• every option appears in the correct control
• no option breaks Randomize
• no option exceeds selection limits
• no option breaks compatibility rules
• no option breaks validation
• no option breaks prompt assembly
• existing custom text still works
• temporary presets remain functional until the final preset step
• no console errors are introduced

End by telling the user that the option expansion is complete and the next workshop step is to rebuild the final presets using the expanded options.

Begin by asking:

“Please upload your current complete index.html and script.js, then tell me which categories you want to expand first.”`,

    customizePresets: `You are an expert AI prompt generator architect, JavaScript developer, preset-system specialist, and prompt engineering specialist helping a complete beginner rebuild the final preset system inside a completed AI prompt generator.

The generator was already built during Day 1.

The current presets are temporary starter presets.

The generator’s categories and option lists have now been reviewed and expanded.

Your task is to replace the temporary presets with the final approved preset system using the generator’s current completed files.

Do not create new categories.

Do not remove or rename existing categories.

Do not redesign the generator.

Do not change IDs, state keys, control types, repeated naming patterns, or existing workflows unless a repair is required for the preset system to work correctly.

────────────────────────
SOURCE OF TRUTH
────────────────────────

Begin by asking the user to upload:

• current complete index.html
• current complete script.js

Request style.css only when the preset buttons or active-preset state have a visual problem.

The completed index.html is the authority for:

• controls
• IDs
• data attributes
• repeated components
• preset buttons
• active preset display
• DOM relationships

The completed script.js is the authority for:

• final option data
• state structure
• current preset data
• field keys
• value types
• repeated naming patterns
• preset application logic
• locks
• Randomize
• rerender behavior

Inspect the files before creating or changing presets.

────────────────────────
PRESET GOAL
────────────────────────

Replace temporary, weak, incomplete, dummy, repetitive, or invalid presets with a complete final preset system based on the generator’s final expanded option data.

Determine:

• whether presets already exist
• where preset data is stored
• how preset cards are rendered
• how presets are applied
• how many presets currently exist
• whether the current preset count was approved
• which controls presets may populate
• which custom-text fields must be preserved
• whether locks must be respected
• whether repeated panels are supported
• whether group controls are supported
• whether active-preset state is displayed
• whether presets rerender the interface correctly

────────────────────────
PRESET COUNT
────────────────────────

Do not automatically force 15 presets.

Use this order:

1. Preserve the approved preset count already present in the completed generator.
2. If the user explicitly requests a new count, use that count.
3. If the current preset count is clearly temporary or unfinished, ask the user how many final presets they want.
4. If the user is unsure, recommend a practical number based on the generator’s size and complexity.

Do not change the approved count without permission.

────────────────────────
PRESET DATA RULES
────────────────────────

Every preset must use only:

• exact existing state keys
• exact existing field IDs
• exact approved repeated naming patterns
• exact current option values
• valid custom-text formats
• values appropriate for the correct control type

For every preset:

• create a unique preset ID
• create a unique preset name
• define its purpose
• define its output direction
• assign exact values to applicable controls
• use arrays only for multi-select controls
• use strings only for single-select controls and text fields
• use valid repeated-field prefixes
• avoid duplicate combinations
• avoid repetitive names
• preserve required fields
• leave fields unchanged only when intentional
• preserve custom user-entered text when the current generator requires it
• respect locked controls when the generator supports locks

Do not use placeholders such as:

• Add suitable values
• Choose appropriate options
• More settings here
• Customize as desired
• Other fields as needed

────────────────────────
REPEATED COMPONENTS
────────────────────────

When repeated controls exist, inspect and follow the exact current pattern.

Examples may include:

• char_1_hairstyle
• char_2_hairstyle
• product_1_name
• scene_2_location
• section_3_style

Do not assume every generator uses characters.

Only build repeated preset values for repeated structures that actually exist.

────────────────────────
PRESET VALIDATION
────────────────────────

Before presenting preset data, silently verify:

• every preset ID is unique
• every preset name is unique
• every field key exists
• every option value exists
• every array belongs to a multi-select field
• every string belongs to a single-value or text field
• every repeated field follows the current naming pattern
• no preset references removed options
• no preset requires missing HTML
• preset buttons identify the correct preset
• applying a preset updates the correct state
• applying a preset rerenders the correct controls
• locks are respected when approved
• custom text is preserved when approved
• presets do not break Randomize
• presets do not break Clear All
• presets do not create console errors

────────────────────────
OUTPUT MODE
────────────────────────

Choose the correct mode after reviewing the files.

MODE A — REVIEW ONLY

Use this when the preset system is already final and valid.

Provide:

• preset count
• valid presets
• duplicate presets
• invalid values
• missing values
• disconnected buttons
• active-preset problems
• exact issues found

Do not rewrite working code unnecessarily.

MODE B — REPAIR EXISTING PRESETS

Use this when the preset system exists but contains errors.

Provide:

• concise diagnosis
• full corrected preset data structure
• any required corrected preset functions
• exact replacement boundaries
• confirmation that every value matches the current generator

MODE C — REBUILD FINAL PRESET SYSTEM

Use this when the current presets are temporary, weak, incomplete, or based on old option data.

Provide:

• complete final preset set
• full JavaScript-ready preset data structure
• corrected preset helper functions when required
• corrected apply-preset logic when required
• corrected active-preset behavior when required
• corrected rerender behavior when required
• exact replacement boundaries

MODE D — FULL SCRIPT REPLACEMENT

Use this only when preset behavior is deeply connected to the entire script.js and a patch would be unsafe.

Provide one complete corrected script.js file.

Preserve all unrelated working functionality.

────────────────────────
BEGINNER INSTRUCTIONS
────────────────────────

When changes are required:

• tell the user the exact file to open
• identify the exact object, function, or section to locate
• clearly state whether to replace a section or the full file
• give one safe fix
• do not provide competing methods
• do not use vague directions
• provide the full replacement section
• use a full file when a patch would be risky

────────────────────────
FINAL CHECK
────────────────────────

Before finishing, confirm:

• final preset count is correct
• every preset uses final current values
• preset buttons work
• preset application works
• repeated panels work when applicable
• group and single modes work when applicable
• locks are respected when applicable
• custom text is preserved when required
• active preset display works when approved
• presets do not create console errors
• the final preset system is ready for live workshop use

Begin by asking:

“Please upload your current complete index.html and script.js so I can inspect the temporary presets and rebuild the final preset system using your expanded option data.”`,

    addHeaderImage: `You are an expert HTML and CSS developer helping a beginner customize an AI prompt generator.

Help me add a professional header image directly beneath my generator title.

Walk me through this step by step.

First, tell me how to add my image file to my project folder.

Then tell me exactly which file to open.

Then tell me how to find my main generator title in index.html.

Then tell me exactly where the header image code should go.

Then generate the HTML needed for the header image.

Then generate the CSS needed to style the image professionally.

Do not redesign my generator.

Do not remove or rename any existing code.

Keep the existing structure exactly the same.

Ask me to paste my current top section or header section before generating the final code.`,

    addMarquee: `You are an expert HTML and CSS developer helping a beginner customize an AI prompt generator.

Help me add a professional scrolling marquee to my generator.

Walk me through this step by step.

First, help me decide what text should appear in the marquee.

Then tell me exactly which file to open.

Next, tell me exactly how to find the correct location in my HTML where the marquee should be added.

After I paste that section of my HTML, generate only the HTML needed for the marquee.

Then generate the CSS needed to style it professionally.

Finally, explain how to customize:

• Text
• Speed
• Direction
• Colors
• Font
• Height
• Background

Do not redesign my generator.

Do not remove or rename any existing code.

Keep the existing structure exactly the same.

Wait for me to paste my current HTML before generating any code.`,

    updateCopyright: `You are an expert HTML, CSS, and JavaScript developer helping a beginner customize an AI prompt generator.

Help me update the copyright section of my generator.

Walk me through this step by step.

First, tell me which file to open.

Then help me find my current footer.

If my generator doesn't already have a footer, tell me where to add one.

After I paste that section of my HTML, generate the updated footer code.

Then generate any CSS needed to style it professionally.

If needed, generate the JavaScript required to automatically display the current year.

Do not redesign my generator.

Do not remove any existing features.

Keep the existing structure exactly the same.

Wait for me to paste my current footer or the bottom section of my HTML before generating any code.`,

    javascriptBuilder: `You are an expert JavaScript developer, accessibility specialist, and front-end application architect specializing in professional AI prompt generators.

Your task is to generate the complete external script.js file for any approved AI prompt generator.

The completed index.html is the final authority for DOM structure, IDs, classes, data attributes, controls, and relationships.

The completed style.css is the final authority for visual state classes and presentation hooks.

The Generator Foundation and Master Generator Planner remain authoritative for approved behavior, data, workflows, presets, output assembly, validation, and persistence.

Do not generate HTML.

Do not generate CSS.

Do not redesign or remove approved functionality.

You are allowed to create the internal JavaScript architecture required to implement approved behavior, including:

• configuration objects
• state objects
• option data
• preset data
• utilities
• render functions
• validation functions
• output assembly functions
• event handlers
• event delegation
• accessibility helpers
• initialization functions

These internal implementation details do not require separate approval.

Use only selectors that exist in completed index.html.

Do not stop because internal function names, state-object names, or utility names were not manually preapproved.

Generate one complete script.js file.

Do not divide it unless truncation would otherwise occur; if division is necessary, use the fewest possible consecutive parts without repeating code.

Implement every approved feature, including where applicable:

• input handling
• dropdowns
• single-select chips
• multi-select chips
• repeated panels
• accordions
• locks
• Randomize
• presets
• Generate
• Clear All
• Copy
• Save
• history
• delete history
• variations
• character counter
• quality checker
• validation
• toast
• modal
• empty states
• loading
• persistence only when approved
• keyboard accessibility
• final initialization

Do not leave disconnected controls.

Do not use placeholder option arrays or generic preset values.

Do not silently omit complex features.

Before output, silently verify:

• every approved interactive element is connected
• every selector exists
• every preset uses approved values
• every data attribute is handled
• repeated patterns are handled
• output assembly follows the planner
• Randomize respects locks
• Clear All restores approved defaults
• Copy and Save work
• history and variations work when approved
• toast and modal work when approved
• startup completes without console errors

Output only the complete JavaScript code inside one fenced JavaScript code block.`,
    testDebugCustomize: `You are an expert HTML, CSS, JavaScript, UI/UX, and debugging specialist helping a complete beginner test, debug, customize, and polish a professional AI prompt generator.

The completed planning documents, index.html, style.css, and script.js are the single source of truth.

Guide the user one small step at a time.

Include:

• Manual feature testing
• Browser console debugging
• Diagnosing and fixing HTML, CSS, and JavaScript issues
• Visual customization
• Mobile responsiveness testing
• Final production quality review
• Preparing the generator for publishing

Do not overwhelm the user.

Wait for "done" after each major section before continuing.

End by confirming the generator is complete and ready to publish.`,

    premiumOutputModules: `You are an expert HTML, CSS, JavaScript, UI/UX, and prompt engineering developer specializing in premium AI prompt generators.

The main AI prompt generator has already been built.

Your task is to add Premium Output Modules to the existing generator by updating the existing:

• index.html
• style.css
• script.js

Do not rebuild the generator from scratch.
Do not remove, rename, or break existing features.
Do not overwrite existing code unless it is necessary to connect the premium modules correctly.

Add only the premium output modules selected for this generator:

• Suno AI Music Prompt
• Video Script Prompt
• Marketing Prompt
• Custom GPT Builder

For the Custom GPT Builder, do not generate only a single prompt.

Generate the complete Custom GPT configuration, including:

• Complete Custom GPT Instructions
• Suggested Knowledge files to upload
• Conversation Starters
• Suggested Welcome Message
• Behavior and response guidelines
• Tone and personality instructions
• Goals and responsibilities
• Rules and limitations
• Best practices for using the GPT
• Testing checklist

Update the HTML to include:

• A Premium Outputs section
• Separate output areas or tabs for each selected module
• A copy button for each premium output
• Clear labels and beginner-friendly structure

Update the CSS to include:

• Styling for the Premium Outputs section
• Styling for premium module tabs/cards
• Styling for premium output boxes
• Styling for copy buttons
• Responsive mobile-friendly layout
• Visual styling that matches the existing generator

Update the JavaScript to include:

• Functions that generate each selected premium output
• Logic that pulls from the same existing user inputs
• Logic that prevents empty or broken outputs
• Copy button functionality for each premium output
• Integration with the existing Generate Prompt button
• Integration with existing prompt history if appropriate
• Error handling and toast messages

Each premium output must:

• Match the generator topic.
• Use the existing generator selections.
• Expand on the main prompt instead of repeating it.
• Produce complete, usable deliverables instead of outlines.
• Include all supporting content required for that output type.
• Be professionally formatted.
• Be immediately copy-and-paste ready.

Generate the updates in this order:

1. HTML code to add
2. CSS code to add
3. JavaScript code to add
4. Exact beginner-friendly instructions for where to paste each code block

Do not skip steps.
Do not generate placeholder features.
Make the added modules fully functional.`,
  };

  return snippets[type] || "Create a useful AI module for this generator.";
}

/* ==========================
   BASIC INIT
   ========================== */

function initializeCoreEngine() {
  setupRouter();
  setupMobileMenu();
  setupCopyButtons();

  const closePopupBtn = byId("closeCompletionPopup");

  if (closePopupBtn) {
    closePopupBtn.addEventListener("click", closeAchievementPopup);
  }

  const savedPage =
    appData.lastPage === "settings"
      ? "bonuses"
      : appData.lastPage || APP_CONFIG.defaultPage;

  openPage(savedPage);

  updateAchievementCount();

  console.log(`Prompt Generator Companion v${APP_CONFIG.version} core loaded.`);
}

/* ==========================
   PROGRESS CALCULATION
   ========================== */

function getCompletedJourneySteps() {
  const steps = appData.progress.journeySteps;

  return Object.values(steps).filter(Boolean).length;
}

function getTotalJourneySteps() {
  return Object.keys(appData.progress.journeySteps).length;
}

function getProgressPercent() {
  const completed = getCompletedJourneySteps();
  const total = getTotalJourneySteps();

  if (!total) return 0;

  return Math.round((completed / total) * 100);
}

function markJourneyStepComplete(stepName) {
  if (!appData.progress.journeySteps[stepName]) {
    appData.progress.journeySteps[stepName] = true;

    addActivity(
      "Journey step completed",
      `${formatStepName(stepName)} was marked complete.`,
    );

    saveAppData();
    renderDashboard();
    updateProgressUI();
    updateCompletionButtonStates();
  }
}

function formatStepName(stepName) {
  const labels = {
    dayOne: "Day 1 Build",
    modules: "AI Modules",
    publish: "GitHub + Netlify",
    sell: "Sell Your Generator",
  };

  return labels[stepName] || stepName;
}

/* ==========================
   PROGRESS UI
   ========================== */

function updateProgressUI() {
  const percent = getProgressPercent();
  const completed = getCompletedJourneySteps();
  const total = getTotalJourneySteps();

  const sidebarPercent = byId("sidebarProgressPercent");
  const dashboardPercent = byId("dashboardProgressPercent");
  const dashboardStatsProgress = byId("dashboardStatsProgress");
  const sidebarText = byId("sidebarProgressText");
  const sidebarFill = byId("sidebarProgressFill");
  const dashboardNextStep = byId("dashboardNextStep");

  if (sidebarPercent) sidebarPercent.textContent = `${percent}%`;
  if (dashboardPercent) dashboardPercent.textContent = `${percent}%`;
  if (dashboardStatsProgress)
    dashboardStatsProgress.textContent = `${percent}%`;

  if (sidebarText) {
    sidebarText.textContent = `${completed} of ${total} journey steps complete`;
  }

  if (sidebarFill) {
    sidebarFill.style.width = `${percent}%`;
  }

  if (dashboardNextStep) {
    dashboardNextStep.textContent = getNextStepMessage();
  }

  updateCertificateStatusLabel();
}

function getNextStepMessage() {
  const steps = appData.progress.journeySteps;

  if (!steps.dayOne) {
    return "Continue Day 1 and build the working generator foundation.";
  }

  if (!steps.modules) {
    return "Add premium AI modules so the generator feels valuable enough to sell.";
  }

  if (!steps.publish) {
    return "Publish the generator with GitHub and Netlify.";
  }

  if (!steps.sell) {
    return "Package the generator and prepare it for sale.";
  }

  return "Workshop complete. Your certificate is ready.";
}

function updateCertificateStatusLabel() {
  const statCards = $$(".stat-card");

  statCards.forEach((card) => {
    const label = card.querySelector("span");
    const value = card.querySelector("h2");

    if (!label || !value) return;

    if (label.textContent.trim().toLowerCase() === "certificate") {
      value.textContent = isWorkshopComplete() ? "Unlocked" : "Locked";
    }
  });
}

function isWorkshopComplete() {
  return getProgressPercent() === 100;
}

/* ==========================
   DASHBOARD RENDERING
   ========================== */

function renderDashboard() {
  renderActivityFeed();
  updateProgressUI();
  updateAchievementCount();
}

function renderActivityFeed() {
  const feed = byId("activityFeed");

  if (!feed) return;

  if (!appData.activity.length) {
    feed.innerHTML = `
      <div class="activity-item">
        <strong>Ready to begin</strong>
        <p>Your workshop activity will appear here.</p>
      </div>
    `;
    return;
  }

  feed.innerHTML = appData.activity
    .slice(0, 6)
    .map((item) => {
      return `
        <div class="activity-item">
          <strong>${escapeHTML(item.title)}</strong>
          <p>${escapeHTML(item.description || "Progress saved.")}</p>
          <small>${formatDate(item.date)}</small>
        </div>
      `;
    })
    .join("");
}

function formatDate(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function escapeHTML(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* ==========================
   CONTINUE BUTTONS
   ========================== */

function getNextPageId() {
  const steps = appData.progress.journeySteps;

  if (!steps.dayOne) return "day-one";
  if (!steps.modules) return "modules";
  if (!steps.publish) return "publish";
  if (!steps.sell) return "sell";

  return "day-two";
}

function setupContinueButtons() {
  const continueButtons = [
    byId("topbarContinueBtn"),
    byId("dashboardContinueBtn"),
    byId("continueBtn"),
  ].filter(Boolean);

  continueButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const nextPage = getNextPageId();

      openPage(nextPage);

      addActivity("Continued workshop", `Opened ${getPageTitle(nextPage)}.`);
    });
  });
}

function getPageTitle(pageId) {
  const labels = {
    dashboard: "Command Center",
    journey: "Workshop Journey",
    "day-one": "Day 1",
    "day-two": "Day 2",
    references: "Reference Image Library",

    publish: "GitHub + Netlify",
    sell: "Sell Your Generator",
    downloads: "Downloads",
    notebook: "Notebook",
    replays: "Replay Library",
    bonuses: "Bonus Resources",
  };

  return labels[pageId] || pageId;
}

/* ==========================
   DAY COMPLETE BUTTONS
   ========================== */

function setupDayCompletionButtons() {
  const dayOneBtn = byId("markDayOneCompleteBtn");
  const dayTwoBtn = byId("markDayTwoCompleteBtn");

  if (dayOneBtn) {
    dayOneBtn.addEventListener("click", () => {
      appData.progress.dayOneComplete = true;
      markJourneyStepComplete("dayOne");

      unlockAchievement(
        "day-one-complete",
        "Day 1 Complete",
        "You built the generator foundation.",
      );

      saveAppData();
      renderDashboard();
      updateCompletionButtonStates();
      showToast("Day 1 marked complete.");
    });
  }

  if (dayTwoBtn) {
    dayTwoBtn.addEventListener("click", () => {
      appData.progress.dayTwoComplete = true;

      markJourneyStepComplete("modules");

      unlockAchievement(
        "day-two-complete",
        "Day 2 Complete",
        "You customized, expanded, tested, and completed your generator.",
      );

      saveAppData();
      renderDashboard();
      updateCompletionButtonStates();

      showToast("Opening Sell Your Generator...");

      setTimeout(() => {
        openPage("sell");
      }, 800);
    });
  }
}
/* ==========================
   PROGRESS BUTTON STATES
   ========================== */

function updateCompletionButtonStates() {
  const dayOneBtn = byId("markDayOneCompleteBtn");
  const dayTwoBtn = byId("markDayTwoCompleteBtn");

  if (dayOneBtn && appData.progress.dayOneComplete) {
    dayOneBtn.textContent = "Day 1 Complete";
    dayOneBtn.disabled = false;
    dayOneBtn.classList.add("is-complete");
  }

  if (dayTwoBtn && appData.progress.dayTwoComplete) {
    dayTwoBtn.textContent = "Mark Day 2 Complete & Continue to Selling";
    dayTwoBtn.disabled = false;
    dayTwoBtn.classList.add("is-complete");
  }
}

/* ==========================
   SECTION 2 INIT
   ========================== */

function initializeDashboardEngine() {
  setupContinueButtons();
  setupDayCompletionButtons();
  updateCompletionButtonStates();
  renderDashboard();

  console.log("Section 2 loaded: Dashboard + Progress Engine");
}

/* =========================================================
   SECTION 3: NOTEBOOK + PROFILE + SETTINGS
   Paste directly under Section 2
   ========================================================= */

/* ==========================
   NOTEBOOK SYSTEM
   ========================== */

function setupNotebook() {
  const mainNote = byId("mainNote");
  const savedNotesList = byId("savedNotesList");
  const newNoteBtn = byId("newNoteBtn");
  const deleteNoteBtn = byId("deleteNoteBtn");
  const currentNoteTitle = byId("currentNoteTitle");
  const noteTimestamp = byId("noteTimestamp");
  const noteSaveStatus = byId("noteSaveStatus");

  if (
    !mainNote ||
    !savedNotesList ||
    !newNoteBtn ||
    !deleteNoteBtn ||
    !currentNoteTitle ||
    !noteTimestamp ||
    !noteSaveStatus
  ) {
    return;
  }

  function formatNoteDate(dateString) {
    const date = new Date(dateString);

    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function getNoteTitle(content) {
    const firstLine = content.trim().split("\n")[0];

    if (!firstLine) {
      return "Untitled Note";
    }

    return firstLine.length > 35 ? `${firstLine.slice(0, 35)}...` : firstLine;
  }

  function getActiveNote() {
    return appData.notebookNotes.find(
      (note) => note.id === appData.activeNoteId,
    );
  }

  function renderSavedNotes() {
    savedNotesList.innerHTML = "";

    if (!appData.notebookNotes.length) {
      savedNotesList.innerHTML = `
        <p class="empty-notes-message">No saved notes yet.</p>
      `;
      return;
    }

    const sortedNotes = [...appData.notebookNotes].sort(
      (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
    );

    sortedNotes.forEach((note) => {
      const button = document.createElement("button");

      button.type = "button";
      button.className = "saved-note-item";

      if (note.id === appData.activeNoteId) {
        button.classList.add("active");
      }

      button.innerHTML = `
        <strong>${escapeHTML(getNoteTitle(note.content))}</strong>
        <span>${escapeHTML(formatNoteDate(note.updatedAt))}</span>
      `;

      button.addEventListener("click", () => {
        appData.activeNoteId = note.id;
        saveAppData();
        loadActiveNote();
        renderSavedNotes();
      });

      savedNotesList.appendChild(button);
    });
  }

  function loadActiveNote() {
    const note = getActiveNote();

    if (!note) {
      mainNote.value = "";
      currentNoteTitle.textContent = "New Note";
      noteTimestamp.textContent = "Start typing to save this note.";
      noteSaveStatus.textContent = "Your note will save automatically.";
      deleteNoteBtn.disabled = true;
      return;
    }

    mainNote.value = note.content;
    currentNoteTitle.textContent = getNoteTitle(note.content);
    noteTimestamp.textContent = `Last saved ${formatNoteDate(note.updatedAt)}`;
    noteSaveStatus.textContent = "Saved automatically.";
    deleteNoteBtn.disabled = false;
  }

  function createNewNote() {
    appData.activeNoteId = null;
    saveAppData();
    loadActiveNote();
    renderSavedNotes();
    mainNote.focus();
  }

  mainNote.addEventListener("input", () => {
    const content = mainNote.value;
    let note = getActiveNote();

    if (!note && content.trim()) {
      note = {
        id: `note-${Date.now()}`,
        content: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      appData.notebookNotes.unshift(note);
      appData.activeNoteId = note.id;
    }

    if (!note) {
      return;
    }

    note.content = content;
    note.updatedAt = new Date().toISOString();

    saveAppData();

    currentNoteTitle.textContent = getNoteTitle(note.content);
    noteTimestamp.textContent = `Last saved ${formatNoteDate(note.updatedAt)}`;
    noteSaveStatus.textContent = "Saved automatically.";
    deleteNoteBtn.disabled = false;

    renderSavedNotes();
  });

  newNoteBtn.addEventListener("click", createNewNote);

  deleteNoteBtn.addEventListener("click", () => {
    const note = getActiveNote();

    if (!note) {
      return;
    }

    const confirmDelete = window.confirm(
      "Delete this note? This cannot be undone.",
    );

    if (!confirmDelete) {
      return;
    }

    appData.notebookNotes = appData.notebookNotes.filter(
      (savedNote) => savedNote.id !== note.id,
    );

    appData.activeNoteId = null;
    saveAppData();

    loadActiveNote();
    renderSavedNotes();
    showToast("Note deleted.");
  });

  loadActiveNote();
  renderSavedNotes();
}

/* ==========================
   EXPORT / IMPORT DATA
   ========================== */

function setupDataTools() {
  const resetDataBtn = byId("resetDataBtn");

  if (resetDataBtn) {
    resetDataBtn.addEventListener("click", handleResetData);
  }
}

async function handleResetData() {
  const confirmReset = window.confirm(
    "This will erase your saved notes, progress, checklists, and achievements. Reset everything?",
  );

  if (!confirmReset) return;

  resetAppData();

  try {
    await clearReferenceImageDatabase();
  } catch (error) {
    console.warn("Reference images could not be cleared during reset.", error);
  }

  showToast("Data reset.");

  setTimeout(() => {
    window.location.reload();
  }, 600);
}

/* ==========================
   FILE DOWNLOAD UTILITY
   ========================== */

function downloadTextFile(filename, content) {
  const blob = new Blob([content], {
    type: "text/html;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();

  link.remove();
  URL.revokeObjectURL(url);
}

/* ==========================
   SECTION 3 INIT
   ========================== */

function initializeProfileNotebookSettings() {
  setupNotebook();
  setupDataTools();

  console.log("Section 3 loaded: Notebook + Bonus Resources");
}

/* =========================================================
   SECTION 4: DOWNLOADS + REPLAYS + SEARCH
   Paste directly under Section 3
   ========================================================= */

/* ==========================
   DOWNLOAD RESOURCE CONTENT
   ========================== */

const DOWNLOAD_RESOURCES = {
  "html-starter": {
    filename: "starter-code-pack.txt",
    title: "Starter Code Pack",
    content: `
STARTER CODE PACK

HTML STARTER
------------------------------
<main class="generator">
  <h1>Prompt Generator Companion</h1>
  <p>Build polished AI prompt generators with clean HTML, CSS, and JavaScript</p>

  <label for="businessType">Business Type</label>
  <select id="businessType">
    <option>Image Prompt Generator</option>
    <option>Coaching Business</option>
    <option>Prompt Generator</option>
  </select>

  <label for="outputType">Output Type</label>
  <select id="outputType">
    <option>Image Prompt</option>
    <option>Video Script</option>
    <option>Suno Music Prompt</option>
  </select>

  <button id="generateBtn">Generate</button>
  <button id="copyBtn">Copy</button>

  <textarea id="output" readonly></textarea>
</main>


CSS STARTER
------------------------------
body {
  margin: 0;
  font-family: Arial, sans-serif;
  background: #05050a;
  color: white;
}

.generator {
  max-width: 760px;
  margin: 60px auto;
  padding: 32px;
  border: 1px solid rgba(212, 175, 55, 0.35);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.06);
}

button {
  padding: 14px 20px;
  border: none;
  border-radius: 999px;
  background: #d4af37;
  color: #05050a;
  font-weight: 700;
  cursor: pointer;
}

textarea,
select {
  width: 100%;
  margin: 10px 0 18px;
  padding: 14px;
  border-radius: 14px;
}


JAVASCRIPT STARTER
------------------------------
const generateBtn = document.getElementById("generateBtn");
const copyBtn = document.getElementById("copyBtn");
const businessType = document.getElementById("businessType");
const outputType = document.getElementById("outputType");
const output = document.getElementById("output");

generateBtn.addEventListener("click", () => {
  output.value = \`Create a \${outputType.value} for a \${businessType.value}. Make it polished, useful, and ready to use.\`;
});

copyBtn.addEventListener("click", async () => {
  await navigator.clipboard.writeText(output.value);
  copyBtn.textContent = "Copied!";
  setTimeout(() => (copyBtn.textContent = "Copy"), 1500);
});
`.trim(),
  },

  publish: {
    filename: "github-netlify-publish-checklist.txt",
    title: "GitHub + Netlify Publish Checklist",
    content: `
GITHUB + NETLIFY PUBLISH CHECKLIST

PART 1: BEFORE PUBLISHING
- Make sure your homepage file is named index.html.
- Make sure your CSS file path is correct.
- Make sure your JavaScript file path is correct.
- Save every file.
- Test your buttons.
- Test your generator output.
- Test your copy button.

PART 2: GITHUB
- Open GitHub Desktop.
- Add your project folder.
- Create a repository.
- Write a commit message.
- Click Commit.
- Click Push.

PART 3: NETLIFY
- Log into Netlify.
- Choose Add New Site.
- Choose Import from Git.
- Connect GitHub.
- Select your repository.
- Deploy the site.

PART 4: AFTER DEPLOYMENT
- Open your live link.
- Test every page.
- Test every button.
- Test mobile view.
- Copy the final link.
- Add the link to your product page.

PART 5: UPDATES
- Edit your files in VS Code.
- Save changes.
- Commit in GitHub Desktop.
- Push to GitHub.
- Netlify will update automatically.
`.trim(),
  },

  selling: {
    filename: "sell-your-generator-guide.txt",
    title: "Sell Your Generator Guide",
    content: `
SELL YOUR GENERATOR GUIDE

1. PRODUCT PACKAGE
Your buyer should receive:
- Live generator link
- Instructions
- Screenshots
- Usage rights
- Optional template files

2. PRODUCT DESCRIPTION
Include:
- Who it is for
- What it helps them create
- Why it saves time
- What they receive
- How to use it

3. SIMPLE PRICING IDEAS
Starter version: $7-$17
Polished version: $27-$47
Bundle version: $67-$97+

4. PROMO CONTENT IDEAS
- Show the generator working.
- Show before and after outputs.
- Explain who it helps.
- Tell people what they get.
- Add a clear CTA.

5. BUYER INSTRUCTIONS
Tell buyers:
- Open the live link.
- Choose their options.
- Click Generate.
- Copy the result.
- Paste it into ChatGPT, Canva, Krea, ImageFX, Suno, or their preferred tool.

6. FINAL CHECK
- Is the product easy to understand?
- Is the link working?
- Are the instructions clear?
- Does the buyer know what to do after purchase?
`.trim(),
  },
};

/* ==========================
   DOWNLOAD BUTTONS
   ========================== */

function setupDownloadButtons() {
  $$(".download-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const downloadKey = button.dataset.download;
      const resource = DOWNLOAD_RESOURCES[downloadKey];

      if (!resource) {
        showToast("Download file not found.");
        return;
      }

      downloadTextFile(resource.filename, resource.content);

      addActivity("Downloaded resource", `${resource.title} was downloaded.`);

      unlockAchievement(
        `download-${downloadKey}`,
        "Resource Downloaded",
        `${resource.title} is ready to use.`,
      );

      showToast("Download started.");
    });
  });
}

/* ==========================
   REPLAY LIBRARY
   ========================== */

const REPLAY_DATA = {
  day1: {
    title: "Day 1 Replay",
    message:
      "Day 1 replay is where students review project setup, HTML, CSS, JavaScript, generator buttons, and testing.",
    url: "",
  },

  day2: {
    title: "Day 2 Replay",
    message:
      "Day 2 replay is where students review premium modules, GitHub, Netlify, product packaging, and launch strategy.",
    url: "",
  },
};

function setupReplayButtons() {
  $$(".replay-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const replayKey = button.dataset.replay;
      const replay = REPLAY_DATA[replayKey];

      if (!replay) {
        showToast("Replay not found.");
        return;
      }

      addActivity(replay.title, replay.message);

      showToast(`${replay.title} opened.`);

      if (!replay.url) {
        showToast("Replay video coming soon.");
        return;
      }

      window.open(replay.url, "_blank", "noopener,noreferrer");
    });
  });
}

/* ==========================
   SEARCH INDEX
   ========================== */

function buildSearchIndex() {
  return $$(".page").map((page) => {
    const title =
      page.querySelector("h1")?.textContent ||
      page.querySelector("h2")?.textContent ||
      page.id;

    const text = page.textContent.replace(/\s+/g, " ").trim();

    return {
      id: page.id,
      title,
      text: text.toLowerCase(),
    };
  });
}

let searchIndex = [];

function findSearchMatch(query) {
  return searchIndex.find((item) => {
    return (
      item.text.includes(query) || item.title.toLowerCase().includes(query)
    );
  });
}

function setupGlobalSearch() {
  const searchInput = byId("globalSearch");

  if (!searchInput) return;

  searchIndex = buildSearchIndex();

  searchInput.addEventListener("input", () => {
    const query = searchInput.value.trim().toLowerCase();

    if (!query) {
      clearSearchHighlight();
      return;
    }

    const match = findSearchMatch(query);

    if (!match) {
      showToast("No matching section found.");
      return;
    }

    openPage(match.id);
    highlightSearchTerm(query);
  });

  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      const query = searchInput.value.trim().toLowerCase();

      if (!query) return;

      const match = findSearchMatch(query);

      if (match) {
        openPage(match.id);
        addActivity("Search used", `Searched for "${query}".`);
      }
    }
  });
}

function highlightSearchTerm(query) {
  clearSearchHighlight();

  const activePage = $(".page.active-page");

  if (!activePage || !query) return;

  activePage.classList.add("search-match-page");
}

function clearSearchHighlight() {
  $$(".page").forEach((page) => {
    page.classList.remove("search-match-page");
  });
}

/* ==========================
   HELP CENTER QUICK TRACKING
   ========================== */

function setupHelpTracking() {
  const helpCards = $$(".help-card");

  helpCards.forEach((card) => {
    card.addEventListener("click", () => {
      const title = card.querySelector("h2")?.textContent || "Help topic";

      addActivity("Help topic viewed", title);
      showToast("Help topic opened.");
    });
  });
}

/* ==========================
   MODULE TRACKING
   ========================== */

function setupModuleTracking() {
  $$(".copy-snippet-btn").forEach((button) => {
    button.addEventListener("click", () => {
      markJourneyStepComplete("modules");

      unlockAchievement(
        "module-prompt-copied",
        "Module Prompt Copied",
        "You copied a premium AI module prompt.",
      );
    });
  });
}

/* ==========================
   SEARCH STYLE HELPER
   ========================== */

function injectSearchStyles() {
  if (byId("searchStyleHelper")) return;

  const style = document.createElement("style");
  style.id = "searchStyleHelper";

  style.textContent = `
    .search-match-page {
      outline: 2px solid rgba(212, 175, 55, 0.45);
      outline-offset: 8px;
      border-radius: 24px;
    }
  `;

  document.head.appendChild(style);
}

/* ==========================
   REFERENCE IMAGE LIBRARY
   ========================== */

const REFERENCE_LIBRARY_DB = {
  name: "promptGeneratorReferenceLibrary",
  version: 1,
  storeName: "images",
  maxFileSize: 10 * 1024 * 1024,
  allowedTypes: ["image/png", "image/jpeg", "image/webp", "image/gif"],
};

let referenceLibraryDb = null;
let referenceObjectUrls = [];

function openReferenceLibraryDatabase() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("IndexedDB is not supported in this browser."));
      return;
    }

    const request = indexedDB.open(
      REFERENCE_LIBRARY_DB.name,
      REFERENCE_LIBRARY_DB.version,
    );

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(REFERENCE_LIBRARY_DB.storeName)) {
        database.createObjectStore(REFERENCE_LIBRARY_DB.storeName, {
          keyPath: "id",
        });
      }
    };

    request.onsuccess = () => {
      referenceLibraryDb = request.result;
      resolve(referenceLibraryDb);
    };

    request.onerror = () => {
      reject(request.error || new Error("The image library could not open."));
    };
  });
}

function getReferenceImageStore(mode = "readonly") {
  if (!referenceLibraryDb) {
    throw new Error("The reference image database is not ready.");
  }

  return referenceLibraryDb
    .transaction(REFERENCE_LIBRARY_DB.storeName, mode)
    .objectStore(REFERENCE_LIBRARY_DB.storeName);
}

function getAllReferenceImages() {
  return new Promise((resolve, reject) => {
    try {
      const request = getReferenceImageStore().getAll();

      request.onsuccess = () => {
        const images = Array.isArray(request.result) ? request.result : [];
        images.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        resolve(images);
      };

      request.onerror = () => {
        reject(request.error || new Error("Images could not be loaded."));
      };
    } catch (error) {
      reject(error);
    }
  });
}

function saveReferenceImage(record) {
  return new Promise((resolve, reject) => {
    try {
      const request = getReferenceImageStore("readwrite").put(record);

      request.onsuccess = () => resolve(record);
      request.onerror = () =>
        reject(request.error || new Error("The image could not be saved."));
    } catch (error) {
      reject(error);
    }
  });
}

function deleteReferenceImageRecord(imageId) {
  return new Promise((resolve, reject) => {
    try {
      const request = getReferenceImageStore("readwrite").delete(imageId);

      request.onsuccess = () => resolve();
      request.onerror = () =>
        reject(request.error || new Error("The image could not be removed."));
    } catch (error) {
      reject(error);
    }
  });
}

function clearReferenceImageDatabase() {
  return new Promise((resolve, reject) => {
    if (!referenceLibraryDb) {
      resolve();
      return;
    }

    try {
      const request = getReferenceImageStore("readwrite").clear();

      request.onsuccess = () => resolve();
      request.onerror = () =>
        reject(
          request.error || new Error("The image library could not clear."),
        );
    } catch (error) {
      reject(error);
    }
  });
}

function validateReferenceImageFile(file) {
  if (!REFERENCE_LIBRARY_DB.allowedTypes.includes(file.type)) {
    return `${file.name} is not a supported image type.`;
  }

  if (file.size > REFERENCE_LIBRARY_DB.maxFileSize) {
    return `${file.name} is larger than 10 MB.`;
  }

  return "";
}

function createReferenceImageRecord(file) {
  const fallbackId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const uniqueId =
    window.crypto && typeof window.crypto.randomUUID === "function"
      ? window.crypto.randomUUID()
      : fallbackId;

  return {
    id: `reference-${uniqueId}`,
    name: file.name,
    type: file.type,
    size: file.size,
    createdAt: new Date().toISOString(),
    blob: file,
  };
}

function revokeReferenceObjectUrls() {
  referenceObjectUrls.forEach((url) => URL.revokeObjectURL(url));
  referenceObjectUrls = [];
}

function formatReferenceFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "Unknown size";

  const units = ["B", "KB", "MB"];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const decimals = unitIndex === 0 ? 0 : 1;
  return `${value.toFixed(decimals)} ${units[unitIndex]}`;
}

function downloadReferenceImage(image) {
  const url = URL.createObjectURL(image.blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = image.name || "reference-image";
  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 500);
}

function createUploadedReferenceCard(image) {
  const card = document.createElement("article");
  const imageUrl = URL.createObjectURL(image.blob);

  referenceObjectUrls.push(imageUrl);

  card.className = "reference-image-card";
  card.dataset.referenceImageId = image.id;

  card.innerHTML = `
    <div class="reference-image-frame">
      <img src="${imageUrl}" alt="${escapeHTML(image.name)}" />
    </div>

    <div class="reference-image-card-body">
      <div>
        <h3>${escapeHTML(image.name)}</h3>
        <p>${escapeHTML(formatReferenceFileSize(image.size))}</p>
      </div>

      <div class="reference-card-actions">
        <button
          class="secondary-btn reference-card-download"
          type="button"
        >
          Download
        </button>

        <button
          class="danger-btn reference-card-delete"
          type="button"
        >
          Remove
        </button>
      </div>
    </div>
  `;

  card
    .querySelector(".reference-card-download")
    ?.addEventListener("click", () => {
      downloadReferenceImage(image);
      showToast("Image download started.");
    });

  card
    .querySelector(".reference-card-delete")
    ?.addEventListener("click", async () => {
      const confirmed = window.confirm(
        `Remove "${image.name}" from your Reference Image Library?`,
      );

      if (!confirmed) return;

      try {
        await deleteReferenceImageRecord(image.id);
        await renderUploadedReferenceImages();
        showToast("Reference image removed.");
      } catch (error) {
        console.error(error);
        showToast("The image could not be removed.");
      }
    });

  return card;
}

async function renderUploadedReferenceImages() {
  const grid = byId("uploadedReferenceGrid");
  const countLabel = byId("referenceImageCount");
  const clearButton = byId("clearReferenceImagesBtn");

  if (!grid) return;

  try {
    const images = await getAllReferenceImages();

    revokeReferenceObjectUrls();
    grid.innerHTML = "";

    if (!images.length) {
      const empty = document.createElement("div");

      empty.id = "referenceEmptyState";
      empty.className = "reference-empty-state";
      empty.innerHTML = `
        <i data-lucide="images"></i>
        <h3>No uploaded images yet</h3>
        <p>
          Click <strong>Choose Images</strong> to add your first
          reference image.
        </p>
      `;

      grid.appendChild(empty);
    } else {
      images.forEach((image) => {
        grid.appendChild(createUploadedReferenceCard(image));
      });
    }

    if (countLabel) {
      countLabel.textContent = `${images.length} ${
        images.length === 1 ? "image" : "images"
      }`;
    }

    if (clearButton) {
      clearButton.disabled = images.length === 0;
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }
  } catch (error) {
    console.error("Reference images could not be rendered.", error);
    showToast("Reference images could not be loaded.");
  }
}

async function handleReferenceImageUpload(event) {
  const input = event.currentTarget;
  const files = Array.from(input.files || []);

  if (!files.length) return;

  let savedCount = 0;

  for (const file of files) {
    const validationMessage = validateReferenceImageFile(file);

    if (validationMessage) {
      showToast(validationMessage);
      continue;
    }

    try {
      await saveReferenceImage(createReferenceImageRecord(file));
      savedCount += 1;
    } catch (error) {
      console.error(`Could not save ${file.name}.`, error);
      showToast(`${file.name} could not be saved.`);
    }
  }

  input.value = "";
  await renderUploadedReferenceImages();

  if (savedCount) {
    showToast(
      `${savedCount} reference ${savedCount === 1 ? "image" : "images"} saved.`,
    );
  }
}

async function setupReferenceImageLibrary() {
  const uploadInput = byId("referenceImageUpload");
  const clearButton = byId("clearReferenceImagesBtn");

  if (!uploadInput || !clearButton) return;

  try {
    await openReferenceLibraryDatabase();
    await renderUploadedReferenceImages();
  } catch (error) {
    console.error("Reference Image Library could not start.", error);
    uploadInput.disabled = true;
    clearButton.disabled = true;
    showToast("This browser could not open the image library.");
    return;
  }

  uploadInput.addEventListener("change", handleReferenceImageUpload);

  clearButton.addEventListener("click", async () => {
    const confirmed = window.confirm(
      "Remove every uploaded reference image from this browser?",
    );

    if (!confirmed) return;

    try {
      await clearReferenceImageDatabase();
      await renderUploadedReferenceImages();
      showToast("All uploaded reference images were removed.");
    } catch (error) {
      console.error(error);
      showToast("The images could not be removed.");
    }
  });
}

/* ==========================
   SECTION 4 INIT
   ========================== */

function initializeDownloadsReplaysSearch() {
  setupDownloadButtons();
  setupReplayButtons();
  setupGlobalSearch();
  setupHelpTracking();

  setupModuleTracking();
  injectSearchStyles();

  console.log("Section 4 loaded: Downloads + Replays + Search");
}

/* =========================================================
   SECTION 5: CERTIFICATE SYSTEM + FINAL APP POLISH
   Paste directly under Section 4
   ========================================================= */

/* ==========================
   CERTIFICATE SYSTEM
   ========================== */

/* ==========================
   CHECKLIST AUTOSAVE SYSTEM
   ========================== */

function setupChecklistAutosave() {
  const checkboxes = $$('input[type="checkbox"]');

  if (!appData.checklists) {
    appData.checklists = {};
  }

  checkboxes.forEach((checkbox, index) => {
    const key = getCheckboxKey(checkbox, index);

    checkbox.checked = Boolean(appData.checklists[key]);

    checkbox.addEventListener("change", () => {
      appData.checklists[key] = checkbox.checked;

      saveAppData();

      if (checkbox.checked) {
        addActivity(
          "Checklist updated",
          "A workshop checkpoint was completed.",
        );
      }

      updateChecklistAchievements();
    });
  });
}

function getCheckboxKey(checkbox, index) {
  const page = checkbox.closest(".page");
  const section = checkbox.closest(".lesson-block, .card, article");
  const label =
    checkbox.parentElement?.textContent?.trim() || `checkbox-${index}`;

  const pageId = page?.id || "global";
  const sectionTitle =
    section?.querySelector("h2")?.textContent?.trim() || "section";

  return `${pageId}:${sectionTitle}:${label}`;
}

function updateChecklistAchievements() {
  const checkedCount = Object.values(appData.checklists || {}).filter(
    Boolean,
  ).length;

  if (checkedCount >= 3) {
    unlockAchievement(
      "three-checkpoints",
      "Momentum Started",
      "You completed your first 3 workshop checkpoints.",
    );
  }

  if (checkedCount >= 8) {
    unlockAchievement(
      "eight-checkpoints",
      "Builder Mode",
      "You completed 8 workshop checkpoints.",
    );
  }

  if (checkedCount >= 15) {
    unlockAchievement(
      "fifteen-checkpoints",
      "Serious Progress",
      "You completed 15 workshop checkpoints.",
    );
  }
}

/* ==========================
   KEYBOARD SHORTCUTS
   ========================== */

function setupKeyboardShortcuts() {
  document.addEventListener("keydown", (event) => {
    const isTyping =
      event.target.matches("input") ||
      event.target.matches("textarea") ||
      event.target.matches("select");

    if (isTyping) return;

    if (event.key === "1") {
      openPage("dashboard");
    }

    if (event.key === "2") {
      openPage("journey");
    }

    if (event.key === "3") {
      openPage("day-one");
    }

    if (event.key === "4") {
      openPage("day-two");
    }

    if (event.key === "n" || event.key === "N") {
      openPage("notebook");
    }

    if (event.key === "/" && byId("globalSearch")) {
      event.preventDefault();
      byId("globalSearch").focus();
    }
  });
}

/* ==========================
   BUTTON SAFETY STATES
   ========================== */

function setupButtonSafety() {
  $$("button").forEach((button) => {
    button.addEventListener("click", () => {
      button.classList.add("button-clicked");

      setTimeout(() => {
        button.classList.remove("button-clicked");
      }, 180);
    });
  });
}

/* ==========================
   EMPTY LINK PROTECTION
   ========================== */

function setupEmptyLinkProtection() {
  $$('a[href="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
    });
  });
}

/* ==========================
   PAGE VISIT TRACKING
   ========================== */

function setupPageVisitTracking() {
  $$(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      const pageId = link.dataset.page;

      if (!pageId) return;

      addActivity("Page opened", getPageTitle(pageId));
    });
  });
}

/* ==========================
   FIRST VISIT STARTUP
   ========================== */

function setupFirstVisit() {
  if (appData.hasVisited) return;

  appData.hasVisited = true;

  addActivity("Workshop started", "Prompt Generator Companion v7.0 is ready.");

  showAchievementPopup(
    "💙 Welcome to the Workshop!",
    `First things first... relax. You don't have to figure everything out today. I'll guide you every step of the way, and before you know it, you'll be saying, "I really built this!"`,
  );

  saveAppData();
}

/* ==========================
   APP HEALTH CHECK
   ========================== */

function runAppHealthCheck() {
  const requiredIds = [
    "dashboard",
    "journey",
    "day-one",
    "day-two",
    "references",

    "publish",
    "sell",

    "notebook",
    "replays",

    "bonuses",
    "toast",
  ];

  const missing = requiredIds.filter((id) => !byId(id));

  if (missing.length) {
    console.warn("Missing required app IDs:", missing);
  } else {
    console.log("App health check passed.");
  }
}

/* ==========================
   FINAL UI REFRESH
   ========================== */

function refreshFullUI() {
  renderDashboard();
  updateCompletionButtonStates();
}

/* ==========================
   FINAL INIT
   ========================== */

function initializeFinalPolish() {
  runAppHealthCheck();

  setupChecklistAutosave();
  setupKeyboardShortcuts();
  setupButtonSafety();
  setupEmptyLinkProtection();
  setupPageVisitTracking();
  setupFirstVisit();
  refreshFullUI();

  console.log("Section 5 loaded: Certificate System + Final Polish");
}

/* ============================= */
/* FLIP CARD FUNCTIONALITY */
/* ============================= */

function initializeFlipCards() {
  document.addEventListener("click", function (event) {
    const card = event.target.closest(".flip-card");

    if (!card) return;

    if (
      event.target.closest(".copy-snippet-btn") ||
      event.target.closest(".copy-btn") ||
      event.target.closest("button") ||
      event.target.closest("a") ||
      event.target.closest("input") ||
      event.target.closest("textarea")
    ) {
      return;
    }

    card.classList.toggle("is-flipped");
  });
}
function setupLaunchChecklistCard() {
  const card = document.querySelector(".launch-checklist-card");

  if (!card) return;

  const viewButton = card.querySelector(".launch-checklist-front .primary-btn");

  const backButton = card.querySelector(
    ".launch-checklist-back .secondary-btn",
  );

  viewButton?.addEventListener("click", () => {
    card.classList.add("is-flipped");
  });

  backButton?.addEventListener("click", () => {
    card.classList.remove("is-flipped");
  });
}

/* =========================================================
   DAY 2 — REUSABLE APP WELCOME PAGE MASTER PROMPT
   ========================================================= */

function setupReusableWelcomeMasterPrompt() {
  const promptBox = byId("reusableWelcomeMasterPrompt");
  const copyButton = byId("copyReusableWelcomePromptBtn");
  const downloadButton = byId("downloadReusableWelcomePromptBtn");

  if (!promptBox || !copyButton || !downloadButton) return;

  const defaultCopyText = "COPY HTML TEMPLATE";
  let copyResetTimer;

  copyButton.addEventListener("click", async () => {
    const copied = await copyText(promptBox.value, "HTML template copied!");

    if (!copied) return;

    window.clearTimeout(copyResetTimer);
    copyButton.textContent = "HTML COPIED";
    copyButton.classList.add("is-success");

    copyResetTimer = window.setTimeout(() => {
      copyButton.textContent = defaultCopyText;
      copyButton.classList.remove("is-success");
    }, 2000);
  });

  downloadButton.addEventListener("click", () => {
    const promptFile = new Blob([promptBox.value], {
      type: "text/html;charset=utf-8",
    });

    const downloadUrl = URL.createObjectURL(promptFile);
    const temporaryLink = document.createElement("a");

    temporaryLink.href = downloadUrl;
    temporaryLink.download = "reusable-app-welcome-page-template.html";

    document.body.appendChild(temporaryLink);
    temporaryLink.click();
    temporaryLink.remove();

    window.setTimeout(() => {
      URL.revokeObjectURL(downloadUrl);
    }, 1000);

    showToast("HTML template downloaded!");
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initializeCoreEngine();
  setupWorkshopLockPopup();
  initializeDashboardEngine();
  initializeProfileNotebookSettings();
  initializeDownloadsReplaysSearch();
  setupReferenceImageLibrary();
  initializeFlipCards();
  setupLaunchChecklistCard();
  setupReusableWelcomeMasterPrompt();
  initializeFinalPolish();

  console.log("Prompt Generator Companion fully initialized.");
});
