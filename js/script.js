/* =========================================================
   AI BUSINESS BUILDER™ — SCRIPT.JS v7.0
   SECTION 1: CORE ENGINE
   Paste this at the very top of js/script.js
   ========================================================= */

"use strict";

/* ==========================
   APP CONFIG
   ========================== */

const APP_CONFIG = {
  version: "7.0",
  storageKey: "aiBusinessBuilder_v7",
  defaultPage: "dashboard",
  toastDuration: 1800,
};

/* ==========================
   DEFAULT APP DATA
   ========================== */

const DEFAULT_APP_DATA = {
  profile: {
    name: "Builder",
    email: "",
  },

  progress: {
    dayOneComplete: false,
    dayTwoComplete: false,
    journeySteps: {
      blueprint: false,
      dayOne: false,
      modules: false,
      publish: false,
      sell: false,
    },
  },

  notes: {
    ideas: "",
    categories: "",
    html: "",
    css: "",
    javascript: "",
    modules: "",
    publish: "",
    selling: "",
  },

  settings: {
    theme: "dark",
    accent: "blue-gold",
  },

  achievements: [],

  activity: [],
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
  saveAppData();

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

  if (!popup) return;

  if (popupTitle) popupTitle.textContent = title;
  if (popupText) popupText.textContent = description || "Your progress has been saved.";

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

function setupRouter() {
  $$(".nav-link").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();

      const pageId = link.dataset.page;

      if (pageId) {
        openPage(pageId);
      }
    });
  });

  $$("[data-open-page]").forEach((button) => {
    button.addEventListener("click", () => {
      const pageId = button.dataset.openPage;

      if (pageId) {
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
 "use strict";

const snippets = {

foundation: `You are an expert HTML, CSS, JavaScript, UI/UX, and prompt engineering developer specializing in building professional AI prompt generators.

Throughout this entire project, act as my senior software engineer and development partner.

We are building one complete, production-quality AI Marketing Machine that will be used as the foundation for a workshop where students learn to build and sell AI prompt generators.

Your responsibilities throughout this project are:

• Build clean, organized, maintainable code.
• Use HTML, CSS, and JavaScript.
• Keep the application as a single-page web application unless I specifically request otherwise.
• Make every feature fully functional.
• Build real functionality, never placeholder features.
• Integrate new features into the existing application without breaking previous functionality.
• Never remove, rename, or redesign existing features unless I specifically request it.
• Think ahead so the application can easily grow with future modules.
• Follow modern front-end development best practices.
• Write production-quality code suitable for real customers.
• If a better implementation exists, recommend it before writing code.
• When generating code, output complete working code instead of partial examples whenever possible.
• If the requested code is too large for one response, divide it into clearly labeled parts that can be copied directly into the project without breaking existing functionality.
• Preserve consistency in naming, formatting, IDs, classes, and JavaScript structure throughout the project.
• Assume every feature will eventually be sold as part of a premium product.

The AI Marketing Machine should generate complete marketing assets from one set of user inputs, including:

• Master AI Prompt
• Video Scripts
• Image Prompts
• Thumbnail Prompts
• Blog Content
• Email Campaigns
• Social Media Content
• SEO Content
• Hashtags
• Sales Copy
• Landing Pages
• Custom GPT Instructions
• Music Prompts
• Lead Magnets
• Additional marketing assets as requested.

Do not redesign the application.

Do not change the project direction.

Do not generate anything yet.

Wait for my next prompt and complete only the specific task I request.`,

planner: `You are an expert software architect, front-end developer, UI/UX designer, and prompt engineering specialist.

The AI Developer Foundation has already been established.

We are building one complete, production-quality AI Marketing Machine using HTML, CSS, and JavaScript.

Your task is to create the complete development blueprint for this application before any code is written.

Design the application as a premium, single-page AI prompt generator that users can customize and resell.

Create the complete project blueprint.

Include:

1. Application Overview
   • Purpose
   • Target Audience
   • Primary Goal

2. Generator Workflow
   • How users move through the application from start to finish.

3. Generator Sections
   • Every major section of the application in the order they should appear.

4. User Inputs
   • Every dropdown
   • Text field
   • Textarea
   • Chip group
   • Toggle
   • Lock button
   • Randomize support
   • Preset support

5. Generator Outputs

The generator should be capable of producing:

• Master AI Prompt
• Video Script
• Image Prompt
• Thumbnail Prompt
• Blog Content
• Email Campaign
• Facebook Post
• Instagram Caption
• TikTok Caption
• Pinterest Pin
• LinkedIn Post
• X Thread
• SEO Keywords
• Hashtags
• Call-to-Action Variations
• Landing Page Prompt
• Sales Page Prompt
• Lead Magnet Ideas
• Custom GPT Instructions
• Suno Music Prompt

6. Interactive Features

Include:

• Generate
• Randomize
• Lock Fields
• Clear All
• Copy Prompt
• Save Prompt
• Prompt History
• Prompt Variations
• Prompt Quality Checker

7. Future Expansion

Design the architecture so additional modules can be added later without changing the existing application structure.

Do NOT generate HTML.

Do NOT generate CSS.

Do NOT generate JavaScript.

Only create the complete development blueprint.

Wait for my approval before moving to the Layout Builder.`,

layout: `You are an expert UI/UX designer, senior front-end developer, and application architect specializing in professional AI prompt generators.

The AI Developer Foundation and Generator Planner have already been completed and approved.

We are building a premium single-page AI Marketing Machine using HTML, CSS, and JavaScript.

Your task is to design the complete user interface before any HTML, CSS, or JavaScript is written.

The application should feel like premium software that someone would confidently pay for.

Create the complete layout blueprint.

Include the following:

## 1. Overall Application Layout

Design the overall page structure including:

• Header
• Hero section
• Generator workspace
• Footer

## 2. Generator Sections

List every major section in the exact order users should experience them.

Include:

• Welcome / Hero
• Presets
• Main Controls
• Generator Categories
• Prompt Output
• Prompt Variations
• Prompt History
• Quality Checker
• Footer

## 3. Main Controls

Include:

• Generate Prompt
• Randomize
• Clear All
• Copy Prompt
• Save Prompt

## 4. Category Sections

Design collapsible sections.

Each section should support:

• Dropdowns
• Chip Buttons
• Custom Text Box
• Lock Button

## 5. Prompt Output Area

Design an area for:

• Final Prompt
• Copy Button
• Character Count
• Prompt Quality Score

## 6. Prompt Variations

Create a section where multiple prompt variations can appear.

Each variation should include its own Copy button.

## 7. Prompt History

Design a history section that stores previously generated prompts.

Each saved prompt should include:

• Preview
• Date Created
• Copy Button
• Delete Button

## 8. User Experience

Recommend the best workflow from opening the generator until copying the finished prompt.

## 9. Visual Design

Recommend:

• Layout
• Card design
• Typography
• Colors
• Buttons
• Spacing
• Hover effects
• Mobile responsiveness

The interface should feel:

• Premium
• Clean
• Modern
• Beginner Friendly
• Easy to Expand

Do NOT generate HTML.

Do NOT generate CSS.

Do NOT generate JavaScript.

Only create the complete Layout Blueprint.

Wait for my approval before moving to the Category Builder.`,

categories: `You are an expert prompt engineer, prompt architect, and AI generator designer.

The AI Developer Foundation, Generator Planner, and Layout Blueprint have already been completed and approved.

We are building a premium single-page AI Marketing Machine using HTML, CSS, and JavaScript.

Your task is to design every category the generator will contain before any code is written.

The categories should work together to produce complete AI-powered marketing assets from one set of user inputs.

For every category, include:

• Category Name
• Purpose
• Input Type
• Whether it uses:
  - Dropdown
  - Chip Buttons
  - Multi-Select Chips
  - Text Box
  - Textarea
• Recommended Options
• Custom Text Support
• Lock Button Support
• Randomize Support
• Preset Support
• Clear All Support

Every category that contains selectable options must begin with:

None

Organize the categories in the exact order users should complete them.

The generator should include categories such as:

• Business Information
• Product or Service
• Target Audience
• Marketing Goal
• Platform
• Brand Voice
• Tone
• Writing Style
• Offer
• Call-to-Action
• Keywords
• SEO
• Video Settings
• Image Settings
• Thumbnail Settings
• Music Settings
• Custom GPT Settings
• Advanced Prompt Options

For every category, explain:

• Why it exists
• How it improves the final prompt
• Any dependencies on previous categories

Design the category system so it is:

• Beginner Friendly
• Professional
• Easy to Expand
• Reusable for future generators

Do NOT generate HTML.

Do NOT generate CSS.

Do NOT generate JavaScript.

Only create the complete Category Blueprint.

Wait for my approval before moving to the Input Builder.`,

inputs: `You are an expert front-end application architect, UI designer, and prompt engineering specialist.

The AI Developer Foundation, Generator Planner, Layout Blueprint, and Category Blueprint have already been completed and approved.

We are building a premium single-page AI Marketing Machine using HTML, CSS, and JavaScript.

Your task is to design every input required for every category before any HTML, CSS, or JavaScript is written.

For each category, create a complete input blueprint.

Include:

1. Input ID
2. Display Label
3. Input Type
   • Dropdown
   • Chip Button
   • Multi-Select Chips
   • Text Box
   • Textarea
4. Placeholder Text
5. Default Value
6. Validation Rules
7. Required or Optional
8. Lock Support
9. Randomize Support
10. Preset Support
11. Clear All Support
12. Custom Text Support
13. Character Limits if needed
14. Dependencies on Other Inputs

For every dropdown or selectable list:

• The first option must always be "None."
• Recommend the ideal number of options.
• Keep options organized alphabetically whenever appropriate.

For every text input include:

• Placeholder text
• Maximum recommended length
• Validation recommendations
• Examples of user input

Design the input system so it is:

• Easy for beginners
• Consistent across every category
• Scalable for future updates
• Easy to implement with HTML, CSS, and JavaScript

Do NOT generate HTML.

Do NOT generate CSS.

Do NOT generate JavaScript.

Only create the complete Input Builder Blueprint.

Wait for my approval before moving to the Logic Builder.`,

logic: `You are an expert software architect, front-end developer, and JavaScript engineer specializing in professional AI prompt generators.

The AI Developer Foundation, Generator Planner, Layout Blueprint, Category Blueprint, and Input Builder have already been completed and approved.

We are building a premium single-page AI Marketing Machine using HTML, CSS, and JavaScript.

Your task is to design the complete application logic before any JavaScript is written.

Create the complete Logic Blueprint.

Include:

1. Application Workflow
• Complete user flow from opening the generator until copying the finished prompt.

2. Generate Prompt Logic
• How every input should be collected.
• How the final prompt should be assembled.
• How missing values should be handled.

3. Randomize Logic
• Randomize only unlocked fields.
• Skip locked fields.
• Skip custom user text.
• Produce useful combinations.

4. Lock Logic
• Explain how locked fields behave.
• Explain how they interact with Randomize, Presets, and Clear All.

5. Preset Logic
• How presets populate fields.
• How users can switch between presets.
• How presets interact with locked fields.

6. Clear All Logic
• Reset every unlocked field.
• Preserve locked values.
• Reset custom text where appropriate.

7. Copy Logic
Design copy functionality for:

• Final Prompt
• Prompt Variations
• Prompt History

8. Save Prompt Logic

Explain how prompts should be stored locally.

Include:

• Date Created
• Prompt Preview
• Full Prompt
• Delete Function

9. Prompt Variations

Explain how the generator should create multiple useful prompt variations from the same inputs.

10. Prompt Quality Checker

Design a scoring system that evaluates:

• Completeness
• Clarity
• Detail
• Readability
• Missing Information

11. Validation Rules

Explain how the generator should prevent:

• Empty prompts
• Duplicate information
• Invalid selections
• Conflicting inputs

12. Error Handling

Describe how the application should respond to:

• Missing required inputs
• Invalid data
• Empty output
• Copy failures
• Save failures

13. Future Expansion

Design the logic so additional categories and modules can be added later without rewriting the application.

Do NOT generate HTML.

Do NOT generate CSS.

Do NOT generate JavaScript.

Only create the complete Logic Blueprint.

Wait for my approval before moving to the Prompt Assembly Builder.`,

assembly: `You are an expert prompt engineer and AI prompt architect specializing in professional AI prompt generators.

The AI Developer Foundation, Generator Planner, Layout Blueprint, Category Blueprint, Input Builder, and Logic Blueprint have already been completed and approved.

We are building a premium single-page AI Marketing Machine using HTML, CSS, and JavaScript.

Your task is to design the complete Prompt Assembly system before any JavaScript is written.

The Prompt Assembly system is responsible for transforming every user selection into one polished, professional AI prompt.

Create the complete Prompt Assembly Blueprint.

Include:

1. Final Prompt Structure

Design the overall structure of the finished prompt.

Include:

• Opening instruction
• Context
• User selections
• Custom user input
• Quality instructions
• Output instructions

2. Category Assembly

Explain how each category should be inserted into the final prompt.

3. Custom Text Handling

Explain how custom user text should override or supplement selected options.

4. "None" Handling

Ignore every field where the user selected "None."

Do not include unnecessary placeholders.

5. Locked Fields

Explain how locked fields remain unchanged during prompt generation and randomization.

6. Randomized Fields

Explain how randomized selections should be merged into the final prompt without creating conflicts.

7. Preset Integration

Describe how presets populate the final prompt while still allowing users to customize individual sections.

8. Prompt Variations

Explain how the generator should automatically create multiple high-quality variations of the finished prompt.

9. Duplicate Prevention

Prevent repeated wording, conflicting instructions, and duplicate information.

10. Prompt Formatting

Ensure the final prompt is:

• Clear
• Professional
• Organized
• Easy for AI to understand
• Ready to copy and paste

11. Scalability

Design the assembly system so future categories and modules can be added without rebuilding the existing prompt structure.

Do NOT generate HTML.

Do NOT generate CSS.

Do NOT generate JavaScript.

Only create the complete Prompt Assembly Blueprint.

Wait for my approval before moving to the HTML Builder.`,


htmlPart1: `You are an expert HTML developer and front-end application architect.

The AI Developer Foundation, Generator Planner, Layout Blueprint, Category Blueprint, Input Builder, Logic Blueprint, and Prompt Assembly Blueprint have all been completed and approved.

Your task is to build the COMPLETE external index.html file.

Output ONLY HTML code.

Build the file in multiple parts.

Generate Part 1.

Include:

• DOCTYPE
• html opening tag
• head section
• meta tags
• page title
• stylesheet link
• script.js link with defer
• body opening tag
• application wrapper
• header
• hero section
• introduction
• opening of the generator workspace

Do NOT generate CSS.

Do NOT generate JavaScript.

Stop after the opening of the main generator workspace.`,

htmlPart2: `Generate Part 2 of the external index.html file.

Output ONLY HTML code.

Continue from Part 1.

Do NOT repeat previous code.

Build:

• Preset section
• Main control buttons
• Generate button
• Randomize button
• Copy button
• Save button
• Clear button
• All collapsible generator category sections
• Dropdown placeholders
• Chip button placeholders
• Text boxes
• Textareas
• Lock buttons

Do NOT generate CSS.

Do NOT generate JavaScript.

Stop after the final generator category section.`,

htmlPart3: `Generate Part 3 of the external index.html file.

Output ONLY HTML code.

Continue from Part 2.

Do NOT repeat previous code.

Build:

• Final Prompt Output section
• Prompt Variations section
• Prompt History section
• Prompt Quality Checker
• Footer
• Closing main tag
• Closing wrapper
• Closing body tag
• Closing html tag

Do NOT generate CSS.

Do NOT generate JavaScript.`,

cssPart1: `You are an expert CSS developer and UI designer.

The HTML structure for the AI Marketing Machine has been completed.

Your task is to build the COMPLETE external style.css file.

Output ONLY CSS code.

Generate Part 1.

Build:

• CSS variables
• Color palette
• Reset
• Base typography
• Body styles
• Utility classes
• Global layout

Use a luxury visual style with:

• Royal Blue
• Gold
• Black
• Subtle White

Do NOT generate HTML.

Do NOT generate JavaScript.`,

cssPart2: `Generate Part 2 of the external style.css file.

Output ONLY CSS code.

Continue from Part 1.

Do NOT repeat previous code.

Build:

• Header
• Hero section
• Generator workspace
• Cards
• Section titles
• Navigation
• Layout containers

Do NOT generate HTML.

Do NOT generate JavaScript.`,

cssPart3: `Generate Part 3 of the external style.css file.

Output ONLY CSS code.

Continue from Part 2.

Do NOT repeat previous code.

Build:

• Buttons
• Dropdowns
• Text inputs
• Textareas
• Chip buttons
• Lock buttons
• Preset buttons
• Generate button
• Randomize button
• Copy button
• Save button
• Clear button

Do NOT generate HTML.

Do NOT generate JavaScript.`,

cssPart4: `Generate Part 4 of the external style.css file.

Output ONLY CSS code.

Continue from Part 3.

Do NOT repeat previous code.

Build:

• Prompt Output area
• Prompt Variations
• Prompt History
• Quality Checker
• Toast notifications
• Modal styles
• Loading states

Do NOT generate HTML.

Do NOT generate JavaScript.`,

cssPart5: `Generate Part 5 of the external style.css file.

Output ONLY CSS code.

Continue from Part 4.

Do NOT repeat previous code.

Build:

• Footer
• Tablet responsive styles
• Mobile responsive styles
• Animations
• Hover effects
• Focus states
• Scrollbar styling
• Final polish

The finished interface should feel like premium software.

Do NOT generate HTML.

Do NOT generate JavaScript.`,


jsPart1: `You are an expert JavaScript developer and front-end application architect.

The HTML and CSS for the AI Marketing Machine have already been completed.

Your task is to build the COMPLETE external script.js file.

Output ONLY JavaScript code.

Generate Part 1.

Build:

• "use strict"
• Application constants
• Global variables
• Default data
• Local Storage keys
• Category data structures
• Preset data structures
• DOM selector helpers

Do NOT generate HTML.

Do NOT generate CSS.`,

jsPart2: `Generate Part 2 of the external script.js file.

Output ONLY JavaScript code.

Continue from Part 1.

Do NOT repeat previous code.

Build:

• Helper functions
• Dropdown helpers
• Chip button helpers
• Text input helpers
• Textarea helpers
• Lock state helpers
• Validation helpers
• Utility functions

Do NOT generate HTML.

Do NOT generate CSS.`,

jsPart3: `Generate Part 3 of the external script.js file.

Output ONLY JavaScript code.

Continue from Part 2.

Do NOT repeat previous code.

Build:

• Generate Prompt function
• Prompt Assembly function
• Ignore "None" selections
• Merge custom user text
• Prevent duplicate information
• Format the final prompt

Do NOT generate HTML.

Do NOT generate CSS.`,

jsPart4: `Generate Part 4 of the external script.js file.

Output ONLY JavaScript code.

Continue from Part 3.

Do NOT repeat previous code.

Build:

• Randomize function
• Lock support
• Preset support
• Clear All
• Copy Prompt
• Save Prompt
• Delete Saved Prompt
• Local Storage integration

Do NOT generate HTML.

Do NOT generate CSS.`,

jsPart5: `Generate Part 5 of the external script.js file.

Output ONLY JavaScript code.

Continue from Part 4.

Do NOT repeat previous code.

Build:

• Prompt History
• Prompt Variations
• Prompt Quality Checker
• Character Counter
• Toast Notifications
• Modal support
• Error handling

Do NOT generate HTML.

Do NOT generate CSS.`,

jsPart6: `Generate Part 6 of the external script.js file.

Output ONLY JavaScript code.

Continue from Part 5.

Do NOT repeat previous code.

Build:

• Event listeners
• Button connections
• Collapsible sections
• Scroll buttons
• Application initialization
• Startup functions
• Final application checks

Ensure every feature works together correctly.

The finished application should be production-ready, responsive, maintainable, and easy to expand.

Do NOT generate HTML.

Do NOT generate CSS.`,

testing: `You are an expert front-end QA engineer, JavaScript debugger, and HTML/CSS application tester.

The AI Marketing Machine has been fully built.

Your task is to perform a complete quality assurance review before deployment.

Create a complete testing checklist.

Include:

1. HTML Validation
2. CSS Validation
3. JavaScript Validation
4. Responsive Testing
5. Browser Compatibility
6. Accessibility
7. Performance
8. Button Testing
9. Form Testing
10. Prompt Generation Testing
11. Randomize Testing
12. Lock Button Testing
13. Preset Testing
14. Copy Button Testing
15. Save Prompt Testing
16. Prompt History Testing
17. Prompt Quality Checker Testing
18. Error Handling
19. Final Bug Checklist

Do NOT generate HTML.

Do NOT generate CSS.

Do NOT generate JavaScript.

Only create the complete Testing & Debugging checklist.

Wait for my approval before moving to Final Polish & Export.`,

final: `You are an expert front-end developer, UI designer, and software release specialist.

The AI Marketing Machine has been completely built and tested.

Your task is to prepare the application for release.

Create the complete Final Polish & Export checklist.

Include:

1. UI Review
2. Code Cleanup
3. Performance Improvements
4. Accessibility Review
5. Responsive Review
6. Final Feature Checklist
7. File Organization
8. GitHub Preparation
9. Netlify Deployment
10. Customer Readiness
11. Future Update Recommendations

The application should be production-ready and suitable for customers.

Do NOT generate HTML.

Do NOT generate CSS.

Do NOT generate JavaScript.

Only create the complete Final Polish & Export checklist.`
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

  openPage(appData.lastPage || APP_CONFIG.defaultPage);

  updateAchievementCount();

  console.log(`AI Business Builder v${APP_CONFIG.version} core loaded.`);
}

document.addEventListener("DOMContentLoaded", initializeCoreEngine);

/* =========================================================
   SECTION 2: DASHBOARD + PROGRESS ENGINE
   Paste directly under Section 1
   ========================================================= */

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
      `${formatStepName(stepName)} was marked complete.`
    );

    saveAppData();
    renderDashboard();
    updateProgressUI();
  }
}

function formatStepName(stepName) {
  const labels = {
    blueprint: "Generator Blueprint",
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
  if (dashboardStatsProgress) dashboardStatsProgress.textContent = `${percent}%`;

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

  if (!steps.blueprint) {
    return "Start with the Generator Blueprint so the product has a clear purpose.";
  }

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

  if (!steps.blueprint) return "blueprint";
  if (!steps.dayOne) return "day-one";
  if (!steps.modules) return "modules";
  if (!steps.publish) return "publish";
  if (!steps.sell) return "sell";

  return "certificate";
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

      addActivity(
        "Continued workshop",
        `Opened ${getPageTitle(nextPage)}.`
      );
    });
  });
}

