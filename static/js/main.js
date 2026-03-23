/* ══════════════════════════════════════════
   YodaAI — main.js (Conectado al backend Rust)
══════════════════════════════════════════ */

// ── Estado ──
let conversations = [];
let activeId = null;
let isLoading = false;

// ── DOM ──
const historyList = document.getElementById("historyList");
const messagesEl = document.getElementById("messages");
const textarea = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const newChatBtn = document.getElementById("newChatBtn");
const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");

// ── Init ──
newConversation();

// ── Nueva conversación ──
function newConversation() {
  const id = Date.now().toString();
  conversations.unshift({ id, title: "Nueva conversación", messages: [] });
  setActive(id);
  renderHistory();
}

function setActive(id) {
  activeId = id;
  renderMessages();
  renderHistory();
}

function getActive() {
  return conversations.find((c) => c.id === activeId);
}

// ── Renderizar sidebar ──
function renderHistory() {
  historyList.innerHTML = "";
  conversations.forEach((conv) => {
    const el = document.createElement("div");
    el.className = "history-item" + (conv.id === activeId ? " active" : "");
    el.textContent = conv.title;
    el.onclick = () => setActive(conv.id);
    historyList.appendChild(el);
  });
}

// ── Renderizar mensajes ──
function renderMessages() {
  const conv = getActive();
  if (!conv) return;

  messagesEl.innerHTML = "";

  if (conv.messages.length === 0) {
    messagesEl.appendChild(buildEmptyState());
    return;
  }

  conv.messages.forEach((msg) => {
    messagesEl.appendChild(buildMessageRow(msg.role, msg.content));
  });

  scrollBottom();
}

// ── Empty state ──
function buildEmptyState() {
  const el = document.createElement("div");
  el.className = "empty-state";
  el.id = "emptyState";
  el.innerHTML = `
    <svg class="empty-avatar" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="eg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#4caf6f" stop-opacity="0.12"/>
          <stop offset="100%" stop-color="#4caf6f" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="ef" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stop-color="#2d6639"/>
          <stop offset="100%" stop-color="#1a3d22"/>
        </radialGradient>
      </defs>
      <circle cx="80" cy="80" r="76" fill="url(#eg)"/>
      <ellipse cx="22" cy="80" rx="18" ry="8" fill="#1e3a24" opacity="0.9"/>
      <path d="M22 80 Q12 45 28 36 Q38 52 40 80" fill="#2d6639"/>
      <ellipse cx="138" cy="80" rx="18" ry="8" fill="#1e3a24" opacity="0.9"/>
      <path d="M138 80 Q148 45 132 36 Q122 52 120 80" fill="#2d6639"/>
      <ellipse cx="80" cy="85" rx="46" ry="52" fill="url(#ef)"/>
      <ellipse cx="64" cy="72" rx="7" ry="6" fill="#0a1a0d"/>
      <ellipse cx="96" cy="72" rx="7" ry="6" fill="#0a1a0d"/>
      <ellipse cx="64" cy="72" rx="4" ry="3.5" fill="#c9a84c" opacity="0.9"/>
      <ellipse cx="96" cy="72" rx="4" ry="3.5" fill="#c9a84c" opacity="0.9"/>
      <circle cx="65" cy="71" r="1.2" fill="#ffe8a0"/>
      <circle cx="97" cy="71" r="1.2" fill="#ffe8a0"/>
      <ellipse cx="80" cy="84" rx="4" ry="3" fill="#1a3d22" opacity="0.7"/>
      <path d="M68 96 Q80 102 92 96" stroke="#1a3d22" stroke-width="2" fill="none" opacity="0.5"/>
      <circle cx="80" cy="80" r="70" stroke="#4caf6f" stroke-width="0.5" opacity="0.15"/>
    </svg>
    <h2 class="empty-title">La sabiduría que buscas,<br><em>aquí encontrarla puedes</em></h2>
    <p class="empty-subtitle">Pregunta, joven Padawan. Hablar, listo estoy.</p>
    <div class="suggestions">
      <div class="suggestion-card" onclick="sendSuggestion(this)">¿Qué es la Fuerza?</div>
      <div class="suggestion-card" onclick="sendSuggestion(this)">¿Cómo superar el miedo?</div>
      <div class="suggestion-card" onclick="sendSuggestion(this)">¿Cuál es el camino Jedi?</div>
      <div class="suggestion-card" onclick="sendSuggestion(this)">Enséñame a meditar</div>
    </div>
  `;
  return el;
}

function sendSuggestion(el) {
  textarea.value = el.textContent;
  send();
}

// ── Construir burbuja ──
function buildMessageRow(role, content) {
  const row = document.createElement("div");
  row.className = `msg-row ${role}`;

  const avatar = document.createElement("div");
  avatar.className = `avatar ${role === "assistant" ? "yoda-av" : "user-av"}`;

  if (role === "assistant") {
    avatar.innerHTML = `
      <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="11" cy="42" rx="9" ry="4" fill="#2d6639"/>
        <path d="M11 42 Q6 22 14 18 Q19 26 21 42" fill="#2d6639"/>
        <ellipse cx="69" cy="42" rx="9" ry="4" fill="#2d6639"/>
        <path d="M69 42 Q74 22 66 18 Q61 26 59 42" fill="#2d6639"/>
        <ellipse cx="40" cy="44" rx="24" ry="27" fill="#1e3a24"/>
        <ellipse cx="32" cy="36" rx="4" ry="3.5" fill="#0a1a0d"/>
        <ellipse cx="48" cy="36" rx="4" ry="3.5" fill="#0a1a0d"/>
        <ellipse cx="32" cy="36" rx="2.5" ry="2" fill="#c9a84c" opacity="0.9"/>
        <ellipse cx="48" cy="36" rx="2.5" ry="2" fill="#c9a84c" opacity="0.9"/>
        <path d="M34 50 Q40 54 46 50" stroke="#1a3d22" stroke-width="1.5" fill="none" opacity="0.5"/>
      </svg>`;
  } else {
    avatar.textContent = "TÚ";
  }

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = content;

  row.appendChild(avatar);
  row.appendChild(bubble);
  return row;
}

