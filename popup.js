// ============================================================
// DEBUG — Check chrome API availability
// ============================================================
(function debugChrome() {
  console.log('chrome:', typeof chrome);
  console.log('chrome.storage:', typeof chrome?.storage);
  console.log('chrome.storage.local:', typeof chrome?.storage?.local);
  console.log('chrome.runtime:', typeof chrome?.runtime);
  console.log('chrome.runtime.lastError:', chrome?.runtime?.lastError);
  if (typeof chrome === 'undefined' || !chrome.storage) {
    document.body.innerHTML = '<div style="padding:20px;font-family:sans-serif;color:red;">Lỗi: chrome API không khả dụng.<br><br>Nguyên nhân có thể:<br>1. Extension chưa được reload — vào chrome://extensions bấm Reload<br>2. File popup.js bị lỗi syntax phía trên<br>3. Manifest không đúng version (phải là manifest v3)</div>';
  }
})();

// ============================================================
// DOM REFERENCES
// ============================================================
const apiKeyInput = document.getElementById('apiKeyInput');
const saveKeyBtn = document.getElementById('saveKeyBtn');
const keySavedBadge = document.getElementById('keySavedBadge');
const testKeyBtn = document.getElementById('testKeyBtn');
const reviewTextarea = document.getElementById('reviewText');
const startBtn = document.getElementById('startBtn');
const statusBox = document.getElementById('statusBox');
const charCount = document.getElementById('charCount');

// ============================================================
// STORAGE — Uses chrome.storage.local with key 'apiKey'
// ============================================================
const STORAGE_KEY = 'apiKey';

// Load API key from storage
async function getApiKey() {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    console.log('[Storage] getApiKey() result:', result);
    const key = result[STORAGE_KEY] || '';
    console.log('[Storage] Loaded API Key:', key ? `${key.substring(0, 8)}...` : '(empty)');
    return key;
  } catch (err) {
    console.error('[Storage] getApiKey() error:', err);
    return '';
  }
}

// Save API key to storage
async function saveApiKey(key) {
  try {
    await chrome.storage.local.set({ [STORAGE_KEY]: key.trim() });
    console.log('[Storage] saveApiKey() success for key:', key.substring(0, 8) + '...');
  } catch (err) {
    console.error('[Storage] saveApiKey() error:', err);
    throw err;
  }
}

// ============================================================
// INIT — Load saved key on popup open
// ============================================================
async function init() {
  console.log('[Init] Popup opening...');
  try {
    const savedKey = await getApiKey();
    if (savedKey) {
      console.log('[Init] Found saved key, auto-filling input');
      apiKeyInput.value = savedKey;
      setKeySavedState(true);
    } else {
      console.log('[Init] No saved key found, input is empty');
    }
  } catch (err) {
    console.error('[Init] init() error:', err);
  }
}

// ============================================================
// SAVE KEY BUTTON
// ============================================================
saveKeyBtn.addEventListener('click', async () => {
  console.log('[SaveBtn] Clicked');
  const key = apiKeyInput.value.trim();

  if (!key) {
    console.log('[SaveBtn] Empty input, showing error');
    showStatus('Vui lòng nhập API key trước khi lưu.', 'error');
    return;
  }

  // Show saving state
  saveKeyBtn.dataset.state = 'saving';
  saveKeyBtn.disabled = true;

  try {
    console.log('[SaveBtn] Saving key:', key.substring(0, 8) + '...');
    await saveApiKey(key);
    console.log('API Key saved successfully');

    // Show saved state
    saveKeyBtn.dataset.state = 'saved';
    saveKeyBtn.disabled = false;
    setKeySavedState(true);
    showStatus('Đã lưu API key thành công!', 'success');

    // Revert to idle after 2 seconds
    setTimeout(() => {
      saveKeyBtn.dataset.state = 'idle';
      setKeySavedState(true);
    }, 2000);
  } catch (err) {
    console.error('[SaveBtn] Save failed:', err);
    saveKeyBtn.dataset.state = 'idle';
    saveKeyBtn.disabled = false;
    showStatus(`Lỗi khi lưu: ${err.message}`, 'error');
  }
});

// ============================================================
// TEST API KEY BUTTON
// ============================================================
testKeyBtn.addEventListener('click', async () => {
  console.log('[TestBtn] Clicked');

  const savedKey = await getApiKey();
  const inputKey = apiKeyInput.value.trim();
  // Prefer input value over saved, fall back to saved if input is empty
  const apiKey = inputKey || savedKey;

  if (!apiKey) {
    console.log('[TestBtn] No key found, showing error');
    showStatus('Vui lòng nhập và lưu API key trước.', 'error');
    return;
  }

  console.log('[TestBtn] Testing key:', apiKey.substring(0, 8) + '...');

  // Set loading state
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

    console.log('[TestBtn] Response status:', response.status);

    if (response.ok) {
      testKeyBtn.classList.remove('testing');
      testKeyBtn.classList.add('valid');
      showStatus('API Key hợp lệ!', 'success');
    } else {
      testKeyBtn.classList.remove('testing');
      testKeyBtn.classList.add('invalid');
      const errBody = await response.text();
      console.log('[TestBtn] Error response:', errBody.substring(0, 100));
      showStatus(`API Key không hợp lệ hoặc hết hạn (HTTP ${response.status})`, 'error');
    }
  } catch (err) {
    testKeyBtn.classList.remove('testing');
    testKeyBtn.classList.add('invalid');
    console.error('[TestBtn] Network error:', err);
    showStatus(`Không thể kết nối: ${err.message}`, 'error');
  } finally {
    testKeyBtn.disabled = false;
  }
});

