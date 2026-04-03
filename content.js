// ============================================================
// CONTENT SCRIPT — Runs in the context of the target page
// Handles DOM scraping and Angular-safe form filling
// ============================================================

/**
 * Scrape all evaluation questions from the page.
 * Finds .table-cauhoi tables, extracts text from <strong>,
 * and parses question ID from radio input IDs.
 */
function scrapeQuestions() {
  const questions = [];
  const tables = document.querySelectorAll('.table-cauhoi');

  tables.forEach((table) => {
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
    });
  });

  return questions;
}

/**
 * Fill radio buttons based on scores from LLM response.
 * Uses click() + dispatchEvent() to properly trigger Angular's
 * two-way binding instead of just setting checked = true.
 * @param {Object} scores - { questionId: score (1-5), ... }
 */
function fillForm(scores) {
  let filled = 0;
  const errors = [];

  for (const [questionId, score] of Object.entries(scores)) {
    const s = parseInt(score, 10);

    if (isNaN(s) || s < 1 || s > 5) {
      errors.push(`ID ${questionId}: điểm không hợp lệ (${score})`);
      continue;
    }

    // Construct the radio button ID from question ID + score
    // e.g. questionId=1850, score=4 -> "cauhoi1850dapan4"
    const radioId = `cauhoi${questionId}dapan${s}`;
    const radio = document.getElementById(radioId);

    if (!radio) {
      errors.push(`ID ${questionId}: không tìm thấy radio "${radioId}"`);
      continue;
    }

    // Trigger Angular's two-way binding via click()
    radio.click();

    // Dispatch events as fallback for Angular change detection
    radio.dispatchEvent(new Event('change', { bubbles: true }));
    radio.dispatchEvent(new Event('input', { bubbles: true }));

    filled++;
  }

  return { filled, total: Object.keys(scores).length, errors };
}
