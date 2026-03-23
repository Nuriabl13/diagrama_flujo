/* ══════════════════════════════════════════
   YodaAI — main.js (Versión Servidor Interno)
══════════════════════════════════════════ */

let conversations = [];
let activeId = null;
let isLoading = false;

// Elementos del DOM
const historyList = document.getElementById("historyList");
const messagesEl = document.getElementById("messages");
const textarea = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const newChatBtn = document.getElementById("newChatBtn");
const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");

// Inicialización
newConversation();

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

function renderMessages() {
  const conv = getActive();
  if (!conv) return;
  messagesEl.innerHTML = "";
  if (conv.messages.length === 0) {
    messagesEl.appendChild(buildEmptyState());
  } else {
    conv.messages.forEach((msg) => {
      messagesEl.appendChild(buildMessageRow(msg.role, msg.content));
    });
  }
  scrollBottom();
}

// LLAMADA AL SERVIDOR RUST
async function callYodaAPI(messages) {
  // Formato compatible con Gemini a través de tu Backend
  const payload = {
    historial: messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
  };

  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Error ${response.status}: No responde el servidor.`);
  }

  const data = await response.json();
  return data.texto; // Asegúrate que tu Rust devuelva un JSON con el campo "texto"
}

async function send() {
  const text = textarea.value.trim();
  if (!text || isLoading) return;

  const conv = getActive();
  const emptyState = document.getElementById("emptyState");
  if (emptyState) emptyState.remove();

  conv.messages.push({ role: "user", content: text });
  messagesEl.appendChild(buildMessageRow("user", text));
  textarea.value = "";
  autoResize();
  scrollBottom();

  if (conv.messages.length === 1) {
    conv.title = text.slice(0, 25) + "...";
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
    await typeText(row.querySelector(".bubble"), reply);
  } catch (err) {
    hideTyping();
    const errorMsg = "Perturbación en la Fuerza, hay. El servidor Rust encendido estar debe.";
    messagesEl.appendChild(buildMessageRow("assistant", errorMsg));
    console.error("Fallo de conexión:", err);
  } finally {
    isLoading = false;
    sendBtn.disabled = false;
  }
}

// FUNCIONES AUXILIARES DE INTERFAZ
function buildMessageRow(role, content) {
  const row = document.createElement("div");
  row.className = `msg-row ${role}`;
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = content;
  row.appendChild(bubble);
  return row;
}

function showTyping() {
  const row = document.createElement("div");
  row.id = "typingRow";
  row.className = "msg-row assistant";
  row.innerHTML = '<div class="bubble">Yoda meditando está...</div>';
  messagesEl.appendChild(row);
  scrollBottom();
}

function hideTyping() { document.getElementById("typingRow")?.remove(); }

async function typeText(bubble, text) {
  bubble.textContent = "";
  for (let char of text) {
    bubble.textContent += char;
    await new Promise(r => setTimeout(r, 15));
    scrollBottom();
  }
}

function autoResize() {
  textarea.style.height = "auto";
  textarea.style.height = Math.min(textarea.scrollHeight, 130) + "px";
}

function scrollBottom() { messagesEl.scrollTop = messagesEl.scrollHeight; }

function buildEmptyState() {
  const div = document.createElement("div");
  div.id = "emptyState";
  div.className = "empty-state";
  div.innerHTML = '<h2 class="empty-title">La sabiduría que buscas, aquí está.</h2>';
  return div;
}

// Eventos
sendBtn.onclick = send;
newChatBtn.onclick = newConversation;
textarea.oninput = autoResize;
textarea.onkeydown = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } };
menuBtn.onclick = () => sidebar.classList.toggle("open");