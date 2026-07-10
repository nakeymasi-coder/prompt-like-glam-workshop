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

Do not invent additional features, interface elements, branding, navigation, logos, taglines, version badges, marketing copy, placeholder text, example content, example categories, example presets, example workflows, or sample prompts unless they are explicitly requested.

Only create the exact components requested in each prompt.

If a prompt asks for a blueprint, define only the required structure. Do not invent implementation details, examples, or content that were not requested.
Do not treat builder prompts as permission to redesign. Builder prompts are only for implementation.

Each completed card becomes part of the source of truth for the next card. Once the Generator Planner, Layout Blueprint, Category Blueprint, Input Builder Blueprint, Logic Blueprint, and Prompt Assembly Blueprint are completed, all builder prompts must follow those approved documents exactly.

Do not generate anything yet.

Wait for my next prompt.`,

    planner: `You are an expert software architect, front-end developer, UI/UX designer, and prompt engineering specialist.

The Generator Foundation has already been established.

We are building a professional AI prompt generator using HTML, CSS, and JavaScript.

Your task is to create ONLY the Generator Planner for the generator idea I provide.

Using the generator idea I provide, build the complete development blueprint.

Include only:

1. Generator Name
2. Generator Purpose
3. Target Audience
4. Main Goal
5. What the generator creates
6. What problem it solves
7. What the final prompt should help the user do

Do NOT create categories yet.
Do NOT create inputs yet.
Do NOT create workflow yet.
Do NOT create layouts yet.
Do NOT create presets yet.
Do NOT create outputs yet.
Do NOT create features yet.


Do not generate HTML.

Do not generate CSS.

Do not generate JavaScript.

Only create the complete development blueprint.

Wait for my next prompt.`,

    layout: `You are an expert UI/UX architect and front-end application designer specializing in professional AI prompt generators.

The Generator Foundation has already been completed.

The Generator Planner has already been completed, including the generator name, purpose, target audience, and main goal.

The Reference Image has already been uploaded and analyzed.

Use the completed Generator Foundation, Generator Planner, and Reference Image as the source of truth for this blueprint.

The Generator Planner defines the generator's purpose, audience, and goal.

The Reference Image defines only the visual direction.

Do not use the Reference Image to create generator content.

Use the Reference Image only for visual inspiration, including layout style, spacing, typography, color direction, card styling, and overall user experience.

Do not copy the Reference Image.

Do not infer categories, presets, branding, content, workflows, examples, or marketing copy from the Reference Image.

Your task is to build the complete Layout Blueprint for the AI prompt generator.

The Layout Blueprint defines ONLY the application's page structure.

Do not invent sections that are not listed below.

Do not reorganize the page structure.

Only define the location and purpose of each approved section.

Do not create content.

Do not create examples.

Do not create categories.

Do not create presets.

Do not explain functionality.

Do not create user workflows.

Do not create future features.

Do not generate HTML.

Do not generate CSS.

Do not generate JavaScript.

Build only the page layout.

Include only the following sections.

# 1. Top Section

Define the application's top section.

Include only:

• One primary application title.

Do not create a separate Generator Name.

Do not create a Hero section.

Do not create a subtitle.

Do not create descriptive text.

Do not duplicate the application title anywhere else in the interface.

# 2. Presets

Define the location of the Presets section.

Do not create preset names.

# 3. Main Controls

Define the Main Controls section.

Include only:

• Generate Prompt
• Randomize
• Copy Prompt
• Save Prompt
• Clear All

# 4. Generator Categories

Define the location and structure of the Generator Categories section.

Each category card should support:

• Category Title
• Dropdowns
• Chip Buttons
• Multi-Select Chips
• Text Input
• Textarea
• Lock Button

Do not create category names.

The Category Blueprint will define those later.

# 5. Prompt Output

Define the Prompt Output section.

Include only:

• Final Prompt
• Copy Prompt Button
• Character Counter
• Prompt Quality Score

# 6. Prompt Variations

Define the Prompt Variations section.

Include only:

• Variation Output
• Copy Button

# 7. Prompt History

Define the Prompt History section.

Include only:

• Prompt Preview
• Date Created
• Copy Button
• Delete Button

# 8. Prompt Quality Checker

Define the location of the Prompt Quality Checker.

Do not define scoring logic.

# 9. Footer

Define the Footer.

Include only:

• Copyright area

The footer should contain only a copyright section.

Do not repeat the application title.

Do not repeat the generator name.

Do not add navigation links.

Do not add descriptions.

Do not add marketing copy.

Do not add social media links.

Leave the copyright text customizable so users can insert their own name, business name, brand, or year.

# 10. Visual Direction

Briefly define:

• Overall Layout
• Cards
• Typography
• Color Direction
• Buttons
• Spacing
• Responsive Behavior

Keep this section brief.

Only build the Layout Blueprint.

Stop after completing the Layout Blueprint.`,

    categories: `You are an expert prompt engineer, prompt architect, and AI generator designer.

The Generator Foundation has already been completed.

