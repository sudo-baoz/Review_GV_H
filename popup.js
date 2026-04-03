// ============================================================
// STATE — Module-level state for the last successful fill
// ============================================================
let lastResult = null; // { questions, scores, timestamp }

// ============================================================
// DOM REFERENCES
// ============================================================
const apiKeyInput = document.getElementById('apiKeyInput');
const saveKeyBtn = document.getElementById('saveKeyBtn');
const keySavedBadge = document.getElementById('keySavedBadge');
const testKeyBtn = document.getElementById('testKeyBtn');
const historySelect = document.getElementById('historySelect');
const historyCount = document.getElementById('historyCount');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const reviewTextarea = document.getElementById('reviewText');
const charCount = document.getElementById('charCount');
const clearTextBtn = document.getElementById('clearTextBtn');
const startBtn = document.getElementById('startBtn');
const exportBtn = document.getElementById('exportBtn');
const statusBox = document.getElementById('statusBox');
const downloadLink = document.getElementById('downloadLink');

// Section toggles
const sectionApi = document.getElementById('sectionApi');
const sectionHistory = document.getElementById('sectionHistory');
const sectionAction = document.getElementById('sectionAction');

// Quick select buttons
const quickSelectGroup = document.getElementById('quickSelectGroup');

// ============================================================
// STORAGE KEYS
// ============================================================
const STORAGE_API_KEY = 'apiKey';
const STORAGE_HISTORY = 'reviewHistory';

// ============================================================
// DEBUG — Check chrome API availability
// ============================================================
(function debugChrome() {
  if (typeof chrome === 'undefined' || !chrome.storage) {
    document.body.innerHTML = '<div style="padding:20px;font-family:sans-serif;color:red;">Lỗi: chrome API không khả dụng.<br>Bấm Reload ở chrome://extensions/</div>';
  }
})();

// ============================================================
// STORAGE HELPERS
// ============================================================
async function getApiKey() {
  try {
    const result = await chrome.storage.local.get(STORAGE_API_KEY);
    return result[STORAGE_API_KEY] || '';
  } catch (err) {
    console.error('[Storage] getApiKey error:', err);
    return '';
  }
}

async function saveApiKey(key) {
  await chrome.storage.local.set({ [STORAGE_API_KEY]: key.trim() });
}

async function getHistory() {
  try {
    const result = await chrome.storage.local.get(STORAGE_HISTORY);
    return result[STORAGE_HISTORY] || [];
  } catch (err) {
    console.error('[Storage] getHistory error:', err);
    return [];
  }
}

async function saveHistory(history) {
  await chrome.storage.local.set({ [STORAGE_HISTORY]: history });
}

// ============================================================
// UI HELPERS
// ============================================================
function setLoading(loading) {
  startBtn.disabled = loading;
  reviewTextarea.disabled = loading;
  // Also disable/enable quick select buttons during AI processing
  quickSelectGroup.querySelectorAll('.quick-btn').forEach((b) => (b.disabled = loading));
  if (loading) {
    startBtn.classList.add('loading');
    startBtn.querySelector('.btn-text').textContent = 'Đang xử lý AI...';
  } else {
    startBtn.classList.remove('loading');
    startBtn.querySelector('.btn-text').textContent = 'Điền form bằng AI';
  }
}

function setKeySavedState(saved) {
  if (saved) {
    saveKeyBtn.classList.add('saved');
    saveKeyBtn.dataset.state = 'saved';
    if (keySavedBadge) keySavedBadge.classList.add('visible');
  } else {
    saveKeyBtn.classList.remove('saved');
    saveKeyBtn.dataset.state = 'idle';
    if (keySavedBadge) keySavedBadge.classList.remove('visible');
  }
}

function showStatus(msg, type = 'info') {
  statusBox.textContent = msg;
  statusBox.className = `status-box ${type}`;
}

function clearStatus() {
  statusBox.className = 'status-box';
  statusBox.textContent = '';
}

