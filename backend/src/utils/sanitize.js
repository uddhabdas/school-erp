/**
 * Escapes regex special characters to prevent ReDoS and regex injection errors.
 * @param {string} str
 * @returns {string}
 */
const escapeRegex = (str) => {
  if (typeof str !== 'string') return '';
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

module.exports = {
  escapeRegex,
};