The Generator Planner has already been completed, including the generator name, purpose, target audience, and main goal.

The Reference Image has already been uploaded and analyzed.

The Layout Blueprint has already been completed and approved.

Use the completed Generator Foundation, Generator Planner, Reference Image, and Layout Blueprint as the source of truth for this blueprint.

The Generator Planner determines what categories exist.

The Layout Blueprint determines where those categories will appear.

The Reference Image influences only the visual direction and must never influence the category system.

Your task is to build the complete Category Blueprint for the AI prompt generator before any HTML, CSS, or JavaScript is generated.

Build every category required by the completed Generator Planner.

Do not invent optional categories that are not required to achieve the generator's purpose.

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

Build only the categories required to accomplish the generator's purpose as defined in the completed Generator Planner.

Do not force common prompt-generator categories into every generator.

Only create categories that are necessary for this specific generator.

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

Stop after completing the Category Blueprint. Do not continue to the Input Builder until instructed.

The completed Category Blueprint will become the authoritative source for all future builders.

Every HTML section, CSS style, JavaScript data structure, OPTION_DATA object, PRESET_DATA object, event listener, prompt assembly rule, validation rule, randomization rule, and application feature must be generated directly from this Category Blueprint.

Do not design categories that cannot be implemented later.`,

    inputs: `You are an expert front-end application architect, UI designer, and prompt engineering specialist.

Use the completed Generator Foundation, Generator Planner, Reference Image, Layout Blueprint, and Category Blueprint as the source of truth for this blueprint.

The Category Blueprint determines what inputs exist.

Do not invent inputs that are not required by the completed Category Blueprint.

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
• Acceptable user input format

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

The completed Input Builder Blueprint will become the authoritative source for all future HTML inputs, CSS control styling, JavaScript selectors, validation rules, randomize behavior, preset behavior, and prompt assembly behavior.

Every input ID must be unique, predictable, and easy to reference in JavaScript.

Do not create inputs that cannot be implemented later.

Stop after completing the Input Builder Blueprint. Do not continue to the Logic Blueprint until instructed.`,

    logic: `You are an expert software architect, front-end developer, and JavaScript engineer specializing in professional AI prompt generators.

The Generator Foundation has already been completed.

The Generator Planner has already been completed, including the generator name, purpose, target audience, and main goal.

The Reference Image has already been uploaded and analyzed.

The Layout Blueprint, Category Blueprint, and Input Builder Blueprint have already been completed and approved.
Use the completed Generator Foundation, Generator Planner, Reference Image, Layout Blueprint, Category Blueprint, and Input Builder Blueprint as the source of truth for this blueprint.

The Category Blueprint determines what categories exist.

The Input Builder Blueprint determines what inputs exist.

Do not invent application logic for categories or inputs that do not exist in the approved blueprints.
Your task is to build the complete Logic Blueprint for the AI prompt generator before any JavaScript is generated.

Build the complete application logic.

Include:

## 1. Application Workflow

Build the complete user workflow from opening the generator to copying or saving the finished prompt.

## 2. Generate Prompt Logic

Define:

• How every approved input should be collected.
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
• Presets must populate only approved inputs.
• Do not create preset values for categories that do not exist.
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

Build the logic architecture so additional approved categories, modules, features, and prompt types can be added later without rewriting the application.

The architecture must remain data-driven so future categories can be added by extending the Category Blueprint and Input Builder Blueprint rather than rewriting application logic.
The logic should be:

• Modular
• Reusable
• Scalable
• Beginner-friendly
• Consistent with the completed Layout Blueprint, Category Blueprint, and Input Builder Blueprint
• Specific to the completed Generator Planner

The completed Logic Blueprint will become the authoritative source for all future JavaScript behavior.

Every function, event listener, validation rule, randomization rule, lock rule, preset rule, prompt assembly rule, Local Storage operation, and application workflow must be generated directly from this Logic Blueprint.

Do not design logic that cannot be implemented later.

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

Define how every approved category from the completed Category Blueprint should be assembled into the final prompt.

Do not invent prompt sections for categories that do not exist.
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

Build the Prompt Assembly Blueprint so additional approved categories, modules, prompt sections, and future features can be added by extending the Category Blueprint and Input Builder Blueprint without rebuilding the existing prompt structure.
The assembly system should be:

• Modular
• Reusable
• Scalable
• Beginner-friendly
• Consistent with the completed Layout Blueprint, Category Blueprint, Input Builder Blueprint, and Logic Blueprint
• Specific to the completed Generator Planner

The completed Prompt Assembly Blueprint will become the authoritative source for all future prompt generation logic.

Every prompt assembly function, prompt formatting rule, duplicate prevention rule, "None" handling rule, preset integration rule, custom text merge rule, and prompt variation must be generated directly from this Prompt Assembly Blueprint.

Do not design prompt assembly rules that cannot be implemented later.

Do NOT generate HTML.

Do NOT generate CSS.

Do NOT generate JavaScript.

Only build the complete Prompt Assembly Blueprint.

