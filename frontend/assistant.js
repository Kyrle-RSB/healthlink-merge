// ============================================================
// AI Assistant Drawer — Chat with streaming responses
// ============================================================

let assistantOpen = false;
let assistantChats = JSON.parse(localStorage.getItem('cp-ai-chats') || '[]');
let currentChatId = localStorage.getItem('cp-ai-current-chat') || null;
let assistantLoading = false;

function initAssistant() {
  if (!currentChatId) startNewChat();
  renderChatMessages();
}

function toggleAssistant() {
  assistantOpen = !assistantOpen;
  const drawer = document.getElementById('assistant-drawer');
  if (assistantOpen) {
    drawer.classList.add('open');
    initAssistant();
    document.getElementById('assistant-input')?.focus();
  } else {
    drawer.classList.remove('open');
  }
}

function startNewChat() {
  currentChatId = 'chat_' + Date.now();
  assistantChats.push({ id: currentChatId, messages: [], created: new Date().toISOString() });
  localStorage.setItem('cp-ai-chats', JSON.stringify(assistantChats));
  localStorage.setItem('cp-ai-current-chat', currentChatId);
  renderChatMessages();
}

function getCurrentChat() {
  return assistantChats.find(c => c.id === currentChatId);
}

function renderChatMessages() {
  const container = document.getElementById('assistant-messages');
  if (!container) return;
  const chat = getCurrentChat();
  if (!chat || !chat.messages.length) {
    container.innerHTML = `
      <div style="text-align:center;padding:40px 16px;color:var(--text-muted)">
        <div style="font-size:24px;margin-bottom:8px">🧠</div>
        <div style="font-size:13px;font-weight:600;margin-bottom:4px">CarePoint AI Assistant</div>
        <div style="font-size:12px">Ask about patients, facilities, routing, conditions, or system status.</div>
      </div>`;
    return;
  }

  container.innerHTML = chat.messages.map(m => `
    <div class="assistant-msg ${m.role === 'user' ? 'msg-user' : 'msg-assistant'}">
      ${escAssistant(m.content)}
    </div>
  `).join('');
  container.scrollTop = container.scrollHeight;
}

async function sendAssistantMessage(e) {
  if (e) e.preventDefault();
  const input = document.getElementById('assistant-input');
  const text = input.value.trim();
  if (!text || assistantLoading) return;

  input.value = '';
  const chat = getCurrentChat();
  if (!chat) return;

  // Add user message
  chat.messages.push({ role: 'user', content: text });
  renderChatMessages();

  // Show loading
  assistantLoading = true;
  const container = document.getElementById('assistant-messages');
  const loadingEl = document.createElement('div');
  loadingEl.className = 'assistant-msg msg-assistant msg-loading';
  loadingEl.innerHTML = '<span class="typing-dots"><span></span><span></span><span></span></span>';
  container.appendChild(loadingEl);
  container.scrollTop = container.scrollHeight;

  try {
    const response = await fetch('/api/assistant/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text }),
    });

    loadingEl.remove();

    if (!response.ok) {
      const errData = await response.json().catch(() => ({ error: 'Unknown error' }));
      chat.messages.push({ role: 'assistant', content: `Error: ${errData.error || response.statusText}` });
      renderChatMessages();
      assistantLoading = false;
      return;
    }

    // Stream the response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let accumulated = '';

    chat.messages.push({ role: 'assistant', content: '' });
    const msgIndex = chat.messages.length - 1;

    const msgEl = document.createElement('div');
    msgEl.className = 'assistant-msg msg-assistant';
    container.appendChild(msgEl);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      accumulated += decoder.decode(value, { stream: true });
      chat.messages[msgIndex].content = accumulated;
      msgEl.innerHTML = escAssistant(accumulated);
      container.scrollTop = container.scrollHeight;
    }

    localStorage.setItem('cp-ai-chats', JSON.stringify(assistantChats));
  } catch (err) {
    loadingEl.remove();
    chat.messages.push({ role: 'assistant', content: 'Connection error. Please try again.' });
    renderChatMessages();
  }

  assistantLoading = false;
}

function clearAssistantChat() {
  const chat = getCurrentChat();
  if (chat) {
    chat.messages = [];
    localStorage.setItem('cp-ai-chats', JSON.stringify(assistantChats));
    renderChatMessages();
  }
}

function escAssistant(str) {
  if (!str) return '';
  // Basic markdown: **bold**, *italic*, `code`, newlines
  return str
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>');
}
