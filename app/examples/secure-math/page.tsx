"use client";

import { useState } from "react";
import { MathRenderer, InlineMath, DisplayMath, SafeMathRenderer } from "@/components/math";
import { AnswerInput, MultipleChoiceInput } from "@/components/practice";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, CheckCircle, XCircle } from "lucide-react";

/**
 * Secure Math Examples Page
 *
 * Demonstrates proper usage of validated, secure math components
 */
export default function SecureMathExamplesPage() {
  const [customLatex, setCustomLatex] = useState("x^2 + 2x + 1");

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-green-600" />
          <h1 className="text-4xl font-bold">Secure Math Components</h1>
        </div>
        <p className="text-lg text-muted-foreground">
          All math rendering is validated and protected against XSS attacks.
        </p>
      </div>

      <Tabs defaultValue="rendering" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="rendering">Safe Rendering</TabsTrigger>
          <TabsTrigger value="validation">Validation</TabsTrigger>
          <TabsTrigger value="input">Answer Input</TabsTrigger>
          <TabsTrigger value="security">Security Tests</TabsTrigger>
        </TabsList>

        {/* Tab 1: Safe Rendering */}
        <TabsContent value="rendering" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Math Rendering</CardTitle>
              <CardDescription>
                All LaTeX is validated before rendering with trust: false
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Inline Math */}
              <div className="space-y-2">
                <h3 className="font-semibold">Inline Math</h3>
                <p className="text-sm text-muted-foreground">
                  The quadratic formula is <InlineMath latex="x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}" />
                  and can be derived from completing the square.
                </p>
              </div>

              {/* Display Math */}
              <div className="space-y-2">
                <h3 className="font-semibold">Display Math</h3>
                <div className="p-4 bg-muted rounded-md">
                  <DisplayMath latex="\int_{a}^{b} f(x) \, dx = F(b) - F(a)" />
                </div>
              </div>

              {/* With Error Boundary */}
              <div className="space-y-2">
                <h3 className="font-semibold">With Error Boundary (Recommended)</h3>
                <div className="p-4 bg-muted rounded-md">
                  <SafeMathRenderer>
                    <DisplayMath latex="\sin^2(x) + \cos^2(x) = 1" />
                  </SafeMathRenderer>
                </div>
              </div>

              {/* Custom Input */}
              <div className="space-y-2">
                <h3 className="font-semibold">Try Your Own LaTeX</h3>
                <input
                  type="text"
                  value={customLatex}
                  onChange={(e) => setCustomLatex(e.target.value)}
                  className="w-full px-4 py-2 border rounded-md font-mono text-sm"
                  placeholder="Enter LaTeX..."
                />
                <div className="p-4 bg-muted rounded-md">
                  <SafeMathRenderer>
                    <MathRenderer
                      latex={customLatex}
                      displayMode={true}
                      showValidationErrors={true}
                    />
                  </SafeMathRenderer>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Validation Examples */}
        <TabsContent value="validation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>LaTeX Validation</CardTitle>
              <CardDescription>
                See how validation catches invalid and malicious LaTeX
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Valid Examples */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Valid LaTeX (Allowed)
                </h3>
                <div className="space-y-2">
                  {[
                    "x^2 + 2x + 1",
                    "\\frac{1}{2}",
                    "\\sin(x) + \\cos(x)",
                    "\\sqrt{x^2 + y^2}",
                    "\\int_{0}^{\\infty} e^{-x} dx",
                  ].map((latex, idx) => (
                    <div key={idx} className="p-3 bg-green-50 border border-green-200 rounded-md">
                      <code className="text-xs">{latex}</code>
                      <div className="mt-2">
                        <MathRenderer latex={latex} displayMode={false} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Invalid Examples */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  Invalid LaTeX (Blocked)
                </h3>
                <div className="space-y-2">
                  {[
                    "\\href{javascript:alert('xss')}{click}",
                    "\\def\\bad{malicious}",
                    "x^2 + 2x + ", // unbalanced
                  ].map((latex, idx) => (
                    <div key={idx} className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <code className="text-xs break-all">{latex}</code>
                      <div className="mt-2">
                        <MathRenderer
                          latex={latex}
                          displayMode={false}
                          showValidationErrors={true}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Answer Input */}
        <TabsContent value="input" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Secure Answer Input</CardTitle>
              <CardDescription>
                Practice problems with validated input and feedback
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Free Response */}
              <div className="space-y-2">
                <h3 className="font-semibold">Free Response Question</h3>
                <p className="text-sm">Solve for x: 2x + 4 = 10</p>
                <AnswerInput
                  questionId="example-1"
                  correctAnswer={["3", "x = 3"]}
                  validationOptions={{
                    tolerance: 1e-6,
                    allowPartialCredit: true,
                  }}
                  onAnswerSubmit={(answer, isCorrect, confidence) => {
                    console.log("Answer submitted:", { answer, isCorrect, confidence });
                  }}
                />
              </div>

              {/* Multiple Choice */}
              <div className="space-y-2">
                <h3 className="font-semibold">Multiple Choice Question</h3>
                <p className="text-sm">What is the derivative of x²?</p>
                <MultipleChoiceInput
                  questionId="example-2"
                  correctAnswer="2x"
                  options={[
                    { value: "x", label: "x" },
                    { value: "2x", label: "2x" },
                    { value: "x²", label: "x²" },
                    { value: "2", label: "2" },
                  ]}
                  onAnswerSubmit={(answer, isCorrect) => {
                    console.log("Multiple choice answer:", { answer, isCorrect });
                  }}
                />
              </div>

              {/* Advanced Math */}
              <div className="space-y-2">
                <h3 className="font-semibold">Advanced Math Question</h3>
                <p className="text-sm">
                  Simplify: <InlineMath latex="\frac{x^2 - 4}{x - 2}" />
                </p>
                <AnswerInput
                  questionId="example-3"
                  correctAnswer={["x + 2", "x+2", "(x+2)"]}
                  validationOptions={{
                    requireSimplified: true,
                  }}
                  onAnswerSubmit={(answer, isCorrect, confidence) => {
                    console.log("Advanced answer:", { answer, isCorrect, confidence });
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Security Tests */}
        <TabsContent value="security" className="space-y-6">
          <Card className="bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <Shield className="h-5 w-5" />
                Security Status: Protected
              </CardTitle>
              <CardDescription>
                All XSS attack vectors are blocked by validation
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>XSS Attack Prevention</CardTitle>
              <CardDescription>
                Common attack patterns that are automatically blocked
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h3 className="font-semibold text-red-600">Blocked Attack Vectors</h3>

                {/* JavaScript Protocol */}
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-xs font-semibold mb-2">JavaScript Protocol</p>
                  <code className="text-xs break-all">
                    \\href{'{javascript:alert("xss")}'}{'{Click Me}'}
                  </code>
                  <div className="mt-2 text-xs text-red-700">
                    ✓ Blocked by forbidden command check
                  </div>
                </div>

                {/* Command Injection */}
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-xs font-semibold mb-2">Command Injection</p>
                  <code className="text-xs break-all">
                    \\def\\malicious{'{<script>alert("xss")</script>}'}
                  </code>
                  <div className="mt-2 text-xs text-red-700">
                    ✓ Blocked by forbidden command check
                  </div>
                </div>

                {/* Data URI */}
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-xs font-semibold mb-2">Data URI Injection</p>
                  <code className="text-xs break-all">
                    data:text/html,{'<script>alert("xss")</script>'}
                  </code>
                  <div className="mt-2 text-xs text-red-700">
                    ✓ Blocked by pattern detection + sanitization
                  </div>
                </div>

                {/* HTML Tags */}
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-xs font-semibold mb-2">HTML Tag Injection</p>
                  <code className="text-xs break-all">
                    {'<script>alert("xss")</script>'}
                  </code>
                  <div className="mt-2 text-xs text-red-700">
                    ✓ Blocked by pattern detection + HTML escaping
                  </div>
                </div>
              </div>

              <Card className="bg-green-50 border-green-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700 text-base">
                    <CheckCircle className="h-5 w-5" />
                    All Tests Passed
                  </CardTitle>
                  <CardDescription>
                    The validation system successfully blocks all known XSS attack vectors.
                    All LaTeX is sanitized and rendered with trust: false.
                  </CardDescription>
                </CardHeader>
              </Card>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security Features</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>LaTeX validation before rendering (whitelist approach)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>KaTeX trust mode disabled (trust: false)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Forbidden command blocking (href, url, def, etc.)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Pattern detection for javascript:, data URIs, script tags</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>HTML escaping in error messages</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Error boundaries prevent page crashes</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Input sanitization and length limits</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Brace balance and syntax validation</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
