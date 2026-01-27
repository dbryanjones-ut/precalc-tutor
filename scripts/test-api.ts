/**
 * API Test Script
 *
 * Tests all API endpoints to verify functionality.
 * Run with: npx tsx scripts/test-api.ts
 */

const API_BASE = process.env.API_BASE_URL || "http://localhost:3000";

interface TestResult {
  endpoint: string;
  method: string;
  status: "PASS" | "FAIL" | "SKIP";
  statusCode?: number;
  message?: string;
  duration?: number;
}

const results: TestResult[] = [];

function logResult(result: TestResult) {
  const emoji = result.status === "PASS" ? "✅" : result.status === "FAIL" ? "❌" : "⏭️";
  console.log(
    `${emoji} ${result.method} ${result.endpoint} - ${result.status}${
      result.duration ? ` (${result.duration}ms)` : ""
    }`
  );
  if (result.message) {
    console.log(`   ${result.message}`);
  }
  results.push(result);
}

async function testEndpoint(
  endpoint: string,
  method: string,
  body?: unknown,
  expectedStatus = 200
): Promise<TestResult> {
  const startTime = Date.now();

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : {},
      body: body ? JSON.stringify(body) : undefined,
    });

    const duration = Date.now() - startTime;
    const data = await response.json();

    if (response.status === expectedStatus) {
      return {
        endpoint,
        method,
        status: "PASS",
        statusCode: response.status,
        duration,
      };
    } else {
      return {
        endpoint,
        method,
        status: "FAIL",
        statusCode: response.status,
        message: `Expected ${expectedStatus}, got ${response.status}: ${
          data.error?.message || "Unknown error"
        }`,
        duration,
      };
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      endpoint,
      method,
      status: "FAIL",
      message: error instanceof Error ? error.message : "Unknown error",
      duration,
    };
  }
}