Stop after completing the Prompt Assembly Blueprint. Do not continue to the HTML Builder until instructed.`,

    htmlPart1: `You are an expert HTML developer and front-end application architect specializing in professional AI prompt generators.

If any completed blueprint conflicts with another completed blueprint, preserve all approved information and follow the most specific blueprint rather than inventing a new implementation.

Never resolve blueprint conflicts by removing functionality or replacing approved components.
The following completed documents are the SINGLE SOURCE OF TRUTH:

• Generator Foundation
• Generator Planner
• Reference Image
• Layout Blueprint
• Category Blueprint
• Input Builder Blueprint
• Logic Blueprint
• Prompt Assembly Blueprint

Do NOT redesign, simplify, rename, replace, or invent anything.

Do NOT invent categories, sections, inputs, labels, IDs, classes, placeholder content, or generic prompt-generator fields.

Your task is to build the external index.html file.

Output ONLY HTML code.

Build the file in multiple parts.

Generate Part 1.

Build:

• DOCTYPE
• opening html tag
• complete head section
• meta tags
• page title from the Generator Planner
• stylesheet link to style.css
• script.js link with defer
• opening body tag
• application wrapper
• header
• hero section
• introduction
• opening of the main generator workspace

Do NOT generate CSS.

Do NOT generate JavaScript.

Stop immediately after opening the main generator workspace.`,

    htmlPart2: `Generate Part 2 of the external index.html file.

Output ONLY HTML code.

Continue directly from Part 1.

Do NOT repeat previous code.

The following completed documents are the SINGLE SOURCE OF TRUTH:

• Generator Foundation
• Generator Planner
• Reference Image
• Layout Blueprint
• Category Blueprint
• Input Builder Blueprint
• Logic Blueprint
• Prompt Assembly Blueprint

Do NOT redesign, simplify, rename, replace, or invent anything.

Do NOT invent categories, inputs, dropdowns, chip groups, text boxes, textareas, lock buttons, section names, IDs, classes, or generic placeholders.

Every category, control, label, input, button, and section must match the approved blueprints exactly.

Generate every HTML element required for the future CSS Builder and JavaScript Builder. Do not omit supporting wrapper elements, containers, data attributes, IDs, classes, ARIA attributes, or structural elements needed for implementation.
Build:

• preset section
• main control buttons
• generate button
• randomize button
• copy button
• save button
• clear button
• every approved generator category
• every approved collapsible section
• every approved dropdown input
• every approved chip button group
• every approved multi-select chip group
• every approved text input
• every approved textarea
• every approved lock button
• every approved clear category button where appropriate

Do NOT generate CSS.

Do NOT generate JavaScript.

Stop after the final generator category section.`,

    htmlPart3: `Generate Part 3 of the external index.html file.

Output ONLY HTML code.

Continue directly from Part 2.

Do NOT repeat previous code.

The following completed documents are the SINGLE SOURCE OF TRUTH:

The completed blueprints define the application.

Implement them exactly as approved.

Do not reinterpret, reorganize, rename, merge, split, or omit any approved section, category, input, control, label, ID, or workflow.

Use the exact category names, input names, labels, IDs, control types, and display order defined by the completed blueprints.

• Generator Foundation
• Generator Planner
• Reference Image
• Layout Blueprint
• Category Blueprint
• Input Builder Blueprint
• Logic Blueprint
• Prompt Assembly Blueprint

Do NOT redesign, simplify, rename, replace, or invent anything.

Do NOT invent sections, features, controls, IDs, classes, or generic placeholders.

Build only what is defined in the approved blueprints.

Build:

• final prompt output section
• copy final prompt button
• download prompt button only if defined in the blueprint
• prompt variations section
• copy buttons for prompt variations
• prompt history section
• prompt quality checker
• footer
• closing main tag
• closing application wrapper
• closing body tag
• closing html tag

The finished HTML must be fully compatible with the future CSS Builder and JavaScript Builder.

The completed index.html file will become the authoritative source for all future CSS selectors and JavaScript DOM references.

Every ID, class, data attribute, and structural element must remain stable and implementation-ready.

Do NOT generate CSS.

Do NOT generate JavaScript.

Stop after completing the full index.html file.`,
    cssPart1: `You are an expert CSS developer, UI designer, and front-end architect specializing in professional AI prompt generators.

If any completed blueprint conflicts with another completed blueprint, preserve all approved information and follow the most specific blueprint rather than inventing a new implementation.

Never resolve blueprint conflicts by removing functionality or replacing approved components.
The following completed documents are the SINGLE SOURCE OF TRUTH:

The completed blueprints and index.html define the application.

Style the application exactly as implemented.

Do not rename, remove, merge, split, restyle, or reinterpret any approved component.

Use the exact IDs, classes, data attributes, and HTML structure from the completed index.html.

• Generator Foundation
• Generator Planner
• Reference Image
• Layout Blueprint
• Category Blueprint
• Input Builder Blueprint
• Logic Blueprint
• Prompt Assembly Blueprint
• Completed index.html

