(() => {
  "use strict";

  const STORAGE_KEY = "glamWorkshopPortal:prompts";
  const MAX_IMAGE_SIZE = 2_000_000;
  const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
  let prompts = [];
  let editingPromptId = null;
  let pendingPromptImage = null;

  const $ = (id) => document.getElementById(id);

  function makeId() {
    if (window.crypto?.randomUUID) return `prompt-${crypto.randomUUID()}`;
    return `prompt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  function readPrompts() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      prompts = Array.isArray(value) ? value : [];
    } catch {
      prompts = [];
    }

    prompts = prompts.map((prompt) => ({
      id: prompt?.id || makeId(),
      title: prompt?.title || "Untitled Prompt",
      text: prompt?.text || "",
      category: prompt?.category || "",
      createdAt: prompt?.createdAt || new Date().toISOString(),
      updatedAt: prompt?.updatedAt || null,
      referenceImage: prompt?.referenceImage || null,
      favorite: Boolean(prompt?.favorite),
      useCount: Number.isFinite(Number(prompt?.useCount)) ? Number(prompt.useCount) : 0,
      lastUsedAt: prompt?.lastUsedAt || null,
    }));
    writePrompts(false);
  }

  function writePrompts(showError = true) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
      return true;
    } catch (error) {
      console.error("Saved Prompts storage error:", error);
      if (showError) showFormMessage("Browser storage is full. Remove a large image or export/delete older prompts.", true);
      return false;
    }
  }

  function toast(message, isError = false) {
    const el = $("toast");
    if (!el) return;
    el.textContent = message;
    el.classList.toggle("error", isError);
    el.classList.add("show");
    window.clearTimeout(toast.timer);
    toast.timer = window.setTimeout(() => el.classList.remove("show", "error"), 2200);
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Unknown date";
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const area = document.createElement("textarea");
      area.value = text;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
  }

  function showFormMessage(message, isError = false) {
    const el = $("savedPromptFormMessage");
    if (!el) return;
    el.textContent = message;
    el.classList.toggle("is-error", Boolean(message && isError));
  }

  function ensureViewFilter() {
    const toolbar = document.querySelector("#prompts .saved-prompt-toolbar");
    if (!toolbar) return;

    let select = $("savedPromptViewFilter");
    if (!select) {
      const field = document.createElement("div");
      field.className = "saved-prompt-toolbar-field saved-prompt-view-field";
      field.innerHTML = `
        <label for="savedPromptViewFilter">Show</label>
        <select id="savedPromptViewFilter">
          <option value="all">All Prompts</option>
          <option value="favorites">Favorites</option>
          <option value="frequent">Frequently Used</option>
        </select>`;
      const exportButton = $("exportAllPromptsBtn");
      toolbar.insertBefore(field, exportButton || null);
      select = $("savedPromptViewFilter");
      select?.addEventListener("change", () => {
        syncQuickFilterButtons();
        renderPrompts();
      });
    }

    if (!$("savedPromptQuickFilters")) {
      const quick = document.createElement("div");
      quick.id = "savedPromptQuickFilters";
      quick.className = "saved-prompt-quick-filters";
      quick.setAttribute("aria-label", "Saved prompt views");
      quick.innerHTML = `
        <button type="button" class="saved-prompt-filter-chip is-active" data-view="all">All</button>
        <button type="button" class="saved-prompt-filter-chip" data-view="favorites">★ Favorites</button>
        <button type="button" class="saved-prompt-filter-chip" data-view="frequent">Frequently Used</button>`;
      toolbar.insertAdjacentElement("beforebegin", quick);
      quick.addEventListener("click", (event) => {
        const button = event.target.closest("[data-view]");
        if (!button || !select) return;
        select.value = button.dataset.view;
        syncQuickFilterButtons();
        renderPrompts();
      });
    }

    syncQuickFilterButtons();
  }

  function syncQuickFilterButtons() {
    const current = $("savedPromptViewFilter")?.value || "all";
    document.querySelectorAll("#savedPromptQuickFilters [data-view]").forEach((button) => {
      const active = button.dataset.view === current;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function renderPendingImage() {
    const wrap = $("savedPromptImagePreviewWrap");
    const img = $("savedPromptImagePreview");
    if (!wrap || !img) return;
    if (!pendingPromptImage?.dataUrl) {
      wrap.hidden = true;
      img.removeAttribute("src");
      return;
    }
    img.src = pendingPromptImage.dataUrl;
    wrap.hidden = false;
  }

  function resizeImage(file, maxDimension = 1200, quality = 0.78) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        const image = new Image();
        image.onerror = reject;
        image.onload = () => {
          const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(image.width * scale));
          canvas.height = Math.max(1, Math.round(image.height * scale));
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject(new Error("Canvas unavailable"));
          ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        image.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  async function onImageChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) {
      showFormMessage("Use a JPG, JPEG, PNG, or WEBP image.", true);
      event.target.value = "";
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      showFormMessage("That image is too large. Choose an image under 2 MB.", true);
      event.target.value = "";
      return;
    }
    try {
      pendingPromptImage = { name: file.name, type: file.type, dataUrl: await resizeImage(file) };
      renderPendingImage();
      showFormMessage("");
    } catch (error) {
      console.error(error);
      showFormMessage("That image could not be loaded. Try another image.", true);
      event.target.value = "";
    }
  }

  function clearForm() {
    editingPromptId = null;
    pendingPromptImage = null;
    if ($("savedPromptTitle")) $("savedPromptTitle").value = "";
    if ($("savedPromptText")) $("savedPromptText").value = "";
    if ($("savedPromptCategory")) $("savedPromptCategory").value = "";
    if ($("savedPromptReferenceImage")) $("savedPromptReferenceImage").value = "";
    if ($("savePromptLibraryBtn")) $("savePromptLibraryBtn").textContent = "Save Prompt";
    if ($("cancelPromptEditBtn")) $("cancelPromptEditBtn").hidden = true;
    if ($("savedPromptFormHeading")) $("savedPromptFormHeading").textContent = "Save a New Prompt";
    renderPendingImage();
    showFormMessage("");
  }

  function savePrompt() {
    const title = $("savedPromptTitle")?.value.trim() || "Untitled Prompt";
    const text = $("savedPromptText")?.value.trim() || "";
    const category = $("savedPromptCategory")?.value || "";
    if (!text) {
      showFormMessage("Add prompt text before saving.", true);
      $("savedPromptText")?.focus();
      return;
    }

    if (editingPromptId) {
      const index = prompts.findIndex((prompt) => prompt.id === editingPromptId);
      if (index < 0) return;
      prompts[index] = {
        ...prompts[index], title, text, category, referenceImage: pendingPromptImage,
        updatedAt: new Date().toISOString(),
      };
      if (!writePrompts()) return;
      toast("Prompt updated.");
    } else {
      prompts.unshift({
        id: makeId(), title, text, category, createdAt: new Date().toISOString(), updatedAt: null,
        referenceImage: pendingPromptImage, favorite: false, useCount: 0, lastUsedAt: null,
      });
      if (!writePrompts()) { prompts.shift(); return; }
      toast("Prompt saved.");
    }
    clearForm();
    renderPrompts();
  }

  function editPrompt(id) {
    const prompt = prompts.find((item) => item.id === id);
    if (!prompt) return;
    editingPromptId = id;
    pendingPromptImage = prompt.referenceImage || null;
    $("savedPromptTitle").value = prompt.title || "";
    $("savedPromptText").value = prompt.text || "";
    if ($("savedPromptCategory")) $("savedPromptCategory").value = prompt.category || "";
    $("savePromptLibraryBtn").textContent = "Save Changes";
    if ($("cancelPromptEditBtn")) $("cancelPromptEditBtn").hidden = false;
    if ($("savedPromptFormHeading")) $("savedPromptFormHeading").textContent = "Edit Saved Prompt";
    renderPendingImage();
    document.querySelector("#prompts .prompt-save-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function deletePrompt(id) {
    const prompt = prompts.find((item) => item.id === id);
    if (!prompt || !window.confirm(`Delete “${prompt.title}”?`)) return;
    prompts = prompts.filter((item) => item.id !== id);
    if (!writePrompts()) return;
    if (editingPromptId === id) clearForm();
    renderPrompts();
    toast("Prompt deleted.");
  }

  function toggleFavorite(id) {
    const prompt = prompts.find((item) => item.id === id);
    if (!prompt) return;
    prompt.favorite = !prompt.favorite;
    writePrompts(false);
    renderPrompts();
    toast(prompt.favorite ? "Added to Favorites." : "Removed from Favorites.");
  }

  async function usePrompt(id) {
    const prompt = prompts.find((item) => item.id === id);
    if (!prompt) return;
    await copyText(prompt.text);
    prompt.useCount = (Number(prompt.useCount) || 0) + 1;
    prompt.lastUsedAt = new Date().toISOString();
    writePrompts(false);
    renderPrompts();
    toast("Prompt copied. Usage updated.");
  }

  function safeFileName(name) {
    return String(name).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "saved-prompt";
  }

  function downloadFile(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  function exportPrompt(id) {
    const prompt = prompts.find((item) => item.id === id);
    if (!prompt) return;
    const content = [
      "PROMPT TITLE", prompt.title || "Untitled Prompt", "",
      "CATEGORY", prompt.category || "No Category", "",
      "DATE SAVED", formatDate(prompt.createdAt), "",
      "FAVORITE", prompt.favorite ? "Yes" : "No", "",
      "TIMES USED", String(prompt.useCount || 0), "",
      "PROMPT", prompt.text || "", "",
      "REFERENCE IMAGE", prompt.referenceImage?.name || "None",
    ].join("\n");
    downloadFile(`${safeFileName(prompt.title)}.txt`, content, "text/plain;charset=utf-8");
  }

  function exportAll() {
    if (!prompts.length) return toast("There are no saved prompts to export.", true);
    const payload = {
      exportDate: new Date().toISOString().slice(0, 10),
      prompts: prompts.map((prompt) => ({
        title: prompt.title,
        category: prompt.category || "",
        prompt: prompt.text,
        dateSaved: prompt.createdAt,
        favorite: Boolean(prompt.favorite),
        useCount: Number(prompt.useCount) || 0,
        lastUsedAt: prompt.lastUsedAt || null,
        referenceImage: prompt.referenceImage?.name || null,
        hasReferenceImage: Boolean(prompt.referenceImage?.dataUrl),
      })),
    };
    downloadFile(`saved-prompts-${payload.exportDate}.json`, JSON.stringify(payload, null, 2), "application/json;charset=utf-8");
  }

  function renderPrompts() {
    const list = $("savedPromptsList");
    if (!list) return;
    ensureViewFilter();

    const search = $("savedPromptSearch")?.value.trim().toLowerCase() || "";
    const category = $("savedPromptCategoryFilter")?.value || "all";
    const sort = $("savedPromptSort")?.value || "newest";
    const view = $("savedPromptViewFilter")?.value || "all";

    let filtered = prompts.filter((prompt) => {
      const text = `${prompt.title} ${prompt.text}`.toLowerCase();
      const searchOk = !search || text.includes(search);
      const categoryOk = category === "all" || (category === "uncategorized" ? !prompt.category : prompt.category === category);
      const viewOk = view === "all" || (view === "favorites" ? prompt.favorite : (prompt.useCount || 0) > 0);
      return searchOk && categoryOk && viewOk;
    });

    filtered.sort((a, b) => {
      if (view === "frequent") {
        const byUse = (b.useCount || 0) - (a.useCount || 0);
        if (byUse) return byUse;
        return new Date(b.lastUsedAt || b.createdAt) - new Date(a.lastUsedAt || a.createdAt);
      }
      if (sort === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
      if (sort === "az") return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    list.innerHTML = "";
    if ($("savedPromptCount")) $("savedPromptCount").textContent = `${prompts.length} saved`;
    if ($("savedPromptsEmpty")) $("savedPromptsEmpty").hidden = prompts.length > 0;
    if ($("savedPromptsNoMatches")) $("savedPromptsNoMatches").hidden = prompts.length === 0 || filtered.length > 0;

    filtered.forEach((prompt) => {
      const article = document.createElement("article");
      article.className = "saved-prompt-item saved-prompt-collapsible";
      const imageButton = prompt.referenceImage?.dataUrl
        ? `<button type="button" class="saved-prompt-thumb-btn" aria-label="Open reference image preview"><img class="saved-prompt-thumb" src="${prompt.referenceImage.dataUrl}" alt="Reference image for ${escapeHtml(prompt.title)}"></button>`
        : "";
      const useText = prompt.useCount > 0 ? ` • Used ${prompt.useCount} ${prompt.useCount === 1 ? "time" : "times"}` : "";
      article.innerHTML = `
        <div class="saved-prompt-summary">
          <button type="button" class="saved-prompt-toggle" aria-expanded="false">
            <span class="saved-prompt-title-wrap">
              <strong>${escapeHtml(prompt.title)}</strong>
              <span class="saved-prompt-meta">${escapeHtml(prompt.category || "No Category")} • Saved ${escapeHtml(formatDate(prompt.createdAt))}${escapeHtml(useText)}</span>
            </span>
            <span class="saved-prompt-toggle-label">View Prompt</span>
          </button>
          ${imageButton}
        </div>
        <div class="saved-prompt-body" hidden>
          ${prompt.referenceImage?.dataUrl ? `<img class="saved-prompt-reference-large" src="${prompt.referenceImage.dataUrl}" alt="Reference image for ${escapeHtml(prompt.title)}">` : ""}
          <h4>Prompt</h4>
          <pre>${escapeHtml(prompt.text)}</pre>
        </div>
        <div class="saved-prompt-actions">
          <button type="button" class="secondary-btn favorite-saved-prompt" aria-pressed="${prompt.favorite}">${prompt.favorite ? "★ Favorite" : "☆ Favorite"}</button>
          <button type="button" class="secondary-btn copy-saved-prompt">Copy</button>
          <button type="button" class="secondary-btn edit-saved-prompt">Edit</button>
          <button type="button" class="secondary-btn export-saved-prompt">Export</button>
          <button type="button" class="danger-btn delete-saved-prompt">Delete</button>
        </div>`;

      const body = article.querySelector(".saved-prompt-body");
      const toggle = article.querySelector(".saved-prompt-toggle");
      const label = article.querySelector(".saved-prompt-toggle-label");
      toggle.addEventListener("click", () => {
        const opening = body.hidden;
        body.hidden = !opening;
        toggle.setAttribute("aria-expanded", String(opening));
        label.textContent = opening ? "Hide Prompt" : "View Prompt";
      });
      article.querySelector(".saved-prompt-thumb-btn")?.addEventListener("click", () => {
        if (body.hidden) toggle.click();
        article.querySelector(".saved-prompt-reference-large")?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      article.querySelector(".favorite-saved-prompt").addEventListener("click", () => toggleFavorite(prompt.id));
      article.querySelector(".copy-saved-prompt").addEventListener("click", () => usePrompt(prompt.id));
      article.querySelector(".edit-saved-prompt").addEventListener("click", () => editPrompt(prompt.id));
      article.querySelector(".export-saved-prompt").addEventListener("click", () => exportPrompt(prompt.id));
      article.querySelector(".delete-saved-prompt").addEventListener("click", () => deletePrompt(prompt.id));
      list.appendChild(article);
    });
  }

  function protectFromLegacyRenderer() {
    const list = $("savedPromptsList");
    if (!list || list.dataset.prdObserver === "1") return;
    list.dataset.prdObserver = "1";
    let repairing = false;
    const observer = new MutationObserver(() => {
      if (repairing) return;
      const legacyCard = list.querySelector(".saved-prompt-item:not(.saved-prompt-collapsible)");
      const legacyPromptText = list.querySelector(".saved-prompt-item > pre");
      if (legacyCard || legacyPromptText) {
        repairing = true;
        requestAnimationFrame(() => {
          readPrompts();
          renderPrompts();
          repairing = false;
        });
      }
    });
    observer.observe(list, { childList: true, subtree: true });
  }

  function bind() {
    if (!$("prompts")) return;
    readPrompts();
    ensureViewFilter();

    const legacySearch = document.querySelector("#prompts .prompt-list-card > #savedPromptSearch");
    if (legacySearch && !legacySearch.closest(".saved-prompt-toolbar")) legacySearch.remove();

    $("savePromptLibraryBtn")?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      savePrompt();
    }, true);
    $("clearPromptFormBtn")?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      clearForm();
    }, true);
    $("cancelPromptEditBtn")?.addEventListener("click", clearForm);
    $("savedPromptSearch")?.addEventListener("input", renderPrompts);
    $("savedPromptCategoryFilter")?.addEventListener("change", renderPrompts);
    $("savedPromptSort")?.addEventListener("change", renderPrompts);
    $("exportAllPromptsBtn")?.addEventListener("click", exportAll);
    $("clearSavedPromptSearchBtn")?.addEventListener("click", () => {
      if ($("savedPromptSearch")) $("savedPromptSearch").value = "";
      if ($("savedPromptCategoryFilter")) $("savedPromptCategoryFilter").value = "all";
      if ($("savedPromptViewFilter")) $("savedPromptViewFilter").value = "all";
      renderPrompts();
    });
    $("savedPromptReferenceImage")?.addEventListener("change", onImageChange);
    $("removeSavedPromptImageBtn")?.addEventListener("click", () => {
      pendingPromptImage = null;
      if ($("savedPromptReferenceImage")) $("savedPromptReferenceImage").value = "";
      renderPendingImage();
    });

    protectFromLegacyRenderer();
    renderPrompts();
    window.addEventListener("load", renderPrompts, { once: true });
  }

  function boot() {
    bind();
    // The portal's original script also renders Saved Prompts. Re-assert this
    // upgraded renderer after the original initialization and after Live Server reloads.
    [50, 250, 800, 1600].forEach((delay) => {
      window.setTimeout(() => {
        readPrompts();
        ensureViewFilter();
        renderPrompts();
      }, delay);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
