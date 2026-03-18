(function () {
    const API = "http://localhost:5001/api/ai";

    // Wait for DOM + chat HTML to load
    function initChat() {
        const fab = document.getElementById("chatFab");
        const panel = document.getElementById("chatPanel");
        const closeBtn = document.getElementById("chatClose");
        const input = document.getElementById("chatInput");
        const sendBtn = document.getElementById("chatSendBtn");
        const messages = document.getElementById("chatMessages");
        const statusEl = document.getElementById("chatStatusDot");

        if (!fab || !panel) return;

        // Toggle panel
        fab.addEventListener("click", () => {
            const isOpen = panel.classList.toggle("open");
            fab.classList.toggle("open", isOpen);
            if (isOpen) { input.focus(); checkHealth(); }
        });

        closeBtn.addEventListener("click", () => {
            panel.classList.remove("open");
            fab.classList.remove("open");
        });

        let chatHistory = [];

        // Send message
        function sendMessage() {
            const text = input.value.trim();
            if (!text) return;

            appendMessage("user", text);
            input.value = "";
            sendBtn.disabled = true;

            // Show thinking
            const thinkingEl = appendMessage("bot", "Thinking...", true);

            fetch(`${API}/agent-chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: text, history: chatHistory })
            })
            .then(res => res.json())
            .then(data => {
                thinkingEl.remove();
                appendMessage("bot", data.reply || "I couldn't process that. Please try again.");
                chatHistory.push({ role: "user", content: text });
                chatHistory.push({ role: "assistant", content: data.reply || "" });
                // Keep history reasonably sized
                if (chatHistory.length > 20) chatHistory = chatHistory.slice(-20);
            })
            .catch(() => {
                thinkingEl.remove();
                appendMessage("bot", "Sorry, the AI service is currently unavailable. Please ensure Ollama is running.");
            })
            .finally(() => { sendBtn.disabled = false; });
        }

        sendBtn.addEventListener("click", sendMessage);
        input.addEventListener("keydown", e => { if (e.key === "Enter") sendMessage(); });

        function formatMarkdown(text) {
            if (!text) return "";
            let html = text.replace(/</g, "&lt;").replace(/>/g, "&gt;"); // Escape HTML
            html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"); // Bold
            html = html.replace(/\*(.*?)\*/g, "<em>$1</em>"); // Italics (for single asterisk)
            html = html.replace(/\n/g, "<br>"); // Newlines
            return html;
        }

        // Append message to chat
        function appendMessage(type, text, isThinking = false) {
            const div = document.createElement("div");
            div.className = `chat-msg ${type}`;
            const bubble = document.createElement("div");
            bubble.className = `msg-bubble${isThinking ? " thinking" : ""}`;
            bubble.innerHTML = formatMarkdown(text);
            div.appendChild(bubble);
            messages.appendChild(div);
            messages.scrollTop = messages.scrollHeight;
            return div;
        }

        // Health check
        function checkHealth() {
            fetch(`${API}/health`)
                .then(res => res.json())
                .then(data => {
                    if (data.status === "connected") {
                        statusEl.textContent = "Online";
                        statusEl.className = "chat-status online";
                    } else {
                        statusEl.textContent = "Offline (fallback mode)";
                        statusEl.className = "chat-status";
                    }
                })
                .catch(() => {
                    statusEl.textContent = "Offline";
                    statusEl.className = "chat-status";
                });
        }
    }

    // Initialize once DOM is ready
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => setTimeout(initChat, 300));
    } else {
        setTimeout(initChat, 300);
    }
})();
