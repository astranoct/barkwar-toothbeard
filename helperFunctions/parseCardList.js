/**
 * Parses pasted text into a list of card names: one card per line.
 * - Blank lines are skipped.
 * - Leading bullets ("-", "*") and quantities ("2 ", "2x ") are stripped.
 * - Old-style "Need:" / "Want:" header lines are ignored, so previously saved lists still paste in fine.
 * - Duplicates (case-insensitive) are removed.
 * @param {string} input
 * @returns {string[]}
 */
function parseCardList(input) {
  const cards = [];
  const seen = new Set();

  for (const line of input.split(/\r?\n/)) {
    const name = line
      .trim()
      .replace(/^[-*•]\s+/, '')
      .replace(/^\d{1,2}x?\s+/i, '')
      .trim();

    if (!name || /^(need|want)s?:?$/i.test(name)) continue;

    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    cards.push(name);
  }

  return cards;
}

module.exports = {
  parseCardList,
};