function setExportEnabled(enabled) {
  exportBtn.disabled = !enabled;
}

// ============================================================
// COLLAPSIBLE SECTIONS
// ============================================================
function setupSectionToggles() {
  [sectionApi, sectionHistory, sectionAction].forEach((btn) => {
    if (!btn) return;
    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
    });
  });
}

// ============================================================
// HISTORY MANAGEMENT
// ============================================================
async function loadHistoryUI() {
  const history = await getHistory();

  // Populate dropdown
  historySelect.innerHTML = '<option value="">— Chọn nhận xét đã lưu —</option>';
  history.forEach((item, idx) => {
    const preview = item.text.length > 60 ? item.text.substring(0, 60) + '...' : item.text;
    const date = new Date(item.timestamp).toLocaleDateString('vi-VN');
    const option = document.createElement('option');
    option.value = String(idx);
    option.textContent = `${date} — ${preview}`;
    historySelect.appendChild(option);
  });

  // Update badge
  if (history.length > 0) {
    historyCount.textContent = history.length;
    historyCount.style.display = 'inline';
    clearHistoryBtn.disabled = false;
  } else {
    historyCount.style.display = 'none';
    clearHistoryBtn.disabled = true;
  }
}

async function addToHistory(reviewText) {
  const history = await getHistory();

  // Deduplication: skip if exact match already exists
  const exists = history.some((h) => h.text === reviewText);
  if (exists) return;

  // Keep only the last 20 items
  history.unshift({ text: reviewText, timestamp: Date.now() });
  if (history.length > 20) history.length = 20;

  await saveHistory(history);
  await loadHistoryUI();
}

async function clearHistory() {
  await saveHistory([]);
  await loadHistoryUI();
  showStatus('Đã xóa lịch sử nhận xét.', 'info');
}

// ============================================================
// QUICK FILL — Apply same score to ALL questions (no AI)
// ============================================================
async function quickFill(tabId, score) {
  // Activate clicked button visually
  quickSelectGroup.querySelectorAll('.quick-btn').forEach((btn) => btn.classList.remove('active'));
  const clickedBtn = quickSelectGroup.querySelector(`[data-score="${score}"]`);
  if (clickedBtn) clickedBtn.classList.add('active');

  clearStatus();
  showStatus(`Đang chọn nhanh điểm ${score} cho tất cả câu...`, 'info');

  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: (score) => {
        let filled = 0;

        // Find all .table-cauhoi tables and click the matching radio per question
        const tables = document.querySelectorAll('.table-cauhoi');
        tables.forEach((table) => {
          // Find the radio button ending with dapanN where N = score
          const targetRadio = table.querySelector(`input[id$="dapan${score}"]`);
          if (targetRadio) {
            targetRadio.click();
            targetRadio.dispatchEvent(new Event('change', { bubbles: true }));
            targetRadio.dispatchEvent(new Event('input', { bubbles: true }));
            filled++;
          }
        });

        return { filled };
      },
      args: [score],
    });

    const result = results[0].result;

    // Clear active state after a short delay
    setTimeout(() => {
      quickSelectGroup.querySelectorAll('.quick-btn').forEach((btn) => btn.classList.remove('active'));
    }, 2000);

    if (result.filled === 0) {
      showStatus('Không tìm thấy câu hỏi nào trên trang.', 'warning');
    } else {
      showStatus(`Đã chọn nhanh điểm ${score} cho ${result.filled} câu!`, 'success');
    }
  } catch (err) {
    console.error('[QuickFill] error:', err);
    showStatus(`Lỗi: ${err.message}`, 'error');
    quickSelectGroup.querySelectorAll('.quick-btn').forEach((btn) => btn.classList.remove('active'));
  }
}

