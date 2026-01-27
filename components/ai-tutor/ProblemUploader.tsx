"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, Camera, X, Crop, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MathRenderer } from "@/components/math/MathRenderer";
import { useAITutorStore } from "@/stores/useAITutorStore";
import { toast } from "sonner";

interface ProblemUploaderProps {
  onProblemExtracted?: (latex: string, imageUrl: string) => void;
  className?: string;
}

export function ProblemUploader({ onProblemExtracted, className = "" }: ProblemUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedLatex, setExtractedLatex] = useState<string>("");
  const [manualLatex, setManualLatex] = useState<string>("");
  const [showManualInput, setShowManualInput] = useState(false);
  const [ocrConfidence, setOcrConfidence] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const { startSession } = useAITutorStore();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processImage = async (file: File) => {
    setIsProcessing(true);
    setError(null);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Process with OCR
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/ocr", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to process image");
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "OCR processing failed");
      }

      setExtractedLatex(data.latex);
      setOcrConfidence(data.confidence);

      // Show manual input if confidence is low
      if (data.confidence < 0.7) {
        setShowManualInput(true);
        toast.warning("Low confidence OCR result. Please verify or edit.");
      } else {
        toast.success("Problem extracted successfully!");
      }

      // Start session with extracted problem
      const imageUrl = await fileToBase64(file);
      startSession(imageUrl, data.latex);

      if (onProblemExtracted) {
        onProblemExtracted(data.latex, imageUrl);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to process image";
      setError(errorMessage);
      toast.error(errorMessage);
      setShowManualInput(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find((file) => file.type.startsWith("image/"));

    if (imageFile) {
      processImage(imageFile);
    } else {
      toast.error("Please upload an image file");
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImage(file);
    }
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImage(file);
    }
  };

  const handleManualSubmit = () => {
    if (!manualLatex.trim()) {
      toast.error("Please enter a problem");
      return;
    }

    setExtractedLatex(manualLatex);
    startSession(imagePreview || undefined, manualLatex);

    if (onProblemExtracted) {
      onProblemExtracted(manualLatex, imagePreview || "");
    }

    toast.success("Problem set successfully!");
  };

  const handleClear = () => {
    setImagePreview(null);
    setExtractedLatex("");
    setManualLatex("");
    setShowManualInput(false);
    setOcrConfidence(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload Problem
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!imagePreview ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${isDragging ? "border-primary bg-primary/5" : "border-border"}
              hover:border-primary hover:bg-primary/5 cursor-pointer
            `}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              aria-label="Upload problem image"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleCameraCapture}
              className="hidden"
              aria-label="Capture problem with camera"
            />

            <div className="space-y-4">
              <div className="flex justify-center">
                <Upload className="w-12 h-12 text-muted-foreground" />
              </div>
              <div>
                <p className="text-lg font-medium">Drop image here or click to browse</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Supports PNG, JPG, WebP up to 10MB
                </p>
              </div>
              <div className="flex gap-2 justify-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Browse Files
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    cameraInputRef.current?.click();
                  }}
                  className="md:hidden"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Take Photo
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Image Preview */}
            <div className="relative rounded-lg overflow-hidden bg-muted">
              <img
                src={imagePreview}
                alt="Problem preview"
                className="w-full h-auto max-h-64 object-contain"
              />
              <Button
                size="sm"
                variant="destructive"
                className="absolute top-2 right-2"
                onClick={handleClear}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Processing Indicator */}
            {isProcessing && (
              <div className="flex items-center justify-center gap-2 py-4">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">
                  Processing image with OCR...
                </span>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="space-y-1 flex-1">
                  <p className="text-sm font-medium text-destructive">OCR Error</p>
                  <p className="text-xs text-destructive/80">{error}</p>
                </div>
              </div>
            )}

            {/* Extracted LaTeX Display */}
            {extractedLatex && !isProcessing && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-medium">Extracted Problem</span>
                  </div>
                  {ocrConfidence !== null && (
                    <span className="text-xs text-muted-foreground">
                      Confidence: {(ocrConfidence * 100).toFixed(0)}%
                    </span>
                  )}
                </div>

                <div className="p-4 rounded-lg bg-card border border-border">
                  <MathRenderer latex={extractedLatex} displayMode={true} />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowManualInput(!showManualInput)}
                  className="w-full"
                >
                  {showManualInput ? "Hide" : "Edit"} LaTeX
                </Button>
              </div>
            )}

            {/* Manual LaTeX Input */}
            {showManualInput && (
              <div className="space-y-3">
                <div>
                  <label htmlFor="manual-latex" className="text-sm font-medium block mb-2">
                    Manual LaTeX Input
                  </label>
                  <textarea
                    id="manual-latex"
                    value={manualLatex || extractedLatex}
                    onChange={(e) => setManualLatex(e.target.value)}
                    placeholder="Enter problem in LaTeX (e.g., x^2 + 5x + 6 = 0)"
                    className="w-full min-h-[100px] p-3 rounded-lg bg-background border border-input text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                    aria-label="Manual LaTeX input"
                  />
                </div>

                {manualLatex && (
                  <div className="p-4 rounded-lg bg-card border border-border">
                    <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                    <MathRenderer latex={manualLatex} displayMode={true} />
                  </div>
                )}

                <Button
                  type="button"
                  onClick={handleManualSubmit}
                  className="w-full"
                  disabled={!manualLatex.trim()}
                >
                  Use This Problem
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Quick LaTeX Input Option */}
        {!imagePreview && (
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or</span>
            </div>
          </div>
        )}

        {!imagePreview && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setShowManualInput(true);
              setImagePreview("manual");
            }}
            className="w-full"
          >
            Type Problem Manually
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
