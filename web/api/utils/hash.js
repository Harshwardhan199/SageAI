const crypto = require("crypto");

/**
 * Creates a deterministic SHA-256 hash string for caching.
 * @param {string|object} data Data to hash
 * @returns {string} SHA-256 hex digest
 */
function createHash(data) {
  const text = typeof data === "object" ? JSON.stringify(data) : String(data);
  return crypto.createHash("sha256").update(text).digest("hex");
}

module.exports = { createHash };
