/**
 * OCR API Route
 *
 * Processes images to extract LaTeX mathematical expressions.
 * Uses Mathpix OCR API with fallback validation.
 */

import { NextRequest, NextResponse } from "next/server";
import { ocrRequestSchema } from "@/lib/api/validation";
import {
  handleAPIError,
  requireEnv,
  ValidationError,
  RateLimitError,
  InternalServerError,
} from "@/lib/api/errors";
import {
  checkRateLimit,
  getRateLimitHeaders,
  RATE_LIMITS,
} from "@/lib/api/rate-limiter";
import { LatexValidator } from "@/lib/math/latex-validator";
import type { OCRResult } from "@/types/ai-session";
import { z } from "zod";

/**
 * Mathpix OCR API client
 */
async function processMathpixOCR(
  base64Image: string,
  options: {
    validateLatex?: boolean;
    extractPlainText?: boolean;
    confidenceThreshold?: number;
  }
): Promise<OCRResult> {
  const startTime = Date.now();

  try {
    const mathpixAppId = requireEnv("MATHPIX_APP_ID");
    const mathpixAppKey = requireEnv("MATHPIX_APP_KEY");

    // Prepare image data
    let imageData = base64Image;
    if (!base64Image.startsWith("data:")) {
      imageData = `data:image/jpeg;base64,${base64Image}`;
    }

    // Call Mathpix API
    const response = await fetch("https://api.mathpix.com/v3/text", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        app_id: mathpixAppId,
        app_key: mathpixAppKey,
      },
      body: JSON.stringify({
        src: imageData,
        formats: ["text", "latex_styled"],
        math_inline_delimiters: ["$", "$"],
        math_display_delimiters: ["$$", "$$"],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new InternalServerError(
        `Mathpix API error: ${errorData.error || response.statusText}`
      );
    }

    const data = await response.json();

    // Extract LaTeX
    const latex = data.latex_styled || data.text || "";
    const plainText = data.text || "";
    const confidence = data.confidence || 0.5;

    // Validate extracted LaTeX
    if (options.validateLatex && latex) {
      const validation = LatexValidator.validate(latex);
      if (!validation.valid) {
        console.warn("Extracted LaTeX validation failed:", validation.errors);
        // Continue anyway but reduce confidence
        const processingTime = Date.now() - startTime;
        return {
          success: true,
          latex,
          confidence: confidence * 0.7, // Reduce confidence
          plainText,
          error: "LaTeX validation warnings: " + validation.errors.join(", "),
          processingTime,
        };
      }
    }

    // Check confidence threshold
    if (confidence < (options.confidenceThreshold || 0.7)) {
      console.warn(`Low OCR confidence: ${confidence}`);
    }

    const processingTime = Date.now() - startTime;

    return {
      success: true,
      latex,
      confidence,
      plainText,
      processingTime,
    };
  } catch (error) {
    const processingTime = Date.now() - startTime;
    return {
      success: false,
      latex: "",
      confidence: 0,
      plainText: "",
      error: error instanceof Error ? error.message : "OCR processing failed",
      processingTime,
    };
  }
}

/**
 * Fallback OCR using Claude Vision (if Mathpix fails)
 */
async function processClaudeVisionOCR(
  base64Image: string
): Promise<OCRResult> {
  const startTime = Date.now();

  try {
    const anthropicKey = requireEnv("ANTHROPIC_API_KEY");

    // Prepare image data
    let imageData = base64Image;
    let mediaType = "image/jpeg";

    if (base64Image.startsWith("data:")) {
      const matches = base64Image.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        mediaType = matches[1];
        imageData = matches[2];
      }
    }

    // Call Claude API with vision
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mediaType,
                  data: imageData,
                },
              },
              {
                type: "text",
                text: `Extract all mathematical expressions from this image and convert them to LaTeX format.

Instructions:
- Use proper LaTeX notation
- Wrap inline math in $ $
- Wrap display math in $$ $$
- If there's text, preserve it alongside the math
- Be precise with mathematical notation

Respond with only the extracted LaTeX and text, nothing else.`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new InternalServerError(
        `Claude Vision API error: ${response.statusText}`
      );
    }

    const data = await response.json();
    const extractedText =
      data.content?.[0]?.type === "text" ? data.content[0].text : "";

    // Basic LaTeX extraction from response
    const latex = extractedText.trim();
    const plainText = latex.replace(/\$\$?([^$]+)\$\$?/g, "$1");

    const processingTime = Date.now() - startTime;

    return {
      success: true,
      latex,
      confidence: 0.8, // Claude Vision is generally reliable
      plainText,
      processingTime,
    };
  } catch (error) {
    const processingTime = Date.now() - startTime;
    return {
      success: false,
      latex: "",
      confidence: 0,
      plainText: "",
      error: error instanceof Error ? error.message : "Claude Vision OCR failed",
      processingTime,
    };
  }
}

