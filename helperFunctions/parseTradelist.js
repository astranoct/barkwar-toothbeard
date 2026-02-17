/**
 * Parses a tradelist string into high and low priority arrays.
 * Expects format:
 * High:
 * Card Name 1
 * Card Name 2
 *
 * Low:
 * Card Name 3
 */
function parseTradelist(input) {
  const highPrio = [];
  const lowPrio = [];

  let current = null;

  input.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return; // skip empty lines

    if (/^Need:/i.test(trimmed)) {
      current = highPrio;
      return;
    }

    if (/^Want:/i.test(trimmed)) {
      current = lowPrio;
      return;
    }

    if (current) {
      current.push(trimmed);
    }
  });

  return { highPrio, lowPrio };
}

module.exports = {
  parseTradelist,
};
