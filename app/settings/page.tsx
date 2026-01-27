"use client";

import { useSettingsStore } from "@/stores/useSettingsStore";
import { AccessibilityPreset } from "@/types";
import { useState } from "react";
import {
  Eye,
  Volume2,
  Accessibility,
  Brain,
  Timer,
  Bell,
  Sparkles,
  RotateCcw,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function SettingsPage() {
  const { settings, updateSettings, applyAccessibilityPreset, resetSettings } =
    useSettingsStore();
  const [selectedPreset, setSelectedPreset] = useState<AccessibilityPreset>("custom");

  const handlePresetChange = (preset: AccessibilityPreset) => {
    setSelectedPreset(preset);
    if (preset !== "custom") {
      applyAccessibilityPreset(preset);
      toast.success("Accessibility preset applied", {
        description: `Settings optimized for ${preset} support.`,
      });
    }
  };

  const handleReset = () => {
    if (confirm("Reset all settings to defaults?")) {
      resetSettings();
      setSelectedPreset("default");
      toast.success("Settings reset to defaults");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Customize your learning experience. All changes are saved automatically.
        </p>
      </div>

      {/* Accessibility Presets */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary" aria-hidden="true" />
          <h2 className="text-xl font-bold">Quick Setup</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Choose a preset optimized for your needs, or customize individual settings below.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              value: "default" as const,
              label: "Default",
              description: "Standard settings",
            },
            {
              value: "dyslexia" as const,
              label: "Dyslexia",
              description: "Reading support",
            },
            {
              value: "adhd" as const,
              label: "ADHD",
              description: "Focus support",
            },
            {
              value: "colorblind" as const,
              label: "Color Blind",
              description: "Enhanced contrast",
            },
          ].map((preset) => (
            <button
              key={preset.value}
              onClick={() => handlePresetChange(preset.value)}
              className={`p-4 rounded-lg border-2 text-left transition-colors ${
                selectedPreset === preset.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
              aria-pressed={selectedPreset === preset.value}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold">{preset.label}</span>
                {selectedPreset === preset.value && (
                  <Check className="w-4 h-4 text-primary" aria-label="Selected" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">{preset.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Detailed Settings Tabs */}
      <Tabs defaultValue="accessibility" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="accessibility">
            <Accessibility className="w-4 h-4 mr-2" aria-hidden="true" />
            <span className="hidden sm:inline">Accessibility</span>
          </TabsTrigger>
          <TabsTrigger value="display">
            <Eye className="w-4 h-4 mr-2" aria-hidden="true" />
            <span className="hidden sm:inline">Display</span>
          </TabsTrigger>
          <TabsTrigger value="adhd">
            <Brain className="w-4 h-4 mr-2" aria-hidden="true" />
            <span className="hidden sm:inline">ADHD</span>
          </TabsTrigger>
          <TabsTrigger value="practice">
            <Timer className="w-4 h-4 mr-2" aria-hidden="true" />
            <span className="hidden sm:inline">Practice</span>
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="w-4 h-4 mr-2" aria-hidden="true" />
            <span className="hidden sm:inline">Alerts</span>
          </TabsTrigger>
        </TabsList>

        {/* Accessibility Tab */}
        <TabsContent value="accessibility" className="space-y-6">
          <SettingsCard
            title="Dyslexia Support"
            description="Features to make reading easier and reduce cognitive load"
          >
            <SettingSwitch
              label="Dyslexia Mode"
              description="Enable dyslexia-friendly features"
              checked={settings.dyslexiaMode}
              onCheckedChange={(checked) => {
                updateSettings({ dyslexiaMode: checked });
                setSelectedPreset("custom");
              }}
            />

            {settings.dyslexiaMode && (
              <>
                <SettingSwitch
                  label="OpenDyslexic Font"
                  description="Use a font designed for dyslexic readers"
                  checked={settings.dyslexiaFont}
                  onCheckedChange={(checked) =>
                    updateSettings({ dyslexiaFont: checked })
                  }
                />

                <div className="space-y-2">
                  <Label htmlFor="line-spacing">Line Spacing: {settings.dyslexiaLineSpacing}x</Label>
                  <Slider
                    id="line-spacing"
                    min={1.5}
                    max={2.5}
                    step={0.25}
                    value={[settings.dyslexiaLineSpacing]}
                    onValueChange={([value]) =>
                      updateSettings({ dyslexiaLineSpacing: value })
                    }
                    aria-label="Line spacing multiplier"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="color-overlay">Color Overlay</Label>
                  <Select
                    value={settings.dyslexiaColorOverlay}
                    onValueChange={(value: any) =>
                      updateSettings({ dyslexiaColorOverlay: value })
                    }
                  >
                    <SelectTrigger id="color-overlay">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="cream">Cream</SelectItem>
                      <SelectItem value="blue">Blue</SelectItem>
                      <SelectItem value="green">Green</SelectItem>
                      <SelectItem value="pink">Pink</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <SettingSwitch
                  label="Simplified Language"
                  description="Use simpler explanations when available"
                  checked={settings.dyslexiaSimplifiedLanguage}
                  onCheckedChange={(checked) =>
                    updateSettings({ dyslexiaSimplifiedLanguage: checked })
                  }
                />
              </>
            )}

            <Separator />

            <SettingSwitch
              label="Reading Ruler"
              description="Highlight current line to maintain focus"
              checked={settings.readingRuler}
              onCheckedChange={(checked) => {
                updateSettings({ readingRuler: checked });
                setSelectedPreset("custom");
              }}
            />

            {settings.readingRuler && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="ruler-height">Ruler Height: {settings.readingRulerHeight}px</Label>
                  <Slider
                    id="ruler-height"
                    min={40}
                    max={120}
                    step={10}
                    value={[settings.readingRulerHeight]}
                    onValueChange={([value]) =>
                      updateSettings({ readingRulerHeight: value })
                    }
                    aria-label="Reading ruler height in pixels"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ruler-opacity">Overlay Opacity: {Math.round(settings.readingRulerOpacity * 100)}%</Label>
                  <Slider
                    id="ruler-opacity"
                    min={0.1}
                    max={0.5}
                    step={0.05}
                    value={[settings.readingRulerOpacity]}
                    onValueChange={([value]) =>
                      updateSettings({ readingRulerOpacity: value })
                    }
                    aria-label="Reading ruler overlay opacity percentage"
                  />
                </div>
              </>
            )}
          </SettingsCard>

          <SettingsCard
            title="Color Blind Support"
            description="Optimized color palettes for color vision deficiency"
          >
            <div className="space-y-2">
              <Label htmlFor="colorblind-mode">Color Blind Mode</Label>
              <Select
                value={settings.colorBlindMode}
                onValueChange={(value: any) => {
                  updateSettings({ colorBlindMode: value });
                  setSelectedPreset("custom");
                }}
              >
                <SelectTrigger id="colorblind-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="deuteranopia">Deuteranopia (Red-Green)</SelectItem>
                  <SelectItem value="protanopia">Protanopia (Red-Green)</SelectItem>
                  <SelectItem value="tritanopia">Tritanopia (Blue-Yellow)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {settings.colorBlindMode !== "none" && (
              <SettingSwitch
                label="Use Patterns"
                description="Add patterns to colors for better differentiation"
                checked={settings.colorBlindUsePatterns}
                onCheckedChange={(checked) =>
                  updateSettings({ colorBlindUsePatterns: checked })
                }
              />
            )}
          </SettingsCard>

          <SettingsCard
            title="General Accessibility"
            description="Additional accessibility options"
          >
            <SettingSwitch
              label="High Contrast"
              description="Increase contrast for better visibility"
              checked={settings.highContrast}
              onCheckedChange={(checked) =>
                updateSettings({ highContrast: checked })
              }
            />

            <SettingSwitch
              label="Reduced Motion"
              description="Minimize animations and transitions"
              checked={settings.reducedMotion}
              onCheckedChange={(checked) =>
                updateSettings({ reducedMotion: checked })
              }
            />

            <div className="space-y-2">
              <Label htmlFor="font-size">Text Size</Label>
              <Select
                value={settings.fontSize}
                onValueChange={(value: any) =>
                  updateSettings({ fontSize: value })
                }
              >
                <SelectTrigger id="font-size">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </SettingsCard>
        </TabsContent>

        {/* Display Tab */}
        <TabsContent value="display" className="space-y-6">
          <SettingsCard title="Appearance" description="Visual preferences">
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select
                value={settings.theme}
                onValueChange={(value: any) => updateSettings({ theme: value })}
              >
                <SelectTrigger id="theme">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="math-font-size">Math Font Size</Label>
              <Select
                value={settings.mathFontSize}
                onValueChange={(value: any) =>
                  updateSettings({ mathFontSize: value })
                }
              >
                <SelectTrigger id="math-font-size">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </SettingsCard>

          <SettingsCard title="Audio" description="Sound preferences">
            <SettingSwitch
              label="Sound Effects"
              description="Enable audio feedback"
              checked={settings.soundEnabled}
              onCheckedChange={(checked) =>
                updateSettings({ soundEnabled: checked })
              }
            />

            {settings.soundEnabled && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="volume">Volume: {Math.round(settings.soundVolume * 100)}%</Label>
                  <Slider
                    id="volume"
                    min={0}
                    max={1}
                    step={0.1}
                    value={[settings.soundVolume]}
                    onValueChange={([value]) =>
                      updateSettings({ soundVolume: value })
                    }
                    aria-label="Sound volume percentage"
                  />
                </div>

                <SettingSwitch
                  label="Timer Sounds"
                  description="Play sound when timers complete"
                  checked={settings.timerSounds}
                  onCheckedChange={(checked) =>
                    updateSettings({ timerSounds: checked })
                  }
                />
              </>
            )}
          </SettingsCard>
        </TabsContent>

        {/* ADHD Tab */}
        <TabsContent value="adhd" className="space-y-6">
          <SettingsCard
            title="ADHD Scaffolding"
            description="Features designed to support focus and task completion"
          >
            <SettingSwitch
              label="S.O.S. Protocol Always Visible"
              description="Show 'Stuck? Overwhelmed? Scared?' help steps"
              checked={settings.adhd.sosProtocolAlwaysVisible}
              onCheckedChange={(checked) => {
                updateSettings({
                  adhd: { ...settings.adhd, sosProtocolAlwaysVisible: checked },
                });
                setSelectedPreset("custom");
              }}
            />

            <SettingSwitch
              label="Task Sequencing"
              description="Show one step at a time to prevent overwhelm"
              checked={settings.adhd.taskSequencing}
              onCheckedChange={(checked) =>
                updateSettings({
                  adhd: { ...settings.adhd, taskSequencing: checked },
                })
              }
            />

            <SettingSwitch
              label="Progress Chunking"
              description="Break progress into smaller, encouraging chunks"
              checked={settings.adhd.progressChunking}
              onCheckedChange={(checked) =>
                updateSettings({
                  adhd: { ...settings.adhd, progressChunking: checked },
                })
              }
            />

            <SettingSwitch
              label="Minimize Distractions"
              description="Hide non-essential UI elements"
              checked={settings.adhd.minimizeDistractions}
              onCheckedChange={(checked) =>
                updateSettings({
                  adhd: { ...settings.adhd, minimizeDistractions: checked },
                })
              }
            />
          </SettingsCard>

          <SettingsCard
            title="Focus Timer"
            description="Pomodoro-style timer to maintain concentration"
          >
            <SettingSwitch
              label="Enable Focus Timer"
              description="Show timer widget for work/break intervals"
              checked={settings.adhd.focusTimerEnabled}
              onCheckedChange={(checked) =>
                updateSettings({
                  adhd: { ...settings.adhd, focusTimerEnabled: checked },
                })
              }
            />

            {settings.adhd.focusTimerEnabled && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="work-interval">Work Interval: {settings.adhd.breakIntervalMinutes} minutes</Label>
                  <Slider
                    id="work-interval"
                    min={15}
                    max={60}
                    step={5}
                    value={[settings.adhd.breakIntervalMinutes]}
                    onValueChange={([value]) =>
                      updateSettings({
                        adhd: { ...settings.adhd, breakIntervalMinutes: value },
                      })
                    }
                    aria-label="Work interval duration in minutes"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="break-duration">Break Duration: {settings.adhd.breakDurationMinutes} minutes</Label>
                  <Slider
                    id="break-duration"
                    min={5}
                    max={15}
                    step={1}
                    value={[settings.adhd.breakDurationMinutes]}
                    onValueChange={([value]) =>
                      updateSettings({
                        adhd: { ...settings.adhd, breakDurationMinutes: value },
                      })
                    }
                    aria-label="Break duration in minutes"
                  />
                </div>

                <SettingSwitch
                  label="Break Reminders"
                  description="Auto-start break timer after work session"
                  checked={settings.adhd.breakReminders}
                  onCheckedChange={(checked) =>
                    updateSettings({
                      adhd: { ...settings.adhd, breakReminders: checked },
                    })
                  }
                />
              </>
            )}
          </SettingsCard>
        </TabsContent>

        {/* Practice Tab */}
        <TabsContent value="practice" className="space-y-6">
          <SettingsCard
            title="Practice Mode"
            description="Customize your practice experience"
          >
            <SettingSwitch
              label="Show Progress"
              description="Display progress indicators and statistics"
              checked={settings.showProgress}
              onCheckedChange={(checked) =>
                updateSettings({ showProgress: checked })
              }
            />

            <SettingSwitch
              label="Show Progress Animations"
              description="Animate progress updates (disable for reduced motion)"
              checked={settings.showProgressAnimations}
              onCheckedChange={(checked) =>
                updateSettings({ showProgressAnimations: checked })
              }
            />

            <SettingSwitch
              label="Confirm Before Submit"
              description="Ask for confirmation before submitting answers"
              checked={settings.confirmBeforeSubmit}
              onCheckedChange={(checked) =>
                updateSettings({ confirmBeforeSubmit: checked })
              }
            />

            <SettingSwitch
              label="Show Hints Automatically"
              description="Display hints without requiring a click"
              checked={settings.showHintsAutomatically}
              onCheckedChange={(checked) =>
                updateSettings({ showHintsAutomatically: checked })
              }
            />

            <SettingSwitch
              label="Show Multiple Solution Paths"
              description="Display alternative ways to solve problems"
              checked={settings.showMultipleSolutionPaths}
              onCheckedChange={(checked) =>
                updateSettings({ showMultipleSolutionPaths: checked })
              }
            />

            <SettingSwitch
              label="Emphasize Golden Words"
              description="Highlight key vocabulary terms"
              checked={settings.emphasizeGoldenWords}
              onCheckedChange={(checked) =>
                updateSettings({ emphasizeGoldenWords: checked })
              }
            />
          </SettingsCard>

          <SettingsCard title="Timed Practice" description="Timer settings for practice sessions">
            <SettingSwitch
              label="Timed Mode"
              description="Enable timer for practice problems"
              checked={settings.timedMode}
              onCheckedChange={(checked) =>
                updateSettings({ timedMode: checked })
              }
            />

            {settings.timedMode && (
              <div className="space-y-2">
                <Label htmlFor="timer-duration">Timer Duration: {Math.floor(settings.defaultTimerSeconds / 60)}:{(settings.defaultTimerSeconds % 60).toString().padStart(2, '0')}</Label>
                <Slider
                  id="timer-duration"
                  min={30}
                  max={300}
                  step={30}
                  value={[settings.defaultTimerSeconds]}
                  onValueChange={([value]) =>
                    updateSettings({ defaultTimerSeconds: value })
                  }
                  aria-label="Default timer duration in seconds"
                />
              </div>
            )}
          </SettingsCard>

          <SettingsCard
            title="Spaced Repetition"
            description="Settings for review and retention"
          >
            <SettingSwitch
              label="Adaptive Difficulty"
              description="Automatically adjust problem difficulty based on performance"
              checked={settings.adaptiveDifficulty}
              onCheckedChange={(checked) =>
                updateSettings({ adaptiveDifficulty: checked })
              }
            />

            <div className="space-y-2">
              <Label htmlFor="target-reviews">Target Reviews Per Day: {settings.targetReviewsPerDay}</Label>
              <Slider
                id="target-reviews"
                min={5}
                max={30}
                step={5}
                value={[settings.targetReviewsPerDay]}
                onValueChange={([value]) =>
                  updateSettings({ targetReviewsPerDay: value })
                }
                aria-label="Target number of review problems per day"
              />
            </div>
          </SettingsCard>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <SettingsCard
            title="Study Reminders"
            description="Get notified to maintain your study streak"
          >
            <SettingSwitch
              label="Daily Warmup Reminder"
              description="Remind me to complete my daily warmup"
              checked={settings.dailyWarmupReminder}
              onCheckedChange={(checked) =>
                updateSettings({ dailyWarmupReminder: checked })
              }
            />

            <SettingSwitch
              label="Review Reminders"
              description="Notify me when reviews are due"
              checked={settings.reviewReminderEnabled}
              onCheckedChange={(checked) =>
                updateSettings({ reviewReminderEnabled: checked })
              }
            />

            <SettingSwitch
              label="Streak Reminders"
              description="Remind me to maintain my study streak"
              checked={settings.streakReminders}
              onCheckedChange={(checked) =>
                updateSettings({ streakReminders: checked })
              }
            />
          </SettingsCard>

          <SettingsCard
            title="AI Tutor"
            description="Preferences for AI-powered tutoring"
          >
            <div className="space-y-2">
              <Label htmlFor="tutoring-mode">Default Tutoring Mode</Label>
              <Select
                value={settings.defaultTutoringMode}
                onValueChange={(value: any) =>
                  updateSettings({ defaultTutoringMode: value })
                }
              >
                <SelectTrigger id="tutoring-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="socratic">Socratic (Guided Discovery)</SelectItem>
                  <SelectItem value="explanation">Direct Explanation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <SettingSwitch
              label="Auto-Save Sessions"
              description="Automatically save tutoring conversations"
              checked={settings.autoSaveSessions}
              onCheckedChange={(checked) =>
                updateSettings({ autoSaveSessions: checked })
              }
            />

            <SettingSwitch
              label="Show Citations"
              description="Display sources for AI tutor responses"
              checked={settings.showCitations}
              onCheckedChange={(checked) =>
                updateSettings({ showCitations: checked })
              }
            />
          </SettingsCard>
        </TabsContent>
      </Tabs>

      {/* Reset Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleReset}
          variant="outline"
          className="gap-2"
        >
          <RotateCcw className="w-4 h-4" aria-hidden="true" />
          Reset All Settings
        </Button>
      </div>
    </div>
  );
}

// Helper Components

interface SettingsCardProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

function SettingsCard({ title, description, children }: SettingsCardProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Separator />
      {children}
    </div>
  );
}

interface SettingSwitchProps {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

function SettingSwitch({
  label,
  description,
  checked,
  onCheckedChange,
}: SettingSwitchProps) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <Label htmlFor={id} className="cursor-pointer">
          {label}
        </Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-label={label}
      />
    </div>
  );
}