Do NOT redesign, simplify, rename, replace, or invent anything.

Your task is to build the complete external style.css file.

Output ONLY CSS code.

Generate Part 1.

Build:

• CSS variables
• color palette
• reset
• base typography
• body styles
• utility classes
• global layout

Style the completed HTML exactly as it exists.

Use the Reference Image only as visual inspiration for colors, spacing, typography, hierarchy, and overall UI quality.

Do NOT generate HTML.

Do NOT generate JavaScript.`,

    cssPart2: `Generate Part 2 of the external style.css file.

Output ONLY CSS code.

Continue directly from Part 1.

Do NOT repeat previous code.

The following completed documents are the SINGLE SOURCE OF TRUTH:

The completed blueprints and index.html define the application.

Style the application exactly as implemented.

Do not rename, remove, merge, split, restyle, or reinterpret any approved component.

Use the exact IDs, classes, data attributes, and HTML structure from the completed index.html.

• Generator Foundation
• Generator Planner
• Reference Image
• Layout Blueprint
• Category Blueprint
• Input Builder Blueprint
• Logic Blueprint
• Prompt Assembly Blueprint
• Completed index.html

Do NOT redesign, simplify, rename, replace, or invent anything.

Style the existing HTML exactly as implemented.

Build:

• header
• hero section
• generator workspace
• cards
• section titles
• navigation
• layout containers

Do NOT generate HTML.

Do NOT generate JavaScript.`,

    cssPart3: `Generate Part 3 of the external style.css file.

Output ONLY CSS code.

Continue directly from Part 2.

Do NOT repeat previous code.

The following completed documents are the SINGLE SOURCE OF TRUTH:

The completed blueprints and index.html define the application.

Style the application exactly as implemented.

Do not rename, remove, merge, split, restyle, or reinterpret any approved component.

Use the exact IDs, classes, data attributes, and HTML structure from the completed index.html.

• Generator Foundation
• Generator Planner
• Reference Image
• Layout Blueprint
• Category Blueprint
• Input Builder Blueprint
• Logic Blueprint
• Prompt Assembly Blueprint
• Completed index.html

Do NOT redesign, simplify, rename, replace, or invent anything.

Style only the controls that exist in the completed HTML.

Preserve a consistent design system across every control.

Controls with similar behavior should share reusable styling while allowing approved visual differences where required.

Build:

• buttons
• dropdowns
• text inputs
• textareas
• chip buttons
• multi-select chip groups
• lock buttons
• preset buttons
• generate button
• randomize button
• copy buttons
• save button
• clear buttons

Every interactive element should be polished, accessible, responsive, and visually consistent with the completed layout and Reference Image.

Do NOT generate HTML.

Do NOT generate JavaScript.`,

    cssPart4: `Generate Part 4 of the external style.css file.

Output ONLY CSS code.

Continue directly from Part 3.

Do NOT repeat previous code.

The following completed documents are the SINGLE SOURCE OF TRUTH:

The completed blueprints and index.html define the application.

Style the application exactly as implemented.

Do not rename, remove, merge, split, restyle, or reinterpret any approved component.

Use the exact IDs, classes, data attributes, and HTML structure from the completed index.html.

• Generator Foundation
• Generator Planner
• Reference Image
• Layout Blueprint
• Category Blueprint
• Input Builder Blueprint
• Logic Blueprint
• Prompt Assembly Blueprint
• Completed index.html

Do NOT redesign, simplify, rename, replace, or invent anything.

Style only the features that exist in the completed HTML.

Build:

• prompt output area
• prompt variations
• prompt history
• prompt quality checker
• toast notifications if implemented
• modal styles if implemented
• loading states if implemented

Do NOT generate HTML.

Do NOT generate JavaScript.`,

    cssPart5: `Generate Part 5 of the external style.css file.

Output ONLY CSS code.

Continue directly from Part 4.

Do NOT repeat previous code.

The following completed documents are the SINGLE SOURCE OF TRUTH:

The completed blueprints and index.html define the application.

Style the application exactly as implemented.

Do not rename, remove, merge, split, restyle, or reinterpret any approved component.

Use the exact IDs, classes, data attributes, and HTML structure from the completed index.html.

• Generator Foundation
• Generator Planner
• Reference Image
• Layout Blueprint
• Category Blueprint
• Input Builder Blueprint
• Logic Blueprint
• Prompt Assembly Blueprint
• Completed index.html

Do NOT redesign, simplify, rename, replace, or invent anything.

Build:

• footer
• tablet responsive styles
• mobile responsive styles
• animations
• hover effects
• focus states
• scrollbar styling
• final polish

The finished stylesheet must style the completed HTML exactly as built and maintain full compatibility with the future JavaScript Builder.

The completed style.css file will become the authoritative source for the application's visual presentation.

Do not create styles for elements that do not exist.

Do not leave implemented HTML elements unstyled.

Use the Reference Image only for visual inspiration.

Do NOT generate HTML.

Do NOT generate JavaScript.