// ============================================================
// UI HELPERS
// ============================================================
function setLoading(loading) {
  startBtn.disabled = loading;
  reviewTextarea.disabled = loading;
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
    if (keySavedBadge) keySavedBadge.classList.add('visible');
  } else {
    saveKeyBtn.classList.remove('saved');
    if (keySavedBadge) keySavedBadge.classList.remove('visible');
  }
}

function showStatus(msg, type = 'info') {
  console.log(`[Status] [${type}] ${msg}`);
  statusBox.textContent = msg;
  statusBox.className = `status-box ${type}`;
}

function clearStatus() {
  statusBox.className = 'status-box';
  statusBox.textContent = '';
}

// Character counter
reviewTextarea.addEventListener('input', () => {
  charCount.textContent = reviewTextarea.value.length;
});

// ============================================================
// STEP 1: Scrape questions from active tab
// ============================================================
async function scrapeQuestions(tabId) {
  const results = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      const questions = [];
      const tables = document.querySelectorAll('.table-cauhoi');
      tables.forEach((table) => {
        const strong = table.querySelector('strong');
        if (!strong) return;
        const radio = table.querySelector('input[type="radio"]');
        if (!radio) return;
        const match = radio.id.match(/^cauhoi(\d+)dapan\d+$/);
        if (!match) return;
        questions.push({ id: match[1], text: strong.textContent.trim() });
      });
      return questions;
    },
  });
  return results[0].result;
}

// ============================================================
// STEP 2: Call Gemini LLM API with defensive JSON parsing
// ============================================================
async function callLLM(apiKey, userReview, questions) {
  const questionsList = questions.map((q) => `${q.id}. ${q.text}`).join('\n');

  const prompt = `Bạn là hệ thống phân tích NLP chuyên dụng. Nhiệm vụ của bạn là đánh giá nhận xét của sinh viên và chấm điểm các tiêu chí từ 1-5 (1: Rất không hài lòng, 5: Rất hài lòng).
QUY TẮC TỐI THƯỢNG:
1. Nếu tiêu chí KHÔNG được nhắc đến trong nhận xét, MẶC ĐỊNH CHỌN 4 ĐIỂM.
2. KHÔNG giải thích. KHÔNG thêm text. KHÔNG dùng markdown.
3. TRẢ VỀ DUY NHẤT 1 OBJECT JSON ĐÚNG CHUẨN.
Danh sách tiêu chí:
${questionsList}
Nhận xét: '${userReview}'
Cấu trúc bắt buộc (Ví dụ): {"1850": 5, "1851": 4}`;

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
// STEP 3: Fill the form in the target page
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
// MAIN: Orchestrate the full workflow
// ============================================================
startBtn.addEventListener('click', async () => {
  console.log('[Main] Start button clicked');
  const userReview = reviewTextarea.value.trim();

  if (!userReview) {
    console.log('[Main] Empty review, showing error');
    showStatus('Vui lòng nhập nhận xét trước khi bắt đầu.', 'error');
    return;
  }

  // Fetch the latest key from storage
  const apiKey = await getApiKey();
  console.log('[Main] API Key from storage:', apiKey ? `${apiKey.substring(0, 8)}...` : '(empty)');

  if (!apiKey) {
    console.log('[Main] No API key in storage, showing error');
    showStatus('Chưa có API key. Vui lòng nhập và lưu Gemini API key trước.', 'error');
    return;
  }

  setLoading(true);
  clearStatus();
  showStatus('Đang scrape câu hỏi từ form...', 'info');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error('Không tìm thấy tab hoạt động.');

    const questions = await scrapeQuestions(tab.id);
    console.log('[Main] Scraped questions:', questions.length);
    if (!questions.length) {
      throw new Error('Không tìm thấy câu hỏi nào. Hãy đảm bảo bạn đang ở trang form đánh giá.');
    }
    showStatus(`Tìm thấy ${questions.length} câu hỏi. Đang gọi AI...`, 'info');

    const scores = await callLLM(apiKey, userReview, questions);
    console.log('[Main] LLM returned scores:', scores);
    showStatus('Nhận kết quả từ AI. Đang điền form...', 'info');

    const result = await fillForm(tab.id, scores);
    console.log('[Main] Fill result:', result);

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
// BOOT
// ============================================================
init();