// ============================================================
// SCRAPE QUESTIONS — Returns full question data for export
// ============================================================
async function scrapeQuestions(tabId) {
  const results = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      const questions = [];
      const tables = document.querySelectorAll('.table-cauhoi');
      tables.forEach((table, index) => {
        const strong = table.querySelector('strong');
        if (!strong) return;
        const radio = table.querySelector('input[type="radio"]');
        if (!radio) return;
        const match = radio.id.match(/^cauhoi(\d+)dapan\d+$/);
        if (!match) return;
        questions.push({
          id: match[1],
          text: strong.textContent.trim(),
          order: index + 1,
        });
      });
      return questions;
    },
  });
  return results[0].result;
}

// ============================================================
// LLM API CALL
// ============================================================
async function callLLM(apiKey, userReview, questions) {
  const questionsList = questions.map((q) => `${q.id}. ${q.text}`).join('\n');

  const prompt = `Bạn là hệ thống NLP. Đánh giá nhận xét: '${userReview}' và chấm điểm tiêu chí 1-5 (1: Rất không hài lòng, 5: Rất hài lòng). Nếu không nhắc đến, mặc định 4.
Danh sách: ${questionsList}.
Trả về DUY NHẤT 1 OBJECT JSON: {"ID": Score}.`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.1, topP: 0.8, topK: 40 },
  };

  const maxRetries = 3;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    if (response.ok) {
      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error('Không nhận được phản hồi từ LLM.');

      // DEFENSIVE PARSING — strip markdown / trailing text
      let jsonStr = rawText
        .trim()
        .replace(/```json?\s*/gi, '')
        .replace(/```\s*/g, '')
        .replace(/^[^{]*/, '')
        .replace(/[^}]*$/, '')
        .trim();

      try {
        return JSON.parse(jsonStr);
      } catch {
        const match = jsonStr.match(/\{[\s\S]*\}/);
        if (match) {
          try {
            return JSON.parse(match[0]);
          } catch {
            throw new Error(`Phản hồi LLM không hợp lệ: ${jsonStr.substring(0, 80)}...`);
          }
        }
        throw new Error(`Phản hồi LLM không parse được JSON: ${jsonStr.substring(0, 80)}...`);
      }
    }

    if (response.status === 429 && attempt < maxRetries) {
      const delay = Math.min(2000 * Math.pow(2, attempt), 30000);
      showStatus(`Rate limit — thử lại sau ${Math.round(delay / 1000)}s...`, 'warning');
      await new Promise((r) => setTimeout(r, delay));
      continue;
    }

    const errText = await response.text();
    throw new Error(`LLM API error ${response.status}: ${errText.substring(0, 120)}`);
  }
}

// ============================================================
// FILL FORM — Angular-safe radio button selection
// ============================================================
async function fillForm(tabId, scores) {
  const results = await chrome.scripting.executeScript({
    target: { tabId },
    func: (scores) => {
      let filled = 0;
      const errors = [];
      for (const [questionId, score] of Object.entries(scores)) {
        const s = parseInt(score, 10);
        if (isNaN(s) || s < 1 || s > 5) {
          errors.push(`ID ${questionId}: điểm không hợp lệ (${score})`);
          continue;
        }
        const radioId = `cauhoi${questionId}dapan${s}`;
        const radio = document.getElementById(radioId);
        if (!radio) {
          errors.push(`ID ${questionId}: không tìm thấy radio "${radioId}"`);
          continue;
        }
        // Angular bypass: use click() + dispatchEvent()
        radio.click();
        radio.dispatchEvent(new Event('change', { bubbles: true }));
        radio.dispatchEvent(new Event('input', { bubbles: true }));
        filled++;
      }
      return { filled, total: Object.keys(scores).length, errors };
    },
    args: [scores],
  });
  return results[0].result;
}

