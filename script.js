const rooms = [
  { id: "welcome", name: "Welcome Center", line: "PORTAL HOME", icon: "✦", page: "portal-home", description: "See your complete workshop collection, announcements, progress, and next steps." },
  { id: "workshops", name: "Workshop Access Center", line: "MY WORKSHOPS", icon: "W", page: "website-access", description: "Unlock and enter your purchased workshops from one organized place." },
  { id: "requirements", name: "Requirements Hall", line: "GET READY", icon: "✓", page: "requirements", description: "Review what you need before class and check off every setup requirement." },
  { id: "tools", name: "Creator Tools Library", line: "RESOURCES", icon: "◆", page: "tools-resources", description: "Open your workshop tools, recommended platforms, downloads, and useful links." },
  { id: "references", name: "Reference Studio", line: "INSPIRATION", icon: "◇", page: "references", description: "Keep your visual references and workshop inspiration organized in one studio." },
  { id: "replays", name: "Replay Theater", line: "WATCH AGAIN", icon: "▶", page: "replays", description: "Return to your workshop recordings and continue learning at your own pace." },
  { id: "notebook", name: "Creator Notebook", line: "SAVE NOTES", icon: "✎", page: "notebook", description: "Write, save, and organize your workshop notes without leaving the portal." },
  { id: "prompts", name: "Saved Prompts Studio", line: "CREATE", icon: "S", page: "prompts", description: "Store and manage the prompts you create during your workshops." },
  { id: "community", name: "Community Lounge", line: "CONNECT", icon: "C", page: "community", description: "Ask questions, share progress, and connect with other creators." },
  { id: "support", name: "Help & Completion Center", line: "GET SUPPORT", icon: "?", page: "quick-help", description: "Troubleshoot common problems, find answers, and finish with confidence." }
];

const glamCrystals = [
  {x:"4%",y:"19%",s:"16px",d:"0s",t:"7.6s"},{x:"10%",y:"72%",s:"10px",d:"1.2s",t:"6.4s"},{x:"17%",y:"31%",s:"13px",d:"2.4s",t:"8.1s"},
  {x:"25%",y:"82%",s:"8px",d:".4s",t:"5.8s"},{x:"33%",y:"17%",s:"12px",d:"3.1s",t:"7.2s"},{x:"41%",y:"76%",s:"17px",d:"1.8s",t:"8.8s"},
  {x:"50%",y:"23%",s:"9px",d:".9s",t:"6.9s"},{x:"59%",y:"69%",s:"13px",d:"2.8s",t:"7.7s"},{x:"67%",y:"15%",s:"15px",d:"1.1s",t:"8.4s"},
  {x:"75%",y:"79%",s:"9px",d:"3.7s",t:"6.1s"},{x:"84%",y:"28%",s:"13px",d:".2s",t:"7.4s"},{x:"91%",y:"67%",s:"16px",d:"2.1s",t:"8.6s"},
  {x:"96%",y:"18%",s:"8px",d:"1.5s",t:"5.9s"}
];

const glamButterflies = [
  {x:"8%",y:"43%",s:".82",d:"0s",t:"11s",r:"-12deg"},{x:"22%",y:"21%",s:".62",d:"2.8s",t:"13s",r:"10deg"},
  {x:"73%",y:"22%",s:".74",d:"1.1s",t:"12s",r:"-8deg"},{x:"89%",y:"48%",s:".9",d:"3.6s",t:"14s",r:"13deg"},
  {x:"64%",y:"75%",s:".56",d:"2s",t:"10s",r:"-16deg"}
];

const progressKey = "glamWorkshopPortal:progress";
let selectedRoom = null;
let transitionTimers = [];

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function renderAtmosphere() {
  const atmosphere = $("#glamAtmosphere");
  glamCrystals.forEach((item) => {
    const crystal = document.createElement("i");
    crystal.className = "floating-crystal";
    crystal.style.setProperty("--x", item.x);
    crystal.style.setProperty("--y", item.y);
    crystal.style.setProperty("--size", item.s);
    crystal.style.setProperty("--delay", item.d);
    crystal.style.setProperty("--time", item.t);
    atmosphere.appendChild(crystal);
  });

  glamButterflies.forEach((item) => {
    const butterfly = document.createElement("span");
    butterfly.className = "floating-butterfly";
    butterfly.style.setProperty("--x", item.x);
    butterfly.style.setProperty("--y", item.y);
    butterfly.style.setProperty("--scale", item.s);
    butterfly.style.setProperty("--delay", item.d);
    butterfly.style.setProperty("--time", item.t);
    butterfly.style.setProperty("--rotate", item.r);
    butterfly.innerHTML = "<b></b><i></i>";
    atmosphere.appendChild(butterfly);
  });
}