Stop after completing the full style.css file.`,

    customizeGeneratorLook: `You are an expert HTML, CSS, and JavaScript developer helping a beginner customize an AI prompt generator.

Help me customize the visual look of my generator so it fits my brand.

I want help with:

• Color palette
• Fonts
• Button styles
• Background animation
• Floating background elements
• Custom scrollbar
• Overall brand feel

Walk me through this step by step.

Do not redesign my generator.

Do not remove or rename my existing sections, IDs, classes, buttons, categories, or features.

Keep the current generator structure exactly the same.

First, ask me what brand colors, fonts, mood, and style I want.

Then ask me if I want floating elements or background animation.

Then ask me if I want a custom scrollbar.

After I answer, tell me exactly which file to open.

Then generate only the CSS and JavaScript needed for the visual upgrades.

Explain exactly where to paste each piece of code.

Wait for me to describe my brand style before generating any code.`,

    expandCategoryOptions: `You are an expert AI prompt generator architect.

Help me expand the options inside every category of my AI prompt generator.

Do not create new categories.

Do not remove or rename any existing categories.

Keep the existing category structure exactly the same.

Instead, generate additional high-quality options for every existing category.

For each category:

• Generate 25–50 new options that fit naturally with the existing options.
• Avoid duplicates.
• Keep the same formatting used in the generator.
• Make the options creative, useful, and professionally written.
• Preserve any custom text fields, dropdowns, chip groups, and multi-select groups.

Output the new options grouped under their corresponding category names.

Do not generate HTML, CSS, or JavaScript unless I specifically ask for it.

Wait for me to paste my current generator before generating the new options.`,

    customizePresets: `You are an expert AI prompt generator architect and prompt engineering specialist.

Help me create 15 professional presets for my AI prompt generator.

The presets must use the categories, dropdowns, chip buttons, multi-selects, text fields, and textareas that already exist in my generator.

Do not create new categories.

Do not remove or rename any existing categories.

Do not redesign the generator.

For each preset:

• Create a unique preset name.
• Select the most appropriate option for every applicable category.
• Leave categories blank only when appropriate.
• Make every preset feel different from the others.
• Ensure the combinations produce high-quality, useful prompts.
• Avoid duplicate or repetitive presets.

The presets should be realistic, creative, beginner-friendly, and valuable for real-world use.

After generating the 15 presets, output them in a format that can easily be converted into a JavaScript presets object.