async function runTests() {
  console.log("🚀 Starting API Tests\n");
  console.log(`Testing against: ${API_BASE}\n`);

  // Check if ANTHROPIC_API_KEY is set
  const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY;
  console.log(
    `Anthropic API Key: ${hasAnthropicKey ? "✅ Set" : "❌ Not set"}\n`
  );

  // ===========================================
  // AI Tutor API Tests
  // ===========================================
  console.log("📚 Testing AI Tutor API\n");

  if (hasAnthropicKey) {
    // Test valid request
    logResult(
      await testEndpoint("/api/ai/tutor", "POST", {
        message: "What is 2 + 2?",
        mode: "socratic",
      })
    );

    // Test with context
    logResult(
      await testEndpoint("/api/ai/tutor", "POST", {
        message: "How do I factor this?",
        mode: "explanation",
        context: {
          extractedProblem: "x^2 + 5x + 6",
          messageHistory: [],
        },
      })
    );

    // Test invalid mode
    logResult(
      await testEndpoint(
        "/api/ai/tutor",
        "POST",
        {
          message: "Test",
          mode: "invalid",
        },
        400
      )
    );

    // Test empty message
    logResult(
      await testEndpoint(
        "/api/ai/tutor",
        "POST",
        {
          message: "",
          mode: "socratic",
        },
        400
      )
    );

    // Test message too long
    logResult(
      await testEndpoint(
        "/api/ai/tutor",
        "POST",
        {
          message: "a".repeat(6000),
          mode: "socratic",
        },
        400
      )
    );
  } else {
    console.log("⏭️  Skipping AI Tutor tests (no API key)\n");
  }

  // ===========================================
  // OCR API Tests
  // ===========================================
  console.log("\n🖼️  Testing OCR API\n");

  // Test invalid image (empty)
  logResult(
    await testEndpoint(
      "/api/ocr",
      "POST",
      {
        image: "",
      },
      400
    )
  );

  // Test invalid image format
  logResult(
    await testEndpoint(
      "/api/ocr",
      "POST",
      {
        image: "not-a-valid-base64",
      },
      400
    )
  );

  // Test with valid base64 (but no API key will likely fail)
  const validBase64 =
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAAA//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AH//Z";

  if (hasAnthropicKey) {
    // Will use Claude Vision as fallback
    logResult(
      await testEndpoint("/api/ocr", "POST", {
        image: validBase64,
        options: {
          validateLatex: true,
        },
      })
    );
  } else {
    console.log("⏭️  Skipping OCR tests (no API key)\n");
  }

  // ===========================================
  // Sessions API Tests
  // ===========================================
  console.log("\n📊 Testing Sessions API\n");

  // Test GET sessions (empty)
  logResult(await testEndpoint("/api/sessions", "GET"));

  // Test GET with pagination
  logResult(
    await testEndpoint("/api/sessions?page=1&limit=10", "GET")
  );

  // Test GET with filters
  logResult(
    await testEndpoint(
      "/api/sessions?mode=socratic&completed=true&includeStats=true",
      "GET"
    )
  );

  // Test POST create session
  const createResult = await testEndpoint("/api/sessions", "POST", {
    extractedProblem: "Test problem: x^2 + 5x + 6 = 0",
    originalProblemText: "Solve the quadratic equation",
    mode: "socratic",
    messages: [
      {
        role: "user",
        content: "Help me solve this",
        timestamp: new Date().toISOString(),
      },
    ],
    duration: 120,
    questionsAsked: 3,
    hintsGiven: 1,
    completed: true,
    tags: ["quadratic", "test"],
    unit: "Unit 2",
  }, 201);

  logResult(createResult);

  // Get session ID from response (if successful)
  let sessionId: string | null = null;
  if (createResult.status === "PASS") {
    try {
      const response = await fetch(`${API_BASE}/api/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          extractedProblem: "Test problem for deletion",
          mode: "socratic",
          messages: [],
          duration: 0,
          questionsAsked: 0,
          hintsGiven: 0,
          completed: false,
        }),
      });
      const data = await response.json();
      sessionId = data.data?.id;
    } catch (error) {
      console.log("⚠️  Could not create session for deletion test");
    }
  }

  // Test DELETE session
  if (sessionId) {
    logResult(
      await testEndpoint(`/api/sessions?id=${sessionId}`, "DELETE")
    );
  } else {
    console.log("⏭️  Skipping DELETE test (no session ID)");
  }

  // Test DELETE with invalid ID
  logResult(
    await testEndpoint("/api/sessions?id=invalid-id", "DELETE", undefined, 400)
  );

  // Test DELETE with non-existent ID
  logResult(
    await testEndpoint(
      "/api/sessions?id=session-99999999999",
      "DELETE",
      undefined,
      404
    )
  );

  // Test POST with invalid data
  logResult(
    await testEndpoint(
      "/api/sessions",
      "POST",
      {
        extractedProblem: "", // Empty problem
        mode: "socratic",
        messages: [],
        duration: 0,
        questionsAsked: 0,
        hintsGiven: 0,
        completed: false,
      },
      400
    )
  );

  // ===========================================
  // Rate Limiting Tests
  // ===========================================
  console.log("\n⏱️  Testing Rate Limiting\n");

  if (hasAnthropicKey && process.env.DISABLE_RATE_LIMIT !== "true") {
    console.log("Making 12 rapid requests to test rate limit...");

    let rateLimitHit = false;
    for (let i = 0; i < 12; i++) {
      const result = await testEndpoint("/api/ai/tutor", "POST", {
        message: `Test ${i}`,
        mode: "socratic",
      });

      if (result.statusCode === 429) {
        rateLimitHit = true;
        logResult({
          endpoint: "/api/ai/tutor",
          method: "POST",
          status: "PASS",
          message: "Rate limit enforced correctly",
        });
        break;
      }
    }

    if (!rateLimitHit) {
      logResult({
        endpoint: "/api/ai/tutor",
        method: "POST",
        status: "FAIL",
        message: "Rate limit not enforced after 12 requests",
      });
    }
  } else {
    console.log("⏭️  Skipping rate limit tests (no API key or disabled)\n");
  }

  // ===========================================
  // Summary
  // ===========================================
  console.log("\n" + "=".repeat(60));
  console.log("📊 Test Summary");
  console.log("=".repeat(60) + "\n");

  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => r.status === "FAIL").length;
  const skipped = results.filter((r) => r.status === "SKIP").length;
  const total = results.length;

  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(
    `\nSuccess Rate: ${((passed / (total - skipped)) * 100).toFixed(1)}%`
  );

  if (failed > 0) {
    console.log("\n❌ Failed Tests:");
    results
      .filter((r) => r.status === "FAIL")
      .forEach((r) => {
        console.log(`   ${r.method} ${r.endpoint}`);
        if (r.message) console.log(`      ${r.message}`);
      });
  }

  console.log("\n" + "=".repeat(60));

  // Exit with error code if tests failed
  if (failed > 0) {
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  console.error("❌ Test runner error:", error);
  process.exit(1);
});
