(() => {
  "use strict";

  const SUPABASE_URL = "https://zaylygsgbqtulnilcvrg.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_9OrEqYDv9NV8E29JakoepA_rIgYDsMk";

  if (!window.supabase?.createClient) {
    console.warn("Community permissions update could not start because Supabase is unavailable.");
    return;
  }

  const client = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
  );

  let currentUser = null;
  let isInstructor = false;
  let enhanceTimer = null;

  function showMessage(message, isError = false) {
    const toast = document.getElementById("toast");
    if (!toast) {
      if (isError) console.warn(message);
      return;
    }

    toast.textContent = message;
    toast.classList.toggle("error", Boolean(isError));
    toast.classList.add("show");
    window.setTimeout(() => toast.classList.remove("show"), 2400);
  }

  async function refreshPermissionContext() {
    const {
      data: { session },
    } = await client.auth.getSession();

    currentUser = session?.user || null;
    isInstructor = false;

    if (currentUser) {
      const { data, error } = await client.rpc("is_community_admin");
      if (!error) isInstructor = Boolean(data);
    }

    syncInstructorUpdateOption();
    scheduleFeedEnhancement();
  }

  function syncInstructorUpdateOption() {
    const select = document.getElementById("communityPostCategory");
    const option = select?.querySelector('option[value="updates"]');
    if (!select || !option) return;

    option.hidden = !isInstructor;
    option.disabled = !isInstructor;

    if (!isInstructor && select.value === "updates") {
      select.value = "questions";
    }
  }

  function scheduleFeedEnhancement() {
    window.clearTimeout(enhanceTimer);
    enhanceTimer = window.setTimeout(enhanceFeedPermissions, 80);
  }

  async function enhanceFeedPermissions() {
    const feed = document.getElementById("communityFeed");
    if (!feed || !currentUser) return;

    const postCards = [...feed.querySelectorAll(".community-post-card[data-post-id]")];
    const commentElements = [...feed.querySelectorAll(".community-comment[data-comment-id]")];

    const postIds = postCards.map((card) => card.dataset.postId).filter(Boolean);
    const commentIds = commentElements
      .map((comment) => comment.dataset.commentId)
      .filter(Boolean);

    let posts = [];
    let comments = [];

    if (postIds.length) {
      const { data, error } = await client
        .from("community_posts")
        .select("id, author_id, body, category, is_pinned")
        .in("id", postIds);
      if (!error) posts = data || [];
    }

    if (commentIds.length) {
      const { data, error } = await client
        .from("community_comments")
        .select("id, author_id, body")
        .in("id", commentIds);
      if (!error) comments = data || [];
    }

    const postMap = new Map(posts.map((post) => [String(post.id), post]));
    const commentMap = new Map(comments.map((comment) => [String(comment.id), comment]));

    postCards.forEach((card) => {
      const post = postMap.get(String(card.dataset.postId));
      if (!post) return;

      const ownsPost = post.author_id === currentUser.id;
      const deleteButton = card.querySelector(".community-delete-post-btn");
      const pinButton = card.querySelector(".community-pin-post-btn");

      // Only the content owner may delete it. Instructor status is not a delete override.
      if (!ownsPost) deleteButton?.remove();

      // Keep pin/update controls tied to the instructor's own content only.
      if (!ownsPost) pinButton?.remove();

      const actions = card.querySelector(".community-post-actions");
      if (ownsPost && actions && !actions.querySelector(".community-edit-post-btn")) {
        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "secondary-btn community-edit-post-btn";
        editButton.textContent = post.category === "updates" ? "Edit Update" : "Edit Post";
        editButton.addEventListener("click", () => startPostEdit(card, post));

        const deleteTarget = actions.querySelector(".community-delete-post-btn");
        if (deleteTarget) actions.insertBefore(editButton, deleteTarget);
        else actions.appendChild(editButton);
      }
    });

    commentElements.forEach((commentElement) => {
      const comment = commentMap.get(String(commentElement.dataset.commentId));
      if (!comment) return;

      const ownsReply = comment.author_id === currentUser.id;
      const deleteButton = commentElement.querySelector(
        ".community-delete-comment-btn",
      );

      // A user may delete only their own reply.
      if (!ownsReply) deleteButton?.remove();

      if (
        ownsReply &&
        !commentElement.querySelector(".community-edit-comment-btn")
      ) {
        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "secondary-btn community-edit-comment-btn";
        editButton.textContent = "Edit Reply";
        editButton.addEventListener("click", () =>
          startCommentEdit(commentElement, comment),
        );

        if (deleteButton) commentElement.insertBefore(editButton, deleteButton);
        else commentElement.appendChild(editButton);
      }
    });
  }

  function startPostEdit(card, post) {
    if (card.querySelector(".community-inline-post-editor")) return;

    const bodyElement = [...card.children].find(
      (element) => element.tagName === "P",
    );
    if (!bodyElement) return;

    const editor = document.createElement("div");
    editor.className = "community-inline-post-editor";
    editor.innerHTML = `
      <label>Edit ${post.category === "updates" ? "Instructor Update" : "Post"}</label>
      <textarea class="community-edit-post-input" rows="5" maxlength="5000"></textarea>
      <div class="builder-buttons">
        <button type="button" class="primary-btn community-save-post-edit-btn">Save Changes</button>
        <button type="button" class="secondary-btn community-cancel-post-edit-btn">Cancel</button>
      </div>
    `;

    const input = editor.querySelector(".community-edit-post-input");
    input.value = post.body || "";
    bodyElement.hidden = true;
    bodyElement.insertAdjacentElement("afterend", editor);
    input.focus();

    editor
      .querySelector(".community-cancel-post-edit-btn")
      .addEventListener("click", () => {
        editor.remove();
        bodyElement.hidden = false;
      });

    editor
      .querySelector(".community-save-post-edit-btn")
      .addEventListener("click", async () => {
        const body = input.value.trim();
        if (!body) {
          showMessage("Add text before saving your changes.", true);
          return;
        }

        const { error } = await client
          .from("community_posts")
          .update({ body })
          .eq("id", post.id)
          .eq("author_id", currentUser.id);

        if (error) {
          showMessage(error.message || "Post could not be updated.", true);
          return;
        }

        showMessage(
          post.category === "updates"
            ? "Instructor update saved."
            : "Post updated.",
        );
        refreshCommunityFeed();
      });
  }

  function startCommentEdit(commentElement, comment) {
    if (commentElement.querySelector(".community-inline-comment-editor")) return;

    const bodyParagraphs = [...commentElement.children].filter(
      (element) => element.tagName === "P",
    );
    const bodyElement = bodyParagraphs[1];
    if (!bodyElement) return;

    const editor = document.createElement("div");
    editor.className = "community-inline-comment-editor";
    editor.innerHTML = `
      <label>Edit Reply</label>
      <textarea class="community-edit-comment-input" rows="3" maxlength="3000"></textarea>
      <div class="builder-buttons">
        <button type="button" class="primary-btn community-save-comment-edit-btn">Save Changes</button>
        <button type="button" class="secondary-btn community-cancel-comment-edit-btn">Cancel</button>
      </div>
    `;

    const input = editor.querySelector(".community-edit-comment-input");
    input.value = comment.body || "";
    bodyElement.hidden = true;
    bodyElement.insertAdjacentElement("afterend", editor);
    input.focus();

    editor
      .querySelector(".community-cancel-comment-edit-btn")
      .addEventListener("click", () => {
        editor.remove();
        bodyElement.hidden = false;
      });

    editor
      .querySelector(".community-save-comment-edit-btn")
      .addEventListener("click", async () => {
        const body = input.value.trim();
        if (!body) {
          showMessage("Add reply text before saving.", true);
          return;
        }

        const { error } = await client
          .from("community_comments")
          .update({ body })
          .eq("id", comment.id)
          .eq("author_id", currentUser.id);

        if (error) {
          showMessage(error.message || "Reply could not be updated.", true);
          return;
        }

        showMessage("Reply updated.");
        refreshCommunityFeed();
      });
  }

  function refreshCommunityFeed() {
    const refreshButton = document.getElementById("communityRefreshBtn");
    if (refreshButton) {
      refreshButton.click();
      return;
    }
    scheduleFeedEnhancement();
  }

  function observeCommunityFeed() {
    const feed = document.getElementById("communityFeed");
    if (!feed) return;

    const observer = new MutationObserver(() => scheduleFeedEnhancement());
    observer.observe(feed, { childList: true, subtree: true });
    scheduleFeedEnhancement();
  }

  async function init() {
    await refreshPermissionContext();
    observeCommunityFeed();

    client.auth.onAuthStateChange(() => {
      window.setTimeout(refreshPermissionContext, 0);
    });

    document
      .getElementById("communityPostCategory")
      ?.addEventListener("change", syncInstructorUpdateOption);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