function getPageTitle(pageId) {
  const labels = {
    dashboard: "Command Center",
    journey: "Workshop Journey",
    "day-one": "Day 1",
    "day-two": "Day 2",
    blueprint: "Generator Blueprint",
    modules: "AI Modules",
    "code-lab": "Code Lab",
    publish: "GitHub + Netlify",
    sell: "Sell Your Generator",
    downloads: "Downloads",
    notebook: "Notebook",
    replays: "Replay Library",
    help: "Help Center",
    certificate: "Certificate",
    settings: "Settings",
  };

  return labels[pageId] || pageId;
}

/* ==========================
   DASHBOARD QUICK ACTION TRACKING
   ========================== */

function setupDashboardTracking() {
  $$("[data-open-page]").forEach((button) => {
    button.addEventListener("click", () => {
      const pageId = button.dataset.openPage;

      if (!pageId) return;

      if (pageId === "blueprint") {
        markJourneyStepComplete("blueprint");
      }

      if (pageId === "modules") {
        markJourneyStepComplete("modules");
      }

      if (pageId === "publish") {
        markJourneyStepComplete("publish");
      }

      if (pageId === "sell") {
        markJourneyStepComplete("sell");
      }
    });
  });
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
        "You built the generator foundation."
      );

      saveAppData();
      renderDashboard();
      showToast("Day 1 marked complete.");
    });
  }

  if (dayTwoBtn) {
    dayTwoBtn.addEventListener("click", () => {
      appData.progress.dayTwoComplete = true;

      markJourneyStepComplete("modules");
      markJourneyStepComplete("publish");
      markJourneyStepComplete("sell");

      unlockAchievement(
        "day-two-complete",
        "Day 2 Complete",
        "You added modules, published, and prepared your generator to sell."
      );

      if (isWorkshopComplete()) {
        unlockAchievement(
          "workshop-complete",
          "Workshop Complete",
          "Your AI Business Builder certificate is unlocked."
        );
      }

      saveAppData();
      renderDashboard();
      showToast("Day 2 marked complete.");
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
    dayOneBtn.disabled = true;
    dayOneBtn.classList.add("is-complete");
  }

  if (dayTwoBtn && appData.progress.dayTwoComplete) {
    dayTwoBtn.textContent = "Day 2 Complete";
    dayTwoBtn.disabled = true;
    dayTwoBtn.classList.add("is-complete");
  }
}

/* ==========================
   SECTION 2 INIT
   ========================== */

function initializeDashboardEngine() {
  setupContinueButtons();
  setupDashboardTracking();
  setupDayCompletionButtons();
  updateCompletionButtonStates();
  renderDashboard();

  console.log("Section 2 loaded: Dashboard + Progress Engine");
}

document.addEventListener("DOMContentLoaded", initializeDashboardEngine);

/* =========================================================
   SECTION 3: NOTEBOOK + PROFILE + SETTINGS
   Paste directly under Section 2
   ========================================================= */

/* ==========================
   NOTEBOOK SYSTEM
   ========================== */

function setupNotebook() {
  const noteCategory = byId("noteCategory");
  const mainNote = byId("mainNote");
  const exportNotesBtn = byId("exportNotesBtn");

  if (!noteCategory || !mainNote) return;

  function loadCurrentNote() {
    const category = noteCategory.value;

    mainNote.value = appData.notes[category] || "";
  }

  noteCategory.addEventListener("change", loadCurrentNote);

  mainNote.addEventListener("input", () => {
    const category = noteCategory.value;

    appData.notes[category] = mainNote.value;
    saveAppData();
  });

  if (exportNotesBtn) {
    exportNotesBtn.addEventListener("click", exportNotes);
  }

  loadCurrentNote();
}

function exportNotes() {
  const text = Object.entries(appData.notes)
    .map(([category, content]) => {
      return `# ${formatNotebookCategory(category)}\n\n${content || "No notes yet."}`;
    })
    .join("\n\n------------------------------\n\n");

  downloadTextFile("ai-business-builder-notes.txt", text);

  addActivity("Notes exported", "Notebook notes were downloaded.");
  showToast("Notes exported.");
}

function formatNotebookCategory(category) {
  const labels = {
    ideas: "Generator Ideas",
    categories: "Category Ideas",
    html: "HTML Notes",
    css: "CSS Notes",
    javascript: "JavaScript Notes",
    modules: "AI Module Notes",
    publish: "GitHub + Netlify Notes",
    selling: "Selling Notes",
  };

  return labels[category] || category;
}

/* ==========================
   DAY 1 WORKSHOP NOTEBOX
   ========================== */

function setupDayOneInlineNotes() {
  const dayOneNotes = document.querySelector("#day-one .note-editor");

  if (!dayOneNotes) return;

  dayOneNotes.value = appData.notes.dayOneWorkshop || "";

  dayOneNotes.addEventListener("input", () => {
    appData.notes.dayOneWorkshop = dayOneNotes.value;
    saveAppData();
  });
}

/* ==========================
   PROFILE SYSTEM
   ========================== */

function setupProfile() {
  const nameInput = byId("studentNameInput");
  const emailInput = byId("studentEmailInput");
  const saveProfileBtn = byId("saveProfileBtn");

  if (nameInput) {
    nameInput.value = appData.profile.name || "";
  }

  if (emailInput) {
    emailInput.value = appData.profile.email || "";
  }

  if (!saveProfileBtn) return;

  saveProfileBtn.addEventListener("click", () => {
    const name = nameInput ? nameInput.value.trim() : "";
    const email = emailInput ? emailInput.value.trim() : "";

    appData.profile.name = name || "Builder";
    appData.profile.email = email;

    saveAppData();
    updateCertificateName();

    addActivity(
      "Profile saved",
      `${appData.profile.name}'s student profile was updated.`
    );

    unlockAchievement(
      "profile-saved",
      "Profile Saved",
      "Your builder profile is ready."
    );

    showToast("Profile saved.");
  });
}

/* ==========================
   CERTIFICATE NAME SUPPORT
   ========================== */

function updateCertificateName() {
  const certificateName = byId("certificateName");

  if (certificateName) {
    certificateName.textContent = appData.profile.name || "Builder";
  }

  const certificateDate = byId("certificateDate");

  if (certificateDate) {
    certificateDate.textContent = new Date().toLocaleDateString(undefined, {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }
}

/* ==========================
   THEME SYSTEM
   ========================== */

function setupThemeSettings() {
  const themeSelect = byId("themeSelect");
  const accentSelect = byId("accentSelect");

  applyTheme();

  if (themeSelect) {
    themeSelect.value = appData.settings.theme || "dark";

    themeSelect.addEventListener("change", () => {
      appData.settings.theme = themeSelect.value;
      saveAppData();
      applyTheme();

      addActivity(
        "Theme updated",
        `Theme changed to ${themeSelect.value}.`
      );

      showToast("Theme updated.");
    });
  }

  if (accentSelect) {
    accentSelect.value = appData.settings.accent || "blue-gold";

    accentSelect.addEventListener("change", () => {
      appData.settings.accent = accentSelect.value;
      saveAppData();
      applyAccent();

      addActivity(
        "Accent updated",
        `Accent changed to ${accentSelect.value}.`
      );

      showToast("Accent updated.");
    });
  }
}

function applyTheme() {
  const theme = appData.settings.theme || "dark";

  document.body.classList.toggle("light-theme", theme === "light");

  const themeSelect = byId("themeSelect");

  if (themeSelect) {
    themeSelect.value = theme;
  }

  applyAccent();
}

function applyAccent() {
  const accent = appData.settings.accent || "blue-gold";

  document.body.classList.remove("accent-blue-gold", "accent-black-gold");
  document.body.classList.add(`accent-${accent}`);

  const accentSelect = byId("accentSelect");

  if (accentSelect) {
    accentSelect.value = accent;
  }
}

/* ==========================
   EXPORT / IMPORT DATA
   ========================== */

function setupDataTools() {
  const exportDataBtn = byId("exportDataBtn");
  const importDataBtn = byId("importDataBtn");
  const importDataFile = byId("importDataFile");
  const resetDataBtn = byId("resetDataBtn");

  if (exportDataBtn) {
    exportDataBtn.addEventListener("click", exportBackupData);
  }

  if (importDataBtn && importDataFile) {
    importDataBtn.addEventListener("click", () => {
      importDataFile.click();
    });

    importDataFile.addEventListener("change", importBackupData);
  }

  if (resetDataBtn) {
    resetDataBtn.addEventListener("click", handleResetData);
  }
}

function exportBackupData() {
  const backup = {
    app: "AI Business Builder",
    version: APP_CONFIG.version,
    exportedAt: new Date().toISOString(),
    data: appData,
  };

  downloadTextFile(
    "ai-business-builder-backup.json",
    JSON.stringify(backup, null, 2)
  );

  addActivity("Backup exported", "Workshop data backup was downloaded.");
  showToast("Backup exported.");
}

function importBackupData(event) {
  const file = event.target.files[0];

  if (!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      const importedData = parsed.data || parsed;

      appData = deepMerge(DEFAULT_APP_DATA, importedData);
      saveAppData();

      addActivity("Backup imported", "Workshop data was restored from backup.");
      showToast("Backup imported.");

      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (error) {
      console.error(error);
      showToast("Import failed.");
    }
  };

  reader.readAsText(file);
}

function handleResetData() {
  const confirmReset = window.confirm(
    "This will erase profile, notes, progress, achievements, and settings. Reset everything?"
  );

  if (!confirmReset) return;

  resetAppData();
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
    type: "text/plain;charset=utf-8",
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
   CERTIFICATE PRINT
   ========================== */

function setupCertificatePrint() {
  const printCertificateBtn = byId("printCertificateBtn");

  if (!printCertificateBtn) return;

  printCertificateBtn.addEventListener("click", () => {
    updateCertificateName();
    window.print();
  });
}

/* ==========================
   SECTION 3 INIT
   ========================== */

function initializeProfileNotebookSettings() {
  setupNotebook();
  setupDayOneInlineNotes();
  setupProfile();
  setupThemeSettings();
  setupDataTools();
  setupCertificatePrint();
  updateCertificateName();

  console.log("Section 3 loaded: Notebook + Profile + Settings");
}

document.addEventListener("DOMContentLoaded", initializeProfileNotebookSettings);

/* =========================================================
   SECTION 4: DOWNLOADS + REPLAYS + SEARCH
   Paste directly under Section 3
   ========================================================= */

/* ==========================
   DOWNLOAD RESOURCE CONTENT
   ========================== */

const DOWNLOAD_RESOURCES = {
  "master-blueprint": {
    filename: "ai-business-builder-planning-sheet.txt",
    title: "AI Business Builder Planning Sheet",
    content: `
AI BUSINESS BUILDER™ PLANNING SHEET

1. PRODUCT NAME
Write the name of your generator:


2. TARGET AUDIENCE
Who is this generator for?


3. PROBLEM IT SOLVES
What does your audience struggle with?


4. MAIN PROMISE
After using this generator, the buyer can:


5. CORE INPUTS
Choose the dropdown/input fields your generator needs:

- Business type:
- Audience:
- Tone:
- Platform:
- Output type:
- Style:
- Goal:

6. CORE OUTPUTS
What should the generator create?

- AI image prompt
- Video script
- Marketing caption
- Email copy
- Product description
- Custom GPT instructions
- Sales page copy
- Lead magnet outline

7. SELLING ANGLE
Why would someone buy this instead of making it themselves?


8. CUSTOMIZATION IDEAS
How can you reuse this generator for other niches?


9. FINAL CHECK
- Does it solve a clear problem?
- Is it easy to use?
- Does it create useful outputs?
- Can someone understand it without you explaining it?
`.trim(),
  },

  "html-starter": {
    filename: "starter-code-pack.txt",
    title: "Starter Code Pack",
    content: `
STARTER CODE PACK

HTML STARTER
------------------------------
<main class="generator">
  <h1>AI Business Builder</h1>
  <p>Generate business assets in seconds.</p>

  <label for="businessType">Business Type</label>
  <select id="businessType">
    <option>Beauty Brand</option>
    <option>Coaching Business</option>
    <option>Digital Product Shop</option>
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

      addActivity(
        "Downloaded resource",
        `${resource.title} was downloaded.`
      );

      unlockAchievement(
        `download-${downloadKey}`,
        "Resource Downloaded",
        `${resource.title} is ready to use.`
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
    page: "day-one",
  },

  day2: {
    title: "Day 2 Replay",
    message:
      "Day 2 replay is where students review premium modules, GitHub, Netlify, product packaging, and launch strategy.",
    page: "day-two",
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

      openPage(replay.page);
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

    const match = searchIndex.find((item) => {
      return item.text.includes(query) || item.title.toLowerCase().includes(query);
    });

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

      const match = searchIndex.find((item) => {
        return item.text.includes(query) || item.title.toLowerCase().includes(query);
      });

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
   CODE LAB TRACKING
   ========================== */

function setupCodeLabTracking() {
  const codeCopyButtons = document.querySelectorAll(
    "#code-lab .copy-btn"
  );

  codeCopyButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const label = button.textContent.trim() || "Code copied";

      addActivity("Code copied", label);

      unlockAchievement(
        "code-lab-used",
        "Code Lab Used",
        "You copied starter code from the Code Lab."
      );
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
        "You copied a premium AI module prompt."
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
   SECTION 4 INIT
   ========================== */

function initializeDownloadsReplaysSearch() {
  setupDownloadButtons();
  setupReplayButtons();
  setupGlobalSearch();
  setupHelpTracking();
  setupCodeLabTracking();
  setupModuleTracking();
  injectSearchStyles();

  console.log("Section 4 loaded: Downloads + Replays + Search");
}

document.addEventListener("DOMContentLoaded", initializeDownloadsReplaysSearch);

/* =========================================================
   SECTION 5: CERTIFICATE SYSTEM + FINAL APP POLISH
   Paste directly under Section 4
   ========================================================= */

/* ==========================
   CERTIFICATE SYSTEM
   ========================== */

function setupCertificateSystem() {
  renderCertificateState();
  updateCertificateName();
}

function renderCertificateState() {
  const locked = byId("certificateLocked");
  const unlocked = byId("certificateUnlocked");

  if (!locked || !unlocked) return;

  if (isWorkshopComplete()) {
    locked.classList.add("hidden");
    unlocked.classList.remove("hidden");

    updateCertificateName();

    unlockAchievement(
      "certificate-unlocked",
      "Certificate Unlocked",
      "Your workshop certificate is ready."
    );
  } else {
    locked.classList.remove("hidden");
    unlocked.classList.add("hidden");
  }
}

function forceCertificateCheck() {
  updateProgressUI();
  renderCertificateState();
  updateCertificateStatusLabel();
}

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
        addActivity("Checklist updated", "A workshop checkpoint was completed.");
      }

      updateChecklistAchievements();
    });
  });
}

function getCheckboxKey(checkbox, index) {
  const page = checkbox.closest(".page");
  const section = checkbox.closest(".lesson-block, .card, article");
  const label = checkbox.parentElement?.textContent?.trim() || `checkbox-${index}`;

  const pageId = page?.id || "global";
  const sectionTitle =
    section?.querySelector("h2")?.textContent?.trim() || "section";

  return `${pageId}:${sectionTitle}:${label}`;
}

function updateChecklistAchievements() {
  const checkedCount = Object.values(appData.checklists || {}).filter(Boolean).length;

  if (checkedCount >= 3) {
    unlockAchievement(
      "three-checkpoints",
      "Momentum Started",
      "You completed your first 3 workshop checkpoints."
    );
  }

  if (checkedCount >= 8) {
    unlockAchievement(
      "eight-checkpoints",
      "Builder Mode",
      "You completed 8 workshop checkpoints."
    );
  }

  if (checkedCount >= 15) {
    unlockAchievement(
      "fifteen-checkpoints",
      "Serious Progress",
      "You completed 15 workshop checkpoints."
    );
  }
}

/* ==========================
   SMART COMPLETION WATCHER
   ========================== */

function setupCompletionWatcher() {
  document.addEventListener("click", () => {
    setTimeout(() => {
      forceCertificateCheck();
      updateCompletionButtonStates();
    }, 50);
  });

  document.addEventListener("input", () => {
    saveAppData();
  });
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

    if (event.key === "5") {
      openPage("blueprint");
    }

    if (event.key === "n" || event.key === "N") {
      openPage("notebook");
    }

    if (event.key === "/") {
      event.preventDefault();
      byId("globalSearch")?.focus();
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

      if (pageId === "blueprint") {
        markJourneyStepComplete("blueprint");
      }

      if (pageId === "publish") {
        markJourneyStepComplete("publish");
      }

      if (pageId === "sell") {
        markJourneyStepComplete("sell");
      }
    });
  });
}

/* ==========================
   FIRST VISIT STARTUP
   ========================== */

function setupFirstVisit() {
  if (appData.hasVisited) return;

  appData.hasVisited = true;

  addActivity(
    "Workshop started",
    "AI Business Builder v7.0 is ready."
  );

  unlockAchievement(
    "first-open",
    "Welcome Builder",
    "You opened the workshop companion."
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
    "blueprint",
    "modules",
    "code-lab",
    "publish",
    "sell",
    "downloads",
    "notebook",
    "replays",
    "help",
    "certificate",
    "settings",
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
  updateProgressUI();
  updateAchievementCount();
  updateCertificateName();
  renderCertificateState();
  updateCompletionButtonStates();
}

/* ==========================
   FINAL INIT
   ========================== */

function initializeFinalPolish() {
  runAppHealthCheck();
  setupCertificateSystem();
  setupChecklistAutosave();
  setupCompletionWatcher();
  setupKeyboardShortcuts();
  setupButtonSafety();
  setupEmptyLinkProtection();
  setupPageVisitTracking();
  setupFirstVisit();
  refreshFullUI();

  console.log("Section 5 loaded: Certificate System + Final Polish");
}

document.addEventListener("DOMContentLoaded", initializeFinalPolish);

function setupFlipCards() {
  document.querySelectorAll(".flip-card").forEach((card) => {
    card.addEventListener("click", (event) => {
      if (event.target.closest("button")) return;
      card.classList.toggle("is-flipped");
    });
  });
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

document.addEventListener("DOMContentLoaded", initializeFlipCards);