// ── Typing indicator ──
function showTyping() {
  const row = document.createElement("div");
  row.className = "msg-row assistant";
  row.id = "typingRow";

  const avatar = document.createElement("div");
  avatar.className = "avatar yoda-av";
  avatar.innerHTML = `
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="11" cy="42" rx="9" ry="4" fill="#2d6639"/>
      <path d="M11 42 Q6 22 14 18 Q19 26 21 42" fill="#2d6639"/>
      <ellipse cx="69" cy="42" rx="9" ry="4" fill="#2d6639"/>
      <path d="M69 42 Q74 22 66 18 Q61 26 59 42" fill="#2d6639"/>
      <ellipse cx="40" cy="44" rx="24" ry="27" fill="#1e3a24"/>
      <ellipse cx="32" cy="36" rx="4" ry="3.5" fill="#0a1a0d"/>
      <ellipse cx="48" cy="36" rx="4" ry="3.5" fill="#0a1a0d"/>
      <ellipse cx="32" cy="36" rx="2.5" ry="2" fill="#c9a84c" opacity="0.9"/>
      <ellipse cx="48" cy="36" rx="2.5" ry="2" fill="#c9a84c" opacity="0.9"/>
    </svg>`;

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.innerHTML = `<div class="typing-dots"><span></span><span></span><span></span></div>`;

  row.appendChild(avatar);
  row.appendChild(bubble);
  messagesEl.appendChild(row);
  scrollBottom();
}

function hideTyping() {
  const el = document.getElementById("typingRow");
  if (el) el.remove();
}

// ── Efecto de escritura ──
async function typeText(bubble, text) {
  bubble.textContent = "";
  for (let i = 0; i < text.length; i++) {
    bubble.textContent += text[i];
    scrollBottom();
    await sleep(18);
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
function scrollBottom() {
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

// ── LLAMADA AL BACKEND RUST (en lugar de llamar a Gemini directamente) ──
async function callYodaAPI(messages) {
  // Convertimos el historial al formato que espera nuestro backend Rust
  // El backend espera: { historial: [{role: "user"|"model", parts: [{text: "..."}]}] }
  const historialGemini = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ historial: historialGemini }),
  });

  if (!response.ok) {
    throw new Error("Error en el servidor: " + response.status);
  }

  const data = await response.json();

  // El backend devuelve: { texto: "...", categoria_detectada: "..." }
  return data.texto;
}

// ── Enviar mensaje ──
async function send() {
  const text = textarea.value.trim();
  if (!text || isLoading) return;

  const conv = getActive();
  if (!conv) return;

  const emptyState = document.getElementById("emptyState");
  if (emptyState) emptyState.remove();

  conv.messages.push({ role: "user", content: text });
  messagesEl.appendChild(buildMessageRow("user", text));
  textarea.value = "";
  autoResize();
  scrollBottom();

  if (conv.messages.length === 1) {
    conv.title = text.slice(0, 30) + (text.length > 30 ? "…" : "");
    renderHistory();
  }

  isLoading = true;
  sendBtn.disabled = true;
  showTyping();

  try {
    const reply = await callYodaAPI(conv.messages);
    hideTyping();

    conv.messages.push({ role: "assistant", content: reply });

    const row = buildMessageRow("assistant", "");
    messagesEl.appendChild(row);
    const bubble = row.querySelector(".bubble");
    await typeText(bubble, reply);
  } catch (err) {
    hideTyping();
    const errorMsg =
      "Hmm. Perturbacion en la Fuerza, hay. El servidor Rust, revisar debes.";
    conv.messages.push({ role: "assistant", content: errorMsg });
    const row = buildMessageRow("assistant", "");
    messagesEl.appendChild(row);
    const bubble = row.querySelector(".bubble");
    await typeText(bubble, errorMsg);
    console.error(err);
  } finally {
    isLoading = false;
    sendBtn.disabled = false;
    textarea.focus();
  }
}

// ── Auto-resize textarea ──
function autoResize() {
  textarea.style.height = "auto";
  textarea.style.height = Math.min(textarea.scrollHeight, 130) + "px";
}

// ── Eventos ──
newChatBtn.addEventListener("click", () => {
  newConversation();
  sidebar.classList.remove("open");
});

sendBtn.addEventListener("click", send);

textarea.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    send();
  }
});

textarea.addEventListener("input", autoResize);
menuBtn.addEventListener("click", () => sidebar.classList.toggle("open"));

document.addEventListener("click", (e) => {
  if (
    sidebar.classList.contains("open") &&
    !sidebar.contains(e.target) &&
    e.target !== menuBtn
  ) {
    sidebar.classList.remove("open");
  }
});
