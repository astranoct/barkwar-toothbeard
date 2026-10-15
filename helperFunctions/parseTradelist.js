/**
 * Parses a tradelist string into high and low priority arrays.
 * Expects format:
 * Need:
 * Card Name 1
 * Card Name 2
 *
 * Want:
 * Card Name 3
 *
 * Header matching is case-insensitive. Duplicate cards within a section are removed.
 */
function parseTradelist(input) {
  const highPrio = [];
  const lowPrio = [];

  let current = null;

  input.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return; // skip empty lines

    if (/^Need:?$/i.test(trimmed)) {
      current = highPrio;
      return;
    }

    if (/^Want:?$/i.test(trimmed)) {
      current = lowPrio;
      return;
    }

    if (current && !current.some(card => card.toLowerCase() === trimmed.toLowerCase())) {
      current.push(trimmed);
    }
  });

  return { highPrio, lowPrio };
}

module.exports = {
  parseTradelist,
};