function renderRooms() {
  const container = $("#roomHotspots");
  rooms.forEach((room, index) => {
    const button = document.createElement("button");
    button.className = `hotspot spot-${index + 1}`;
    button.innerHTML = `<span>${room.icon}</span><small>${room.line}</small><strong>${room.name}</strong>`;
    button.addEventListener("click", () => openRoom(room));
    container.appendChild(button);
  });
}

function renderTransitionBling() {
  const container = $("#transitionBling");
  for (let index = 0; index < 22; index += 1) {
    const sparkle = document.createElement("i");
    sparkle.style.setProperty("--i", index);
    container.appendChild(sparkle);
  }
}

function getProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(progressKey) || "0");
    return Math.max(0, Math.min(100, Number(saved) || 0));
  } catch {
    return 0;
  }
}

function syncProgress() {
  const percent = getProgress();
  const large = $("#progressPercent");
  const small = $("#progressPercentSmall");
  const ring = $("#progressRing");
  const bar = $("#progressBar");
  if (large) large.textContent = `${percent}%`;
  if (small) small.textContent = `${percent}%`;
  if (ring) ring.style.setProperty("--fill", `${percent * 3.6}deg`);
  if (bar) bar.style.width = `${percent}%`;
}

function setHomeActive(isHome) {
  const homeButton = $("[data-home]");
  if (homeButton) homeButton.classList.toggle("active", isHome);
}

function closeMenu() {
  $("#mainNav").classList.remove("open");
}

function openRoom(room) {
  selectedRoom = room;
  $("#modalEmblem").textContent = room.icon;
  $("#modalLine").textContent = room.line;
  $("#room-title").textContent = room.name;
  $("#modalDescription").textContent = room.description;
  $("#roomModal").hidden = false;
}

function closeRoom() {
  selectedRoom = null;
  $("#roomModal").hidden = true;
}

function showPortal(page) {
  const frame = $("#portalFrame");
  frame.src = `portal.html?page=${encodeURIComponent(page)}`;
  $("#portalScreen").hidden = false;
  setHomeActive(false);
}

function openPortal(page, label = "Workshop Portal") {
  closeRoom();
  closeMenu();
  transitionTimers.forEach(clearTimeout);
  transitionTimers = [];

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    showPortal(page);
    return;
  }

  $("#transitionLabel").textContent = label;
  $("#doorTransition").hidden = false;

  transitionTimers.push(setTimeout(() => showPortal(page), 820));
  transitionTimers.push(setTimeout(() => { $("#doorTransition").hidden = true; }, 1650));
}

function closePortal() {
  $("#portalScreen").hidden = true;
  $("#portalFrame").removeAttribute("src");
  syncProgress();
  setHomeActive(true);
}

function goHome() {
  closeRoom();
  closeMenu();
  $("#portalScreen").hidden = true;
  $("#portalFrame").removeAttribute("src");
  setHomeActive(true);
}

renderAtmosphere();
renderRooms();
renderTransitionBling();
syncProgress();

$("#menuButton").addEventListener("click", () => $("#mainNav").classList.toggle("open"));
$("#brandHome").addEventListener("click", goHome);
$("[data-home]").addEventListener("click", goHome);
$("#closeModal").addEventListener("click", closeRoom);
$("#roomModal").addEventListener("mousedown", (event) => { if (event.target === $("#roomModal")) closeRoom(); });
$("#modalEnter").addEventListener("click", () => { if (selectedRoom) openPortal(selectedRoom.page, selectedRoom.name); });
$("#closePortal").addEventListener("click", closePortal);

$$('[data-open-portal]').forEach((button) => {
  button.addEventListener("click", () => openPortal(button.dataset.openPortal, button.dataset.label || "Workshop Portal"));
});

window.addEventListener("storage", syncProgress);
window.addEventListener("message", (event) => {
  if (event.origin === window.location.origin && event.data?.type === "glamPortalProgress") {
    const value = Math.max(0, Math.min(100, Number(event.data.value) || 0));
    const large = $("#progressPercent");
    const small = $("#progressPercentSmall");
    const ring = $("#progressRing");
    const bar = $("#progressBar");
    if (large) large.textContent = `${value}%`;
    if (small) small.textContent = `${value}%`;
    if (ring) ring.style.setProperty("--fill", `${value * 3.6}deg`);
    if (bar) bar.style.width = `${value}%`;
  }
});