Wait for me to paste my generator's categories and options before generating the presets.`,

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

    jsPart1: `You are an expert JavaScript developer and front-end application architect specializing in professional AI prompt generators.

If any completed blueprint conflicts with another completed blueprint, preserve all approved information and follow the most specific blueprint rather than inventing a new implementation.

Never resolve blueprint conflicts by removing functionality or replacing approved components.

The following completed documents are the SINGLE SOURCE OF TRUTH:

The completed blueprints, index.html, and style.css define the application.

Implement them exactly as approved.

Do not reinterpret, rename, merge, split, omit, or replace any approved category, input, selector, ID, class, data structure, or workflow.

Use the completed index.html as the authoritative source for DOM structure.

Use the completed style.css as the authoritative source for visual state classes.

Use the completed blueprints as the authoritative source for application behavior.

• Generator Foundation
• Generator Planner
• Reference Image
• Layout Blueprint
• Category Blueprint
• Input Builder Blueprint
• Logic Blueprint
• Prompt Assembly Blueprint
• Completed index.html
• Completed style.css

Do NOT redesign, simplify, rename, replace, or invent anything.

Do NOT invent categories, inputs, OPTION_DATA, PRESET_DATA, IDs, selectors, controls, or application logic.

Build the JavaScript only from the approved blueprints and completed HTML.

Your task is to build the complete external script.js file.

Output ONLY JavaScript code.

Build the file in multiple parts.

Generate Part 1.

Build:

• "use strict"
• application constants
• global variables
• default data
• Local Storage keys
• OPTION_DATA generated directly from the approved Category Blueprint
• PRESET_DATA generated directly from the approved presets
• category data structures
• DOM selector helpers based on the completed HTML

• Shared configuration objects

• Shared application state

• Enumerations and constants derived from the approved blueprints

Do NOT generate HTML.

Do NOT generate CSS.`,

    jsPart2: `Generate Part 2 of the external script.js file.

Output ONLY JavaScript code.

Continue directly from Part 1.

Do NOT repeat previous code.

The following completed documents are the SINGLE SOURCE OF TRUTH:

The completed blueprints, index.html, and style.css define the application.

Implement them exactly as approved.

Do not reinterpret, rename, merge, split, omit, or replace any approved category, input, selector, ID, class, data structure, or workflow.

Use the completed index.html as the authoritative source for DOM structure.

Use the completed style.css as the authoritative source for visual state classes.

Use the completed blueprints as the authoritative source for application behavior.

• Generator Foundation
• Generator Planner
• Reference Image
• Layout Blueprint
• Category Blueprint
• Input Builder Blueprint
• Logic Blueprint
• Prompt Assembly Blueprint
• Completed index.html
• Completed style.css

Do NOT redesign, simplify, rename, replace, or invent anything.

Build helper functions only for controls that exist in the completed HTML.

Build:

• helper functions
• dropdown helpers
• chip button helpers
• multi-select helpers
• text input helpers
• textarea helpers
• lock state helpers
• validation helpers
• utility functions

Build reusable helper functions.

Avoid duplicate logic.

Functions should operate from shared configuration data rather than hard-coded category names whenever possible.

Do NOT generate HTML.

Do NOT generate CSS.`,

    jsPart3: `Generate Part 3 of the external script.js file.

Output ONLY JavaScript code.

Continue directly from Part 2.

Do NOT repeat previous code.

The following completed documents are the SINGLE SOURCE OF TRUTH:

The completed blueprints, index.html, and style.css define the application.

Implement them exactly as approved.

Do not reinterpret, rename, merge, split, omit, or replace any approved category, input, selector, ID, class, data structure, or workflow.

Use the completed index.html as the authoritative source for DOM structure.

Use the completed style.css as the authoritative source for visual state classes.

Use the completed blueprints as the authoritative source for application behavior.

• Generator Foundation
• Generator Planner
• Reference Image
• Layout Blueprint
• Category Blueprint
• Input Builder Blueprint
• Logic Blueprint
• Prompt Assembly Blueprint
• Completed index.html
• Completed style.css

Do NOT redesign, simplify, rename, replace, or invent anything.

Generate prompt assembly exactly as defined in the Prompt Assembly Blueprint.

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

Continue directly from Part 3.

Do NOT repeat previous code.

The following completed documents are the SINGLE SOURCE OF TRUTH:

The completed blueprints, index.html, and style.css define the application.

Implement them exactly as approved.

Do not reinterpret, rename, merge, split, omit, or replace any approved category, input, selector, ID, class, data structure, or workflow.

Use the completed index.html as the authoritative source for DOM structure.

Use the completed style.css as the authoritative source for visual state classes.

Use the completed blueprints as the authoritative source for application behavior.

• Generator Foundation
• Generator Planner
• Reference Image
• Layout Blueprint
• Category Blueprint
• Input Builder Blueprint
• Logic Blueprint
• Prompt Assembly Blueprint
• Completed index.html
• Completed style.css

Do NOT redesign, simplify, rename, replace, or invent anything.

Implement functionality only for the approved controls and categories.

Build:

• Randomize function using only approved categories
• Lock support
• Preset support using PRESET_DATA
• Clear All
• Copy Prompt
• Save Prompt
• Delete Saved Prompt
• Local Storage integration

Do NOT generate HTML.

Do NOT generate CSS.`,

    jsPart5: `Generate Part 5 of the external script.js file.

Output ONLY JavaScript code.

Continue directly from Part 4.

Do NOT repeat previous code.

The following completed documents are the SINGLE SOURCE OF TRUTH:

The completed blueprints, index.html, and style.css define the application.

Implement them exactly as approved.

Do not reinterpret, rename, merge, split, omit, or replace any approved category, input, selector, ID, class, data structure, or workflow.

Use the completed index.html as the authoritative source for DOM structure.

Use the completed style.css as the authoritative source for visual state classes.

Use the completed blueprints as the authoritative source for application behavior.

• Generator Foundation
• Generator Planner
• Reference Image
• Layout Blueprint
• Category Blueprint
• Input Builder Blueprint
• Logic Blueprint
• Prompt Assembly Blueprint
• Completed index.html
• Completed style.css

Do NOT redesign, simplify, rename, replace, or invent anything.

Build only the features defined in the approved blueprints.

Build:

• Prompt History
• Prompt Variations
• Prompt Quality Checker
• Character Counter if included
• Toast Notifications if included
• Modal support if included
• Error handling

Do NOT generate HTML.

Do NOT generate CSS.`,

    jsPart6: `Generate Part 6 of the external script.js file.

Output ONLY JavaScript code.

Continue directly from Part 5.

Do NOT repeat previous code.

The following completed documents are the SINGLE SOURCE OF TRUTH:

The completed blueprints, index.html, and style.css define the application.

Implement them exactly as approved.

Do not reinterpret, rename, merge, split, omit, or replace any approved category, input, selector, ID, class, data structure, or workflow.

Use the completed index.html as the authoritative source for DOM structure.

Use the completed style.css as the authoritative source for visual state classes.

Use the completed blueprints as the authoritative source for application behavior.

• Generator Foundation
• Generator Planner
• Reference Image
• Layout Blueprint
• Category Blueprint
• Input Builder Blueprint
• Logic Blueprint
• Prompt Assembly Blueprint
• Completed index.html
• Completed style.css

Do NOT redesign, simplify, rename, replace, or invent anything.

Connect every existing HTML element exactly as implemented.

Build:

• Event listeners
• Button connections
• Collapsible sections
• Scroll buttons if implemented
• Application initialization
• Startup functions
• Final application validation

Ensure every feature integrates correctly with the completed HTML, CSS, approved categories, approved inputs, approved logic, and approved prompt assembly.

Perform a complete integration pass.

Verify that:

• Every approved input has a working event listener.

• Every approved button performs its required function.

• Every approved category participates in prompt generation.

• Every approved selector resolves correctly.

• Every approved feature integrates with Local Storage where required.

• No implemented HTML element is left without JavaScript support.

• No JavaScript references elements that do not exist.

The finished application must be:

• production-ready
• fully functional
• responsive
• modular
• maintainable
• easy to expand

Do NOT generate HTML.

Do NOT generate CSS.

Stop after completing the full script.js file.`,

    testing: `You are an expert HTML, CSS, JavaScript, UI/UX, and debugging specialist helping a complete beginner test a professional AI prompt generator.

The Generator Foundation, Generator Planner, Reference Image, Layout Blueprint, Category Blueprint, Input Builder Blueprint, Logic Blueprint, Prompt Assembly Blueprint, index.html, style.css, and script.js have all been completed.

Your task is to perform a complete Testing & Debugging Review of the application.

Assume the user has little or no coding experience.

Walk them through every step in plain English.

Do not skip steps.

## 1. Manual Feature Testing

Create a complete checklist for testing every feature.

Include:

• Prompt Generation
• Prompt Assembly
• Randomize
• Lock Support
• Presets
• Clear All
• Copy Prompt
• Prompt Variations
• Prompt Quality Checker
• Character Counter
• Every custom feature added to the generator

For every feature explain:

• What to click
• What should happen
• What means something is broken

## 2. Browser Console Check

Explain exactly how to check for JavaScript errors.

Include these beginner-friendly instructions:

1. Open the generator in your browser.
2. Press F12 on your keyboard.
3. Click the Console tab.
4. Look for any messages shown in red.
5. Explain what red errors usually mean.
6. If red errors appear, explain how to copy them:
   • Click inside the Console.
   • Press Ctrl + A.
   • Press Ctrl + C.
   • Return to ChatGPT.
   • Press Ctrl + V to paste the errors.

Then provide the exact prompt to ask ChatGPT:

"What does this error mean, and how do I fix it step by step?"

## 3. File Review Instructions

If ChatGPT needs to inspect the code, explain exactly how to provide each file.

For index.html:

1. Open VS Code.
2. Click index.html.
3. Click anywhere inside the file.
4. Press Ctrl + A.
5. Press Ctrl + C.
6. Return to ChatGPT.
7. Press Ctrl + V.

Repeat the same instructions for:

• style.css
• script.js

Then tell the user to ask:

"Review these files for bugs. Tell me exactly what is broken, which file to open, what to search for, what to replace, and exactly where to paste the fix. Explain everything like I'm a beginner."

## 4. Code Review

Review the project for:

• Missing HTML tags
• Incorrect nesting
• Broken IDs
• Missing classes
• Broken JavaScript
• Missing event listeners
• CSS conflicts
• Responsive layout issues
• Duplicate code
• Unused code

Do not redesign the generator.

Do not remove existing features.

Only identify problems and explain how to fix them.

## 5. Responsive Testing

Explain how to test the generator on:

• Desktop
• Tablet
• Mobile

Show the user how to use the browser's responsive mode.

## 6. Performance Review

Review:

• CSS efficiency
• JavaScript efficiency
• Local Storage
• Rendering performance

Explain any recommendations in beginner-friendly language.

## 7. Final Testing Checklist

Create a final checklist confirming:

• Every button works.
• Every dropdown works.
• Every text box works.
• Prompt generation works.
• Copy Prompt works.
• Randomize works.
• Presets work.
• No Console errors remain.
• The generator works on desktop.
• The generator works on tablet.
• The generator works on mobile.

## 8. Troubleshooting Guide

If something does not work, explain how to identify the problem before attempting a fix.

Always tell the user:

• Which file to open
• What to search for
• What to replace
• Exactly where to paste the corrected code

Never assume the user knows where code belongs.

The completed review should be:

• Beginner friendly
• Step-by-step
• Thorough
• Easy to follow
• Production-ready

Do NOT generate HTML.

Do NOT generate CSS.

Do NOT generate JavaScript.

Only build the complete Testing & Debugging Review.

Stop after completing the review.`,

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

    final: `You are an expert front-end developer, UI designer, software release specialist, and application optimization engineer specializing in professional AI prompt generators.

The Generator Foundation has already been completed.

The Generator Planner has already been completed, including the generator name, purpose, target audience, and main goal.

The Reference Image has already been uploaded and analyzed.

The Generator Foundation, Generator Planner, Reference Image, Layout Blueprint, Category Blueprint, Input Builder Blueprint, Logic Blueprint, Prompt Assembly Blueprint, index.html, style.css, script.js, Day 1 Testing & Debugging, Day 2 Customization, and Day 2 Testing & Debugging have all been completed.
Your task is to build the complete Final Polish & Release Checklist for the AI prompt generator.

Perform a complete pre-release review to ensure the application is polished, professional, production-ready, and ready to be delivered to customers.

Include:

## 1. User Interface Review

Verify:

• Visual consistency
• Layout alignment
• Typography
• Spacing
• Icons
• Button consistency
• Overall user experience

## 2. Code Cleanup

Verify:

• Remove unused code
• Remove duplicate code
• Organize files
• Improve readability
• Confirm consistent naming conventions

## 3. Performance Optimization

Review:

• CSS optimization
• JavaScript optimization
• Load performance
• Rendering efficiency
• Local Storage efficiency

## 4. Accessibility Review

Verify:

• Keyboard navigation
• Focus indicators
• Color contrast
• Labels
• Semantic structure
• Screen reader compatibility where appropriate

## 5. Responsive Review

Verify the application performs correctly on:

• Desktop
• Tablet
• Mobile

## 6. Final Feature Verification

Confirm every feature functions correctly including:

• Prompt Generation
• Prompt Assembly
• Randomize
• Lock Support
• Presets
• Clear All
• Copy Prompt
• Save Prompt
• Prompt History
• Prompt Variations
• Prompt Quality Checker
• Character Counter
• Header Image
• Brand Colors
• Fonts
• Button Styling
• Background Animation
• Floating Elements
• Custom Scrollbar
• Marquee
• Copyright

## 7. File Organization

Verify:

• Clean project structure
• Organized assets
• Proper file naming
• Consistent folder organization

## 8. GitHub Preparation

Verify the project is ready for version control including:

• Final commit review
• Repository organization
• README recommendations
• Deployment files if required

## 9. Deployment Review

Verify the application is ready for deployment.

Include recommendations for:

• Netlify
• GitHub Pages
• Other static hosting platforms

## 10. Customer Readiness

Confirm the application is ready for customer use.

Review:

• Ease of use
• Documentation recommendations
• Beginner-friendly workflow
• Professional presentation

## 11. Future Expansion

Recommend future improvements that can be added without rebuilding the application architecture.

The completed application should be:

• Production-ready
• Stable
• Professional
• Responsive
• Scalable
• Easy to maintain
• Ready for customers

Do NOT generate HTML.

Do NOT generate CSS.

Do NOT generate JavaScript.

Only build the complete Final Polish & Release Checklist.

Stop after completing the Final Polish & Release Checklist.`,
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

  console.log(`Prompt Generator Companion v${APP_CONFIG.version} core loaded.`);
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

    publish: "GitHub + Netlify",
    sell: "Sell Your Generator",
    downloads: "Downloads",
    notebook: "Notebook",
    replays: "Replay Library",
    certificate: "Certificate",
    settings: "Settings",
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
        "You added modules, published, and prepared your generator to sell.",
      );

      if (isWorkshopComplete()) {
        unlockAchievement(
          "workshop-complete",
          "Workshop Complete",
          "Prompt Generator Companion v7.0 is ready.",
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

  downloadTextFile("prompt-generator-companion-notes.txt", text);

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
      `${appData.profile.name}'s student profile was updated.`,
    );

    unlockAchievement(
      "profile-saved",
      "Profile Saved",
      "Your profile is ready",
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

      addActivity("Theme updated", `Theme changed to ${themeSelect.value}.`);

      showToast("Theme updated.");
    });
  }

  if (accentSelect) {
    accentSelect.value = appData.settings.accent || "blue-gold";

    accentSelect.addEventListener("change", () => {
      appData.settings.accent = accentSelect.value;
      saveAppData();
      applyAccent();

      addActivity("Accent updated", `Accent changed to ${accentSelect.value}.`);

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
    app: "Prompt Generator Companion",
    version: APP_CONFIG.version,
    exportedAt: new Date().toISOString(),
    data: appData,
  };

  downloadTextFile(
    "prompt-generator-companion-backup.json",
    JSON.stringify(backup, null, 2),
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
    "This will erase profile, notes, progress, achievements, and settings. Reset everything?",
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

Use it only as creative inspiration while building your generator.`,
  },

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
      "Your workshop certificate is ready.",
    );
  } else {
    locked.classList.remove("hidden");
    unlocked.classList.add("hidden");
  }
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

  unlockAchievement(
    "first-open",
    "Welcome",
    "You opened Prompt Generator Companion. Let's build something amazing together.",
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

    "publish",
    "sell",
    "downloads",
    "notebook",
    "replays",
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
  updateCompletionButtonStates();
}

/* ==========================
   FINAL INIT
   ========================== */

function initializeFinalPolish() {
  runAppHealthCheck();
  setupCertificateSystem();
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
document.addEventListener("DOMContentLoaded", () => {
  initializeCoreEngine();
  initializeDashboardEngine();
  initializeProfileNotebookSettings();
  initializeDownloadsReplaysSearch();
  initializeFlipCards();
  setupLaunchChecklistCard();
  initializeFinalPolish();

  console.log("Prompt Generator Companion fully initialized.");
});