// ============================================================
// EXPORT CSV — Download results as CSV file
// ============================================================
function exportCSV(questions, scores) {
  const scoreLabels = { 1: 'Rất không hài lòng', 2: 'Không hài lòng', 3: 'Phân vân', 4: 'Hài lòng', 5: 'Rất hài lòng' };

  // BOM for UTF-8 Vietnamese
  const BOM = '\uFEFF';
  const rows = [
    ['STT', 'ID Câu hỏi', 'Nội dung câu hỏi', 'Điểm', 'Mức độ'],
  ];

  questions.forEach((q) => {
    const score = parseInt(scores[q.id], 10);
    rows.push([
      q.order,
      q.id,
      `"${q.text.replace(/"/g, '""')}"`,
      isNaN(score) ? '' : score,
      scoreLabels[score] || '',
    ]);
  });

  const csvContent = BOM + rows.map((row) => row.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const timestamp = new Date().toISOString().slice(0, 10);

  downloadLink.href = URL.createObjectURL(blob);
  downloadLink.download = `ket_qua_danh_gia_${timestamp}.csv`;
  downloadLink.click();
  URL.revokeObjectURL(downloadLink.href);

  showStatus(`Đã xuất file CSV (${questions.length} câu).`, 'success');
}

// ============================================================
// MAIN WORKFLOW
// ============================================================
startBtn.addEventListener('click', async () => {
  const userReview = reviewTextarea.value.trim();

  if (!userReview) {
    showStatus('Vui lòng nhập nhận xét trước khi bắt đầu.', 'error');
    return;
  }

  const apiKey = await getApiKey();
  if (!apiKey) {
    showStatus('Chưa có API key. Vui lòng nhập và lưu Gemini API key trước.', 'error');
    return;
  }

  setLoading(true);
  setExportEnabled(false);
  lastResult = null;
  clearStatus();
  showStatus('Đang scrape câu hỏi từ form...', 'info');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error('Không tìm thấy tab hoạt động.');

    const questions = await scrapeQuestions(tab.id);
    if (!questions.length) {
      throw new Error('Không tìm thấy câu hỏi nào. Hãy đảm bảo bạn đang ở trang form đánh giá.');
    }
    showStatus(`Tìm thấy ${questions.length} câu hỏi. Đang gọi AI...`, 'info');

    const scores = await callLLM(apiKey, userReview, questions);
    showStatus('Nhận kết quả từ AI. Đang điền form...', 'info');

    const result = await fillForm(tab.id, scores);

    // Save to history on success
    if (result.filled > 0) {
      await addToHistory(userReview);
    }

    // Store result for export
    lastResult = { questions, scores, timestamp: Date.now() };
    setExportEnabled(true);

    if (result.errors.length && result.filled === 0) {
      showStatus(`Lỗi: ${result.errors[0]}`, 'error');
    } else if (result.filled < result.total) {
      showStatus(`Hoàn tất! Đã điền ${result.filled}/${result.total} câu.`, 'warning');
    } else {
      showStatus(`Hoàn tất! Đã điền ${result.filled}/${result.total} câu hỏi!`, 'success');
    }
  } catch (err) {
    console.error('[Main] Workflow error:', err);
    showStatus(`Lỗi: ${err.message}`, 'error');
  } finally {
    setLoading(false);
  }
});

// ============================================================
// EXPORT BUTTON
// ============================================================
exportBtn.addEventListener('click', () => {
  if (!lastResult) {
    showStatus('Chưa có kết quả để xuất. Hãy chạy "Điền form" trước.', 'warning');
    return;
  }
  exportCSV(lastResult.questions, lastResult.scores);
});

// ============================================================
// SAVE KEY BUTTON
// ============================================================
saveKeyBtn.addEventListener('click', async () => {
  const key = apiKeyInput.value.trim();
  if (!key) {
    showStatus('Vui lòng nhập API key trước khi lưu.', 'error');
    return;
  }

  saveKeyBtn.dataset.state = 'saving';
  saveKeyBtn.disabled = true;

  try {
    await saveApiKey(key);
    saveKeyBtn.dataset.state = 'saved';
    setKeySavedState(true);
    showStatus('Đã lưu API key thành công!', 'success');

    setTimeout(() => {
      saveKeyBtn.dataset.state = 'idle';
      setKeySavedState(true);
    }, 2000);
  } catch (err) {
    saveKeyBtn.dataset.state = 'idle';
    saveKeyBtn.disabled = false;
    showStatus(`Lỗi khi lưu: ${err.message}`, 'error');
  } finally {
    saveKeyBtn.disabled = false;
  }
});

