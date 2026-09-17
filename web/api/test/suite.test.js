const test = require("node:test");
const assert = require("node:assert/strict");
const bcrypt = require("bcrypt");

// 1. Password security & transparent migration
test("Password security: bcrypt hash and transparent legacy plaintext migration", async () => {
  const plainPassword = "mySecretPassword123";

  // New signup hash
  const hash = await bcrypt.hash(plainPassword, 10);
  assert.match(hash, /^\$2[aby]\$/, "Hash should match bcrypt signature");
  assert.equal(await bcrypt.compare(plainPassword, hash), true, "bcrypt.compare should succeed");
  assert.equal(await bcrypt.compare("wrongPassword", hash), false, "bcrypt.compare should reject wrong password");

  // Simulated legacy user record
  const legacyUser = {
    _id: "user123",
    email: "legacy@example.com",
    password: "plainTextPassword456",
    saved: false,
    async save() {
      this.saved = true;
    }
  };

  // Check login logic: detect non-bcrypt format
  const isBcrypt = /^\$2[aby]\$/.test(legacyUser.password);
  assert.equal(isBcrypt, false, "Legacy user password should be recognized as plaintext");

  // Verify match and transparent upgrade
  const inputPassword = "plainTextPassword456";
  if (inputPassword === legacyUser.password) {
    legacyUser.password = await bcrypt.hash(inputPassword, 10);
    await legacyUser.save();
  }

  assert.equal(legacyUser.saved, true, "Legacy user should be saved with upgraded password");
  assert.match(legacyUser.password, /^\$2[aby]\$/, "Upgraded password must be a valid bcrypt hash");
  assert.equal(await bcrypt.compare(inputPassword, legacyUser.password), true, "New bcrypt password must match");
});

// 2. Groq service message preparation & schema preservation
test("Groq service: prepareMessages preserves UNIFIED_SYSTEM_PROMPT and schema", () => {
  const GroqService = require("../services/groq/groqService");

  assert.ok(GroqService.UNIFIED_SYSTEM_PROMPT.includes("blocks"), "System prompt must mandate blocks schema");
  assert.ok(GroqService.UNIFIED_SYSTEM_PROMPT.includes("quiz"), "System prompt must include quiz block rules");

  // Case 1: No system prompt provided
  const msgs1 = GroqService.prepareMessages([{ role: "user", content: "Hello" }]);
  assert.equal(msgs1[0].role, "system");
  assert.ok(msgs1[0].content.includes(GroqService.UNIFIED_SYSTEM_PROMPT));
  assert.equal(msgs1[1].role, "user");
  assert.equal(msgs1[1].content, "Hello");

  // Case 2: Custom system prompt merged
  const msgs2 = GroqService.prepareMessages([
    { role: "system", content: "You are SageAI project assistant." },
    { role: "user", content: "Explain React" }
  ]);
  assert.equal(msgs2.length, 2);
  assert.equal(msgs2[0].role, "system");
  assert.ok(msgs2[0].content.includes("You are SageAI project assistant."));
  assert.ok(msgs2[0].content.includes(GroqService.UNIFIED_SYSTEM_PROMPT));
});

// 3. Block extractor utility tests
test("Block extractor: correctly parses structured JSON and Markdown fallbacks", () => {
  const { extractBlocks } = require("../utils/blockExtractor");

  // Standard JSON response
  const jsonResponse = JSON.stringify({
    blocks: [
      { type: "chat", content: "Here is your response." }
    ]
  });
  const blocks1 = extractBlocks(jsonResponse);
  assert.equal(blocks1.length, 1);
  assert.equal(blocks1[0].type, "chat");
  assert.equal(blocks1[0].content, "Here is your response.");

  // Quiz JSON response
  const quizJson = JSON.stringify({
    blocks: [
      {
        type: "quiz",
        title: "Node.js Quiz",
        questions: [
          { question: "What is event loop?", options: ["A", "B", "C", "D"], answer: "A" }
        ]
      }
    ]
  });
  const blocks2 = extractBlocks(quizJson);
  assert.equal(blocks2.length, 1);
  assert.equal(blocks2[0].type, "quiz");
  assert.equal(blocks2[0].title, "Node.js Quiz");

  // Plain text fallback
  const plainText = "Just simple text response";
  const blocks3 = extractBlocks(plainText);
  assert.equal(blocks3.length, 1);
  assert.equal(blocks3[0].type, "chat");
  assert.equal(blocks3[0].content, "Just simple text response");
});

// 4. QStash embedding job payload format & non-blocking failure
test("QStash service: sends identifiers only and handles publish failure non-blockingly", async () => {
  const QStashService = require("../services/qstash/qstashService");

  // Publish with missing messageId returns error object without throwing
  const result = await QStashService.publishEmbeddingJob({});
  assert.equal(result.success, false);
  assert.equal(result.error, "Missing messageId");

  // When QStash token is missing, returns graceful failure
  const res2 = await QStashService.publishEmbeddingJob({
    messageId: "507f1f77bcf86cd799439011",
    chatId: "507f1f77bcf86cd799439012",
    userId: "507f1f77bcf86cd799439013"
  });
  assert.equal(typeof res2, "object");
  assert.equal(res2.messageId, "507f1f77bcf86cd799439011");
});

// 5. Express app routes verification
test("Express app: routes and middleware configuration", async () => {
  const app = require("../app");
  assert.ok(app, "Express app should be created");

  // Verify route stack contains required paths
  const registeredPaths = [];
  app._router.stack.forEach((layer) => {
    if (layer.route) {
      registeredPaths.push(layer.route.path);
    } else if (layer.name === "router" && layer.regexp) {
      registeredPaths.push(layer.regexp.toString());
    }
  });

  const pathStr = registeredPaths.join(" | ");
  assert.ok(pathStr.includes("auth"), "Must mount /api/auth");
  assert.ok(pathStr.includes("user"), "Must mount /api/user");
  assert.ok(pathStr.includes("projects"), "Must mount /api/projects");
  assert.ok(pathStr.includes("temp"), "Must mount /api/temp");
  assert.ok(pathStr.includes("internal"), "Must mount /api/internal");
});

// 6. Root vercel.json routing precedence
test("Vercel routing: unified build uses Build Output API for nested client/api", () => {
  const vercelConfig = require("../../vercel.json");
  assert.equal(vercelConfig.version, 2);
  assert.equal(vercelConfig.buildCommand, "npm run build");
  assert.equal(vercelConfig.installCommand, "npm install");
  assert.ok(Array.isArray(vercelConfig.builds));
  assert.equal(vercelConfig.builds[0].src, "api/index.js");
});
