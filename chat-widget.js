// chat-widget.js
(function () {
  // 1) Load marked.js for Markdown rendering
  const markedJs = document.createElement("script");
  markedJs.src = "https://cdn.jsdelivr.net/npm/marked/marked.min.js";
  markedJs.onload = initWidget;
  document.head.append(markedJs);

  function initWidget() {
    const currentScript = document.currentScript;
    const WEBHOOK_URL = currentScript.dataset.webhookUrl;
    if (!WEBHOOK_URL) {
      console.error("[ChatWidget] Missing data-webhook-url");
      return;
    }

    // 2) Inject CSS
    const style = document.createElement("style");
    style.textContent = `
      .chat-widget {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 360px;
        max-height: 520px;
        display: flex;
        flex-direction: column;
        background: #fff;
        box-shadow: 0 2px 12px rgba(0,0,0,0.2);
        border-radius: 8px;
        overflow: hidden;
        font-family: sans-serif;
        z-index: 9999;
      }
      .chat-widget.closed { display: none; }
      .toggle-button {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: #f68b1e;
        color: #fff;
        font-size: 32px;
        line-height: 0;
        border: none;
        cursor: pointer;
        z-index: 9998;
      }
      .chat-header {
        background: #f68b1e;
        color: #fff;
        padding: 10px 14px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .chat-header .title { font-size: 16px; font-weight: bold; }
      .chat-header .close-btn {
        background: transparent;
        border: none;
        color: #fff;
        font-size: 24px;
        line-height: 0;
        cursor: pointer;
      }
      .messages {
        flex: 1;
        overflow-y: auto;
        padding: 10px 14px;
      }
      .message {
        margin-bottom: 12px;
      }
      .message.user { text-align: right; }
      .message.bot { text-align: left; }
      .chat-input {
        border-top: 1px solid #eee;
        padding: 10px 14px;
        display: flex;
        align-items: flex-end;
      }
      .chat-input textarea {
        flex: 1;
        resize: none;
        overflow: auto;
        min-height: 40px;
        max-height: 200px; /* will be overridden dynamically */
        border: 1px solid #ccc;
        border-radius: 4px;
        padding: 8px;
        font-family: inherit;
        font-size: 14px;
      }
      .chat-input button {
        margin-left: 8px;
        padding: 8px 16px;
        background: #f68b1e;
        color: #fff;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
      }
      .chat-footer {
        text-align: center;
        font-size: 12px;
        color: #999;
        padding: 6px 0;
        border-top: 1px solid #eee;
      }
      /* Welcome card & quick replies */
      .card {
        background: #f5f5f5;
        padding: 10px;
        border-radius: 6px;
        margin-bottom: 12px;
      }
      .quick-replies {
        margin-top: 8px;
        display: flex;
        gap: 8px;
      }
      .quick-replies button {
        background: transparent;
        border: 1px solid #f68b1e;
        color: #f68b1e;
        padding: 6px 10px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 13px;
      }
    `;
    document.head.append(style);

    // 3) Build DOM
    const toggleBtn = document.createElement("button");
    toggleBtn.className = "toggle-button";
    toggleBtn.textContent = "+";
    document.body.append(toggleBtn);

    const widget = document.createElement("div");
    widget.className = "chat-widget closed";
    document.body.append(widget);

    // Header
    const header = document.createElement("div");
    header.className = "chat-header";
    header.innerHTML = `
      <div class="title">Botes Networks</div>
      <button class="close-btn">&times;</button>
    `;
    widget.append(header);

    // Messages
    const messagesEl = document.createElement("div");
    messagesEl.className = "messages";
    widget.append(messagesEl);

    // Input
    const inputWrapper = document.createElement("div");
    inputWrapper.className = "chat-input";
    inputWrapper.innerHTML = `
      <textarea placeholder="Type your message…"></textarea>
      <button>Send</button>
    `;
    widget.append(inputWrapper);

    // Footer
    const footer = document.createElement("div");
    footer.className = "chat-footer";
    footer.textContent = "Developed by Botes Networks";
    widget.append(footer);

    // 4) Open / Close
    toggleBtn.addEventListener("click", () => {
      widget.classList.remove("closed");
      toggleBtn.style.display = "none";
      textarea.focus();
    });
    header.querySelector(".close-btn").addEventListener("click", () => {
      widget.classList.add("closed");
      toggleBtn.style.display = "flex";
    });

    // 5) References
    const textarea = inputWrapper.querySelector("textarea");
    const sendBtn = inputWrapper.querySelector("button");

    // 6) Auto-grow textarea (max 40% of widget height)
    textarea.addEventListener("input", () => {
      textarea.style.height = "auto";
      const maxH = widget.clientHeight * 0.4;
      textarea.style.height =
        Math.min(textarea.scrollHeight, maxH) + "px";
    });

    // 7) Add message helper
    function addMessage(text, isUser = false) {
      const msg = document.createElement("div");
      msg.className = "message " + (isUser ? "user" : "bot");
      // Render Markdown
      msg.innerHTML = marked.parse(text);
      messagesEl.append(msg);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    // 8) Send logic
    function sendText(text) {
      addMessage(text, true);
      fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      })
        .then((r) => r.json())
        .then((j) => {
          addMessage(j.reply || "");
        })
        .catch((e) => addMessage("Error: " + e.message));
    }

    function handleSend() {
      const txt = textarea.value.trim();
      if (!txt) return;
      textarea.value = "";
      textarea.style.height = "auto";
      sendText(txt);
    }

    sendBtn.addEventListener("click", handleSend);
    textarea.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    });

    // 9) Initial welcome card
    function addWelcomeCard() {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <div>Hey 👋, I am here to help you onboard a new employee…</div>
        <div class="quick-replies">
          <button data-payload="Intro Deck">Intro Deck</button>
          <button data-payload="Chat to an agent">Chat to an agent</button>
        </div>
      `;
      messagesEl.append(card);
      // Wire up quick replies
      card
        .querySelectorAll(".quick-replies button")
        .forEach((btn) => {
          btn.addEventListener("click", () => {
            const payload = btn.dataset.payload;
            addMessage(payload, true);
            sendText(payload);
            // remove card after click
            card.remove();
          });
        });
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    addWelcomeCard();
  }
})();
