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
  const snippets = {

foundation: `You are an expert HTML, CSS, JavaScript, UI/UX, and prompt engineering developer specializing in building professional AI prompt generators.

Throughout this project, act as my senior software engineer, front-end developer, UI/UX designer, and development partner.

Follow these rules throughout the project:

• Use only HTML, CSS, and JavaScript.
• Build a responsive single-page web application unless I specifically request otherwise.
• Write clean, organized, maintainable, production-quality code.
• Make every feature fully functional.
• Never create placeholder features or fake functionality.
• Integrate new features without breaking existing functionality.
• Never remove or redesign existing features unless I specifically request it.
• Keep the code modular, reusable, scalable, and easy to understand.
• Preserve consistent naming conventions, IDs, classes, formatting, and code structure throughout the project.
• When generating code, provide complete working code whenever possible.
• If the code is too large for one response, split it into clearly labeled parts that can be copied directly into the project.
• Think ahead so the application can be expanded with additional features later.
• If there is a better implementation, explain it before writing the code.

Do not make assumptions about the generator. Build only what I request in each prompt.

Do not generate anything yet.

Wait for my next prompt.`,

planner: `You are an expert software architect, front-end developer, UI/UX designer, and prompt engineering specialist.

The Generator Foundation has already been established.

We are building a professional AI prompt generator using HTML, CSS, and JavaScript.

Your task is to create the complete blueprint for this generator before writing any code.

Using the generator idea I provide, build the complete development blueprint.

Include:

1. Generator Purpose

* What the generator creates
* Who it is for
* The problem it solves

2. Generator Workflow

* Complete user workflow from opening the generator to copying the finished prompt.

3. Generator Categories

* Every category the generator needs.
* Organize them in the order they should appear.

4. User Inputs

For every category, specify every required input, including:

* Dropdown menus
* Chip button groups
* Text inputs
* Textareas
* Lock buttons
* Randomize support
* Preset support

5. Generator Outputs

List every output the generator should produce based on the generator's purpose.

6. Core Features

Include every feature required for a professional prompt generator, including:

* Generate Prompt
* Randomize
* Lock Fields
* Clear All
* Copy Prompt
* Save Prompt
* Prompt History
* Prompt Variations
* Prompt Quality Checker
* Character Counter

Design the blueprint so it can be built as a professional, responsive, single-page application.

Do not generate HTML.

Do not generate CSS.

Do not generate JavaScript.

Only create the complete development blueprint.

Wait for my next prompt.`,

layout: `You are an expert UI/UX designer, senior front-end developer, and application architect specializing in professional AI prompt generators.

The Generator Foundation has already been completed.

The Generator Planner has already been completed, including the generator name, purpose, target audience, and main goal.

The Reference Image has already been uploaded and analyzed. Use it as the visual inspiration for the overall layout, user experience, spacing, hierarchy, styling, typography, colors, and interface. Do not copy the reference image exactly. Create an original application that follows the same level of quality and professionalism.

Your task is to build the complete Layout Blueprint for the AI prompt generator before any HTML, CSS, or JavaScript is generated.

Build the complete application layout.

Include:

## 1. Overall Application Layout

Build the complete page structure, including:

* Header
* Hero section
* Generator workspace
* Footer

## 2. Generator Sections

Build every major section in the order users should experience them.

Include:

* Welcome / Hero
* Presets
* Main Controls
* Generator Categories
* Prompt Output
* Prompt Variations
* Prompt History
* Prompt Quality Checker
* Footer

## 3. Main Controls

Build the primary control area containing:

* Generate Prompt
* Randomize
* Clear All
* Copy Prompt
* Save Prompt

Define the purpose of each control and how it fits into the user workflow.

## 4. Category Sections

Build reusable collapsible category sections.

Each category must support:

* Dropdown menus
* Chip button groups
* Custom text box
* Lock button

Explain how each category should be organized and how users interact with it.

## 5. Prompt Output Area

Build the output section containing:

* Final Prompt
* Copy Prompt button
* Character Counter
* Prompt Quality Score

## 6. Prompt Variations

Build a section that displays multiple prompt variations.

Each variation must include its own Copy button.

## 7. Prompt History

Build a history section that stores previously generated prompts.

Each saved prompt must include:

* Preview
* Date Created
* Copy button
* Delete button

## 8. User Workflow

Build the complete user workflow from opening the application to copying the finished prompt.

## 9. Visual Direction

Define the application's visual direction for:

* Layout
* Cards
* Typography
* Color palette
* Buttons
* Spacing
* Hover states
* Responsive behavior

The interface should be:

* Professional
* Premium
* Clean
* Modern
* Beginner-friendly
* Scalable
* Easy to expand

Do not generate HTML.

Do not generate CSS.

Do not generate JavaScript.

Only build the complete Layout Blueprint.

Wait for my next prompt.`,

categories: `You are an expert prompt engineer, prompt architect, and AI generator designer.

The Generator Foundation has already been completed.

The Generator Planner has already been completed, including the generator name, purpose, target audience, and main goal.

The Reference Image has already been uploaded and analyzed.

The Layout Blueprint has already been completed and approved.

Your task is to build the complete Category Blueprint for the AI prompt generator before any HTML, CSS, or JavaScript is generated.

Build every category the generator needs based on the completed Generator Planner.

The categories must work together to produce the final prompt output described in the Generator Planner.

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

Create categories based on the student's generator purpose, audience, goal, and final prompt output.

The category system should include:

• Core user information categories
• Main prompt subject categories
• Style and tone categories
• Output format categories
• Platform or use-case categories if relevant
• Custom details categories
• Advanced prompt options if useful

For every category, explain:

• Why it exists
• How it improves the final prompt
• Any dependencies on previous categories

Build the category system so it is:

• Beginner-friendly
• Professional
• Easy to expand
• Reusable for future generators
• Specific to the completed Generator Planner
• Consistent with the completed Layout Blueprint

Do NOT generate HTML.

Do NOT generate CSS.

Do NOT generate JavaScript.

Only build the complete Category Blueprint.

Stop after completing the Category Blueprint. Do not continue to the Input Builder until instructed.`,

inputs: `You are an expert front-end application architect, UI designer, and prompt engineering specialist.

The Generator Foundation has already been completed.

The Generator Planner has already been completed, including the generator name, purpose, target audience, and main goal.

The Reference Image has already been uploaded and analyzed.

The Layout Blueprint and Category Blueprint have already been completed and approved.

Your task is to build the complete Input Builder Blueprint for the AI prompt generator before any HTML, CSS, or JavaScript is generated.

Build every input required for every completed category.

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

Build the input system so it is:

• Easy for beginners
• Consistent across every category
• Scalable for future updates
• Easy to implement with HTML, CSS, and JavaScript
• Specific to the completed Generator Planner
• Consistent with the completed Category Blueprint

Do NOT generate HTML.

Do NOT generate CSS.

Do NOT generate JavaScript.

Only build the complete Input Builder Blueprint.

Stop after completing the Input Builder Blueprint. Do not continue to the Logic Builder until instructed.`,


logic: `You are an expert software architect, front-end developer, and JavaScript engineer specializing in professional AI prompt generators.

The Generator Foundation has already been completed.

The Generator Planner has already been completed, including the generator name, purpose, target audience, and main goal.

The Reference Image has already been uploaded and analyzed.

The Layout Blueprint, Category Blueprint, and Input Builder Blueprint have already been completed and approved.

Your task is to build the complete Logic Blueprint for the AI prompt generator before any JavaScript is generated.

Build the complete application logic.

Include:

## 1. Application Workflow

Build the complete user workflow from opening the generator to copying or saving the finished prompt.

## 2. Generate Prompt Logic

Define:

• How every input should be collected.
• How the final prompt should be assembled.
• How missing values should be handled.
• How duplicate information should be prevented.

## 3. Randomize Logic

Define how Randomize should:

• Randomize only unlocked fields.
• Skip locked fields.
• Skip custom user text.
• Produce useful and logical combinations.
• Respect category dependencies.

## 4. Lock Logic

Define how locked fields behave.

Explain how Lock interacts with:

• Randomize
• Presets
• Clear All
• Generate Prompt

## 5. Preset Logic

Define:

• How presets populate inputs.
• How users switch between presets.
• How presets interact with locked fields.
• How presets affect custom user input.

## 6. Clear All Logic

Define how Clear All should:

• Reset every unlocked field.
• Preserve locked values.
• Reset custom text where appropriate.
• Restore default values when necessary.

## 7. Copy Logic

Build copy functionality for:

• Final Prompt
• Prompt Variations
• Prompt History

Include successful copy behavior and failure handling.

## 8. Save Prompt Logic

Define how prompts should be stored locally.

Include:

• Date Created
• Prompt Preview
• Full Prompt
• Delete Function

## 9. Prompt Variations

Define how the generator creates multiple useful prompt variations from the same user inputs while maintaining the original intent.

## 10. Prompt Quality Checker

Build a scoring system that evaluates:

• Completeness
• Clarity
• Detail
• Readability
• Missing Information
• Prompt Effectiveness

## 11. Validation Rules

Define how the generator prevents:

• Empty prompts
• Duplicate information
• Invalid selections
• Conflicting inputs
• Missing required information

## 12. Error Handling

Define how the application responds to:

• Missing required inputs
• Invalid data
• Empty output
• Copy failures
• Save failures
• Unexpected errors

## 13. Future Expansion

Build the logic architecture so additional categories, modules, features, and prompt types can be added later without rewriting the application.

The logic should be:

• Modular
• Reusable
• Scalable
• Beginner-friendly
• Consistent with the completed Layout Blueprint, Category Blueprint, and Input Builder Blueprint
• Specific to the completed Generator Planner

Do NOT generate HTML.

Do NOT generate CSS.

Do NOT generate JavaScript.

Only build the complete Logic Blueprint.

Stop after completing the Logic Blueprint. Do not continue to the Prompt Assembly Builder until instructed.`,


assembly: `You are an expert prompt engineer and AI prompt architect specializing in professional AI prompt generators.

The Generator Foundation has already been completed.

The Generator Planner has already been completed, including the generator name, purpose, target audience, and main goal.

The Reference Image has already been uploaded and analyzed.

The Layout Blueprint, Category Blueprint, Input Builder Blueprint, and Logic Blueprint have already been completed and approved.

Your task is to build the complete Prompt Assembly Blueprint for the AI prompt generator before any JavaScript is generated.

The Prompt Assembly Blueprint is responsible for transforming every user input into one polished, high-quality AI prompt.

Build the complete Prompt Assembly Blueprint.

Include:

## 1. Final Prompt Structure

Build the overall structure of the finished prompt.

Include:

• Opening instruction
• Context
• User selections
• Custom user input
• Quality instructions
• Output instructions

## 2. Category Assembly

Define how every completed category should be assembled into the final prompt.

Explain:

• Category order
• How categories work together
• How unnecessary information is excluded

## 3. Custom Text Handling

Define how custom user text should:

• Override selected options when appropriate
• Supplement selected options
• Merge naturally into the finished prompt

## 4. "None" Handling

Define how every field with a value of "None" should be ignored.

Do not include empty placeholders or unnecessary instructions in the final prompt.

## 5. Locked Fields

Define how locked fields remain unchanged during:

• Prompt Generation
• Randomization
• Preset Changes

## 6. Randomized Fields

Define how randomized selections are merged into the final prompt while maintaining logical, high-quality results and preventing conflicts.

## 7. Preset Integration

Define how presets populate the prompt while allowing users to customize individual categories before generating the final prompt.

## 8. Prompt Variations

Define how the generator automatically creates multiple useful prompt variations from the same user inputs while preserving the original intent.

## 9. Duplicate Prevention

Define how the assembly system prevents:

• Duplicate wording
• Repeated instructions
• Conflicting information
• Redundant context

## 10. Prompt Formatting

Ensure every finished prompt is:

• Clear
• Professional
• Organized
• Easy for AI to understand
• Optimized for high-quality AI responses
• Ready to copy and paste

## 11. Scalability

Build the Prompt Assembly Blueprint so additional categories, modules, prompt sections, and future features can be added without rebuilding the existing prompt structure.

The assembly system should be:

• Modular
• Reusable
• Scalable
• Beginner-friendly
• Consistent with the completed Layout Blueprint, Category Blueprint, Input Builder Blueprint, and Logic Blueprint
• Specific to the completed Generator Planner

Do NOT generate HTML.

Do NOT generate CSS.

Do NOT generate JavaScript.

Only build the complete Prompt Assembly Blueprint.

Stop after completing the Prompt Assembly Blueprint. Do not continue to the HTML Builder until instructed.`,


htmlPart1: `You are an expert HTML developer and front-end application architect.

The Generator Foundation has already been completed.

The Generator Planner has already been completed, including the generator name, purpose, target audience, and main goal.

The Reference Image has already been uploaded and analyzed.

The Layout Blueprint, Category Blueprint, Input Builder Blueprint, Logic Blueprint, and Prompt Assembly Blueprint have all been completed and approved.

Your task is to build the complete external index.html file for the AI prompt generator.

Output ONLY HTML code.

Build the file in multiple parts.

Generate Part 1.

Include:

• DOCTYPE
• html opening tag
• head section
• meta tags
• page title
• stylesheet link to style.css
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

Use the completed Generator Planner, Category Blueprint, Input Builder Blueprint, Logic Blueprint, and Prompt Assembly Blueprint as the source of truth.

Build:

• Preset section
• Main control buttons
• Generate button
• Randomize button
• Copy button
• Save button
• Clear button
• All collapsible generator category sections
• Dropdown inputs
• Chip button groups
• Multi-select chip groups
• Text boxes
• Textareas
• Lock buttons
• Clear category buttons where appropriate

Do NOT generate CSS.

Do NOT generate JavaScript.

Stop after the final generator category section.`,

htmlPart3: `Generate Part 3 of the external index.html file.

Output ONLY HTML code.

Continue from Part 2.

Do NOT repeat previous code.

Use the completed Layout Blueprint, Logic Blueprint, and Prompt Assembly Blueprint as the source of truth.

Build:

• Final Prompt Output section
• Copy Final Prompt button
• Download Prompt button if included in the blueprint
• Prompt Variations section
• Copy buttons for prompt variations
• Prompt History section
• Prompt Quality Checker
• Footer
• Closing main tag
• Closing wrapper
• Closing body tag
• Closing html tag

Do NOT generate CSS.

Do NOT generate JavaScript.

Stop after completing the full index.html file.`,

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

/* =========================================================
   SECTION 4: DOWNLOADS + REPLAYS + SEARCH
   Paste directly under Section 3
   ========================================================= */

/* ==========================
   DOWNLOAD RESOURCE CONTENT
   ========================== */

const DOWNLOAD_RESOURCES = {
"reference-image": {
    filename: "reference-image.txt",
    title: "Reference Image",
    content: `Reference Image

Upload your inspiration image into ChatGPT before continuing.

Use this image as the visual direction for:

• Style
• Composition
• Colors
• Lighting
• Mood
• Camera Angle
• Overall Quality

Do not copy the image exactly.

Use it only as creative inspiration while building your generator.`
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
document.addEventListener("DOMContentLoaded", () => {
  initializeCoreEngine();
  initializeDashboardEngine();
  initializeProfileNotebookSettings();
  initializeDownloadsReplaysSearch();
  initializeFinalPolish();
  initializeFlipCards();

  console.log("AI Business Builder fully initialized.");
});
