(function () {
  // --- Default Configuration ---
  // Defines the default settings. These are overridden by `window.ChatWidgetConfig`.
  const defaultConfig = {
    webhook: {
      url: "",
    },
    branding: {
      logo: "https://asset.brandfetch.io/idD34E69aX/id3aVIWdCx.png?updated=1718193138178",
      name: "Botes Networks",
      welcomeText: "Hi 👋, how can we help?",
      welcomeButtons: [
        {
          label: "Send us a message",
          initialMessage: "How can I help you today?",
        },
      ],
      poweredBy: {
        text: "Developed by Botes Networks",
        link: "https://botesnetworks.co.za",
      },
    },
    style: {
      primaryColor: "#f97316",
      headerColor: "#f8fafc",
      position: "right",
      backgroundColor: "#ffffff",
      fontColor: "#1e293b",
    },
  };

  // --- Merge user config with defaults ---
  function deepMerge(target, source) {
    for (const key in source) {
      if (source[key] instanceof Object && key in target) {
        target[key] = deepMerge(target[key] || {}, source[key]);
      } else {
        target[key] = source[key];
      }
    }
    return target;
  }

  const userConfig = window.ChatWidgetConfig || {};
  const config = deepMerge(defaultConfig, userConfig);

  // --- Style Injection ---
  function injectStyles(config) {
    const { primaryColor, headerColor, position, backgroundColor, fontColor } =
      config.style;
    const positionRule = position === "left" ? "left: 20px;" : "right: 20px;";

    const style = document.createElement("style");
    style.innerHTML = `
      .chat-widget-button {
        position: fixed; bottom: 20px; ${positionRule}
        background-color: ${primaryColor}; color: white; width: 60px; height: 60px;
        border-radius: 50%; border: none; cursor: pointer; display: flex;
        justify-content: center; align-items: center;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2); z-index: 9998;
        transition: transform 0.2s ease-in-out;
      }
      .chat-widget-button:hover { transform: scale(1.1); }
      .chat-widget-button svg { width: 32px; height: 32px; }

      .chat-widget-container {
        position: fixed; bottom: 90px; ${positionRule}
        width: 370px; height: 70vh; max-height: 600px;
        background-color: ${backgroundColor}; border-radius: 12px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.2); display: flex;
        flex-direction: column; overflow: hidden; z-index: 9999;
        transform: translateY(20px) scale(0.95); opacity: 0; visibility: hidden;
        transition: transform 0.3s ease-out, opacity 0.3s ease-out;
      }
      .chat-widget-container.open {
        transform: translateY(0) scale(1); opacity: 1; visibility: visible;
      }

      .chat-widget-header {
        background-color: ${headerColor}; padding: 16px; display: flex;
        align-items: center; border-bottom: 1px solid #e2e8f0; flex-shrink: 0;
      }
      .chat-widget-header img { width: 32px; height: 32px; margin-right: 12px; border-radius: 4px; }
      .chat-widget-header h3 { margin: 0; font-size: 18px; font-weight: 600; color: ${fontColor}; }

      .chat-messages { flex-grow: 1; padding: 16px; overflow-y: auto; display: flex; flex-direction: column; }
      
      /* Chat Bubble Styles */
      .message { max-width: 80%; padding: 10px 15px; border-radius: 18px; margin-bottom: 10px; line-height: 1.4; word-wrap: break-word; }
      .message.user { background-color: ${primaryColor}; color: white; align-self: flex-end; border-bottom-right-radius: 4px; }
      .message.bot { background-color: #f1f5f9; color: ${fontColor}; align-self: flex-start; border-bottom-left-radius: 4px; }
      .message.bot a { color: ${primaryColor}; text-decoration: underline; }
      .message.bot h1, .message.bot h2, .message.bot h3, .message.bot p { margin: 0; }

      /* Welcome Buttons Feature */
      .welcome-buttons-container { display: flex; flex-direction: column; gap: 8px; margin-top: 10px; }
      .welcome-button { background-color: transparent; border: 1px solid ${primaryColor}; color: ${primaryColor}; padding: 10px; border-radius: 8px; cursor: pointer; text-align: center; transition: background-color 0.2s, color 0.2s; }
      .welcome-button:hover { background-color: ${primaryColor}; color: white; }

      .chat-input-area { padding: 12px; border-top: 1px solid #e2e8f0; display: flex; align-items: flex-end; flex-shrink: 0; }
      .chat-input-area textarea {
        flex-grow: 1; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; resize: none;
        font-family: inherit; font-size: 14px; line-height: 1.4; max-height: 150px;
        overflow-y: auto; transition: height 0.2s ease;
      }
      .chat-input-area textarea:focus { outline: none; border-color: ${primaryColor}; box-shadow: 0 0 0 2px ${primaryColor}33; }
      .chat-input-area button { background-color: ${primaryColor}; color: white; border: none; border-radius: 8px; padding: 10px 20px; margin-left: 10px; cursor: pointer; font-weight: 600; }

      .chat-widget-footer { text-align: center; padding: 8px; font-size: 12px; color: #94a3b8; background-color: ${headerColor}; flex-shrink: 0; }
      .chat-widget-footer a { color: #94a3b8; text-decoration: none; }
    `;
    document.head.appendChild(style);
  }

  // --- Simple Markdown to HTML Parser ---
  function parseMarkdown(text) {
    let html = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    html = html.replace(/^### (.*$)/gim, "<h3>$1</h3>");
    html = html.replace(/^## (.*$)/gim, "<h2>$1</h2>");
    html = html.replace(/^# (.*$)/gim, "<h1>$1</h1>");
    html = html.replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>");
    html = html.replace(/\*(.*?)\*/gim, "<em>$1</em>");
    html = html.replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" target="_blank">$1</a>');
    html = html.split('\n').map(p => p.trim() ? `<p>${p}</p>` : '').join('');
    return html;
  }

  // --- Main Widget Creation Function ---
  function createWidget(config) {
    const chatButton = document.createElement("button");
    chatButton.className = "chat-widget-button";
    const chatIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193l-3.72 3.72a1.125 1.125 0 0 1-1.59 0l-3.72-3.72A1.125 1.125 0 0 1 9 17.25v-4.286c0-.97.616-1.813 1.5-2.097m6.75-6.364a2.25 2.25 0 0 0-3.182 0l-1.159 1.159a2.25 2.25 0 0 1-3.182 0l-1.159-1.159a2.25 2.25 0 0 0-3.182 0l-2.25 2.25a2.25 2.25 0 0 0 0 3.182l1.159 1.159a2.25 2.25 0 0 1 0 3.182l-1.159 1.159a2.25 2.25 0 0 0 0 3.182l2.25 2.25a2.25 2.25 0 0 0 3.182 0l1.159-1.159a2.25 2.25 0 0 1 3.182 0l1.159 1.159a2.25 2.25 0 0 0 3.182 0l2.25-2.25a2.25 2.25 0 0 0 0-3.182l-1.159-1.159a2.25 2.25 0 0 1 0-3.182l1.159-1.159a2.25 2.25 0 0 0 0-3.182l-2.25-2.25Z" /></svg>`;
    const closeIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>`;
    chatButton.innerHTML = chatIconSVG;

    const widgetContainer = document.createElement("div");
    widgetContainer.className = "chat-widget-container";
    widgetContainer.innerHTML = `
      <div class="chat-widget-header">
        <img src="${config.branding.logo}" alt="Brand Logo">
        <h3>${config.branding.name}</h3>
      </div>
      <div class="chat-messages"></div>
      <div class="chat-input-area">
        <textarea placeholder="Type your message..." rows="1"></textarea>
        <button>Send</button>
      </div>
      <div class="chat-widget-footer">
        <a href="${config.branding.poweredBy.link}" target="_blank" rel="noopener noreferrer">${config.branding.poweredBy.text}</a>
      </div>
    `;

    document.body.appendChild(chatButton);
    document.body.appendChild(widgetContainer);

    const messagesContainer = widgetContainer.querySelector(".chat-messages");
    const input = widgetContainer.querySelector("textarea");
    const sendButton = widgetContainer.querySelector(".chat-input-area button");
    let welcomeButtonsContainer;

    function addMessage(text, sender) {
      const messageElement = document.createElement("div");
      messageElement.className = `message ${sender}`;
      messageElement.innerHTML = sender === 'bot' ? parseMarkdown(text) : text;
      messagesContainer.appendChild(messageElement);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function hideWelcomeButtons() {
      if (welcomeButtonsContainer) {
        welcomeButtonsContainer.style.display = 'none';
      }
    }

    async function sendMessage(messageText = null) {
      const text = messageText !== null ? messageText : input.value.trim();
      if (text === "") return;

      hideWelcomeButtons();
      addMessage(text, "user");
      if (messageText === null) input.value = "";
      input.style.height = "auto";

      try {
        const response = await fetch(config.webhook.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text }),
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        addMessage(data.reply, "bot");
      } catch (error) {
        console.error("Error sending message:", error);
        addMessage("Sorry, something went wrong. Please try again.", "bot");
      }
    }

    function showWelcomeScreen() {
      addMessage(config.branding.welcomeText, "bot");
      if (config.branding.welcomeButtons && config.branding.welcomeButtons.length > 0) {
        welcomeButtonsContainer = document.createElement("div");
        welcomeButtonsContainer.className = "welcome-buttons-container";
        config.branding.welcomeButtons.forEach(buttonInfo => {
          const button = document.createElement("button");
          button.className = "welcome-button";
          button.textContent = buttonInfo.label;
          button.onclick = () => sendMessage(buttonInfo.initialMessage);
          welcomeButtonsContainer.appendChild(button);
        });
        messagesContainer.appendChild(welcomeButtonsContainer);
      }
    }

    function toggleChat() {
      widgetContainer.classList.toggle("open");
      // FIX: Clear the button's content before adding the new icon
      chatButton.innerHTML = '';
      if (widgetContainer.classList.contains("open")) {
        chatButton.innerHTML = closeIconSVG;
        if (messagesContainer.children.length === 0) {
          showWelcomeScreen();
        }
      } else {
        chatButton.innerHTML = chatIconSVG;
      }
    }

    function handleTextareaInput() {
      hideWelcomeButtons();
      input.style.height = 'auto';
      input.style.height = `${input.scrollHeight}px`;
    }

    chatButton.addEventListener("click", toggleChat);
    sendButton.addEventListener("click", () => sendMessage());
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
    input.addEventListener('input', handleTextareaInput, { once: true }); // Hide buttons on first type
    input.addEventListener('input', handleTextareaInput); // Continue resizing
  }

  // --- Initialize the Widget ---
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      injectStyles(config);
      createWidget(config);
    });
  } else {
    injectStyles(config);
    createWidget(config);
  }
})();
