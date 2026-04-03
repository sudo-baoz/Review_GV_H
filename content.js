/**
 * CONTENT SCRIPT — Reference document
 *
 * This file is NOT registered as a content script in manifest.json.
 * The scraping and filling logic runs inline via chrome.scripting.executeScript()
 * in popup.js. This file is kept for reference and documentation.
 *
 * Angular compatibility: Always use element.click() + dispatchEvent() instead of
 * setting element.checked = true directly.
 */

// ============================================================
// SCRAPE QUESTIONS
// Extracts all questions from .table-cauhoi elements
// Returns: Array<{ id: string, text: string, order: number }>
// ============================================================
function scrapeQuestions() {
  const questions = [];
  const tables = document.querySelectorAll('.table-cauhoi');

  tables.forEach((table, index) => {
    const strong = table.querySelector('strong');
    if (!strong) return;

    const radio = table.querySelector('input[type="radio"]');
    if (!radio) return;

    // Parse ID from "cauhoi1850dapan1" -> "1850"
    const match = radio.id.match(/^cauhoi(\d+)dapan\d+$/);
    if (!match) return;

    questions.push({
      id: match[1],
      text: strong.textContent.trim(),
      order: index + 1,
    });
  });

  return questions;
}

// ============================================================
// FILL FORM
// Selects radio buttons based on LLM scores
// Input: { questionId: score (1-5), ... }
// Returns: { filled, total, errors }
// ============================================================
function fillForm(scores) {
  let filled = 0;
  const errors = [];

  for (const [questionId, score] of Object.entries(scores)) {
    const s = parseInt(score, 10);

    if (isNaN(s) || s < 1 || s > 5) {
      errors.push(`ID ${questionId}: điểm không hợp lệ (${score})`);
      continue;
    }

    // Construct radio ID: questionId=1850, score=4 -> "cauhoi1850dapan4"
    const radioId = `cauhoi${questionId}dapan${s}`;
    const radio = document.getElementById(radioId);

    if (!radio) {
      errors.push(`ID ${questionId}: không tìm thấy radio "${radioId}"`);
      continue;
    }

    // Angular bypass: trigger two-way binding via click() + events
    radio.click();
    radio.dispatchEvent(new Event('change', { bubbles: true }));
    radio.dispatchEvent(new Event('input', { bubbles: true }));

    filled++;
  }

  return { filled, total: Object.keys(scores).length, errors };
}