// ============================================================
// TEST KEY BUTTON
// ============================================================
testKeyBtn.addEventListener('click', async () => {
  const savedKey = await getApiKey();
  const inputKey = apiKeyInput.value.trim();
  const apiKey = inputKey || savedKey;

  if (!apiKey) {
    showStatus('Vui lòng nhập và lưu API key trước.', 'error');
    return;
  }

  testKeyBtn.disabled = true;
  testKeyBtn.classList.add('testing');
  testKeyBtn.classList.remove('valid', 'invalid');
  clearStatus();

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: 'Hi' }] }] }),
      }
    );

    if (response.ok) {
      testKeyBtn.classList.remove('testing');
      testKeyBtn.classList.add('valid');
      showStatus('API Key hợp lệ!', 'success');
    } else {
      testKeyBtn.classList.remove('testing');
      testKeyBtn.classList.add('invalid');
      showStatus(`API Key không hợp lệ hoặc hết hạn (HTTP ${response.status})`, 'error');
    }
  } catch (err) {
    testKeyBtn.classList.remove('testing');
    testKeyBtn.classList.add('invalid');
    showStatus(`Không thể kết nối: ${err.message}`, 'error');
  } finally {
    testKeyBtn.disabled = false;
  }
});

// ============================================================
// HISTORY SELECT — Auto-fill textarea on selection
// ============================================================
historySelect.addEventListener('change', async () => {
  const idx = parseInt(historySelect.value, 10);
  if (isNaN(idx) || idx < 0) return;

  const history = await getHistory();
  if (history[idx]) {
    reviewTextarea.value = history[idx].text;
    charCount.textContent = reviewTextarea.value.length;
    clearTextBtn.style.display = reviewTextarea.value ? 'inline-flex' : 'none';
  }

  // Reset dropdown
  historySelect.value = '';
});

// ============================================================
// CLEAR HISTORY BUTTON
// ============================================================
clearHistoryBtn.addEventListener('click', async () => {
  await clearHistory();
});

// ============================================================
// QUICK SELECT BUTTONS — Bulk fill all questions with same score
// ============================================================
quickSelectGroup.addEventListener('click', async (e) => {
  const btn = e.target.closest('.quick-btn');
  if (!btn || btn.disabled) return;

  const score = parseInt(btn.dataset.score, 10);

  // Disable all quick buttons during processing
  quickSelectGroup.querySelectorAll('.quick-btn').forEach((b) => (b.disabled = true));

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error('Không tìm thấy tab hoạt động.');
    await quickFill(tab.id, score);
  } finally {
    quickSelectGroup.querySelectorAll('.quick-btn').forEach((b) => (b.disabled = false));
  }
});

// ============================================================
// TEXTAREA EVENTS
// ============================================================
reviewTextarea.addEventListener('input', () => {
  charCount.textContent = reviewTextarea.value.length;
  clearTextBtn.style.display = reviewTextarea.value ? 'inline-flex' : 'none';
});

clearTextBtn.addEventListener('click', () => {
  reviewTextarea.value = '';
  charCount.textContent = '0';
  clearTextBtn.style.display = 'none';
});

// ============================================================
// INIT — Load saved key + history on popup open
// ============================================================
async function init() {
  console.log('[Init] Popup opening...');

  // Setup collapsible sections
  setupSectionToggles();

  // Load API key
  const savedKey = await getApiKey();
  if (savedKey) {
    apiKeyInput.value = savedKey;
    setKeySavedState(true);
  }

  // Load history
  await loadHistoryUI();

  // Export button starts disabled
  setExportEnabled(false);
}

init();