/**
 * POST handler - Process OCR request
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting
    const { allowed, remaining, resetTime } = checkRateLimit(
      request,
      RATE_LIMITS.OCR.limit,
      RATE_LIMITS.OCR.windowMs
    );

    const rateLimitHeaders = getRateLimitHeaders(
      RATE_LIMITS.OCR.limit,
      remaining,
      resetTime
    );

    if (!allowed) {
      return NextResponse.json(
        {
          error: {
            message: "Rate limit exceeded. Please try again later.",
            code: "RATE_LIMIT_EXCEEDED",
            details: { resetTime },
          },
          timestamp: new Date().toISOString(),
        },
        {
          status: 429,
          headers: rateLimitHeaders,
        }
      );
    }

    // 2. Validate request body
    let validatedData;
    try {
      const body = await request.json();
      validatedData = ocrRequestSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError("Invalid request data", {
          errors: error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        });
      }
      throw error;
    }

    // 3. Process OCR with Mathpix (primary)
    let result: OCRResult;

    // Check if Mathpix credentials are available
    const hasMathpix =
      process.env.MATHPIX_APP_ID && process.env.MATHPIX_APP_KEY;

    if (hasMathpix) {
      console.log("Processing OCR with Mathpix...");
      result = await processMathpixOCR(validatedData.image, {
        validateLatex: validatedData.options?.validateLatex ?? true,
        extractPlainText: validatedData.options?.extractPlainText ?? true,
        confidenceThreshold: validatedData.options?.confidenceThreshold ?? 0.7,
      });

      // If Mathpix fails or confidence is too low, try Claude Vision
      if (!result.success || result.confidence < 0.5) {
        console.log("Mathpix failed or low confidence, trying Claude Vision...");
        const claudeResult = await processClaudeVisionOCR(validatedData.image);
        if (claudeResult.success && claudeResult.confidence > result.confidence) {
          result = claudeResult;
        }
      }
    } else {
      // No Mathpix, use Claude Vision directly
      console.log("Processing OCR with Claude Vision...");
      result = await processClaudeVisionOCR(validatedData.image);
    }

    // 4. Check if OCR was successful
    if (!result.success) {
      throw new InternalServerError(
        result.error || "OCR processing failed"
      );
    }

    // 5. Validate extracted LaTeX
    if (result.latex) {
      const validation = LatexValidator.validate(result.latex);
      if (!validation.valid) {
        // Return result with warnings
        return NextResponse.json(
          {
            data: {
              ...result,
              warnings: validation.errors,
              validationPassed: false,
            },
            timestamp: new Date().toISOString(),
          },
          {
            status: 200,
            headers: {
              ...rateLimitHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }
    }

    // 6. Return successful result
    return NextResponse.json(
      {
        data: {
          ...result,
          validationPassed: true,
        },
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          ...rateLimitHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("OCR API Error:", error);
    return handleAPIError(error);
  }
}

/**
 * OPTIONS handler - CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}
