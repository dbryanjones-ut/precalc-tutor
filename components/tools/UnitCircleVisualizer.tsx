"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { MathRenderer } from "@/components/math/MathRenderer";
import unitCircleData from "@/data/reference/unit-circle.json";
import { Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AngleData {
  degrees: number;
  radians: string;
  radiansNumeric: number;
  x: number;
  y: number;
  sin: string;
  cos: string;
  tan: string;
  csc: string;
  sec: string;
  cot: string;
  familyColor: string;
  family: string;
  quadrant: number;
  referenceAngle: string;
  mnemonic: string;
}

interface UnitCircleVisualizerProps {
  className?: string;
}

const FAMILY_COLORS: Record<string, string> = {
  pi6: "#4F8CFF",
  pi4: "#FF6B6B",
  pi3: "#51CF66",
  special: "#868E96",
};

export function UnitCircleVisualizer({ className = "" }: UnitCircleVisualizerProps) {
  const [inputAngle, setInputAngle] = useState("0");
  const [useDegrees, setUseDegrees] = useState(false);
  const [hoveredAngle, setHoveredAngle] = useState<AngleData | null>(null);
  const [lockedAngle, setLockedAngle] = useState<AngleData | null>(null);
  const [showAllAngles, setShowAllAngles] = useState(true);

  const angles = unitCircleData.angles as AngleData[];
  const families = unitCircleData.families;

  // Convert input to radians
  const currentRadians = useMemo(() => {
    const num = parseFloat(inputAngle);
    if (isNaN(num)) return 0;
    return useDegrees ? (num * Math.PI) / 180 : num;
  }, [inputAngle, useDegrees]);

  // Find closest standard angle or calculate custom values
  const displayAngle = useMemo(() => {
    const closest = angles.reduce((prev, curr) => {
      const prevDiff = Math.abs(prev.radiansNumeric - currentRadians);
      const currDiff = Math.abs(curr.radiansNumeric - currentRadians);
      return currDiff < prevDiff ? curr : prev;
    });

    // If close enough to a standard angle, use it
    if (Math.abs(closest.radiansNumeric - currentRadians) < 0.05) {
      return closest;
    }

    // Otherwise, calculate custom values
    return {
      degrees: (currentRadians * 180) / Math.PI,
      radians: `${currentRadians.toFixed(3)}`,
      radiansNumeric: currentRadians,
      x: Math.cos(currentRadians),
      y: Math.sin(currentRadians),
      sin: Math.sin(currentRadians).toFixed(3),
      cos: Math.cos(currentRadians).toFixed(3),
      tan:
        Math.abs(Math.cos(currentRadians)) < 0.001
          ? "undefined"
          : (Math.sin(currentRadians) / Math.cos(currentRadians)).toFixed(3),
      csc: Math.abs(Math.sin(currentRadians)) < 0.001 ? "undefined" : (1 / Math.sin(currentRadians)).toFixed(3),
      sec: Math.abs(Math.cos(currentRadians)) < 0.001 ? "undefined" : (1 / Math.cos(currentRadians)).toFixed(3),
      cot: Math.abs(Math.sin(currentRadians)) < 0.001 ? "undefined" : (Math.cos(currentRadians) / Math.sin(currentRadians)).toFixed(3),
      familyColor: "special",
      family: "custom",
      quadrant: Math.floor((currentRadians % (2 * Math.PI)) / (Math.PI / 2)) + 1,
      referenceAngle: "0",
      mnemonic: "",
    } as AngleData;
  }, [currentRadians, angles]);

  const activeAngle = lockedAngle || hoveredAngle || displayAngle;

  // SVG dimensions
  const size = 400;
  const center = size / 2;
  const radius = 160;

  // Convert angle to SVG coordinates
  const getPoint = (angle: number) => {
    return {
      x: center + radius * Math.cos(angle),
      y: center - radius * Math.sin(angle), // Subtract because SVG y increases downward
    };
  };

  const toggleLock = (angle: AngleData | null) => {
    if (lockedAngle && angle && lockedAngle.radians === angle.radians) {
      setLockedAngle(null);
    } else {
      setLockedAngle(angle);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Unit Circle Visualizer
          <div className="flex items-center gap-2">
            <Switch
              id="show-all"
              checked={showAllAngles}
              onCheckedChange={setShowAllAngles}
            />
            <Label htmlFor="show-all" className="text-sm font-normal">
              Show all angles
            </Label>
          </div>
        </CardTitle>
        <CardDescription>
          Interactive unit circle with color-coded angle families
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Input Controls */}
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <Label htmlFor="angle-input">
              Angle ({useDegrees ? "degrees" : "radians"})
            </Label>
            <Input
              id="angle-input"
              type="text"
              value={inputAngle}
              onChange={(e) => setInputAngle(e.target.value)}
              placeholder={useDegrees ? "0-360" : "0-2π"}
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="unit-toggle"
              checked={useDegrees}
              onCheckedChange={setUseDegrees}
            />
            <Label htmlFor="unit-toggle" className="whitespace-nowrap">
              Use degrees
            </Label>
          </div>
        </div>

        {/* SVG Unit Circle */}
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <svg
              width="100%"
              height="100%"
              viewBox={`0 0 ${size} ${size}`}
              className="border rounded-lg bg-background"
            >
              {/* Grid lines */}
              <line
                x1={0}
                y1={center}
                x2={size}
                y2={center}
                stroke="currentColor"
                strokeWidth="1"
                opacity="0.3"
              />
              <line
                x1={center}
                y1={0}
                x2={center}
                y2={size}
                stroke="currentColor"
                strokeWidth="1"
                opacity="0.3"
              />

              {/* Unit circle */}
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />

              {/* Quadrant labels */}
              <text x={center + radius / 2} y={center - radius / 2} className="text-xs fill-muted-foreground" textAnchor="middle">
                I
              </text>
              <text x={center - radius / 2} y={center - radius / 2} className="text-xs fill-muted-foreground" textAnchor="middle">
                II
              </text>
              <text x={center - radius / 2} y={center + radius / 2} className="text-xs fill-muted-foreground" textAnchor="middle">
                III
              </text>
              <text x={center + radius / 2} y={center + radius / 2} className="text-xs fill-muted-foreground" textAnchor="middle">
                IV
              </text>

              {/* Standard angle markers */}
              {showAllAngles &&
                angles.map((angle, idx) => {
                  const point = getPoint(angle.radiansNumeric);
                  const color = FAMILY_COLORS[angle.familyColor as keyof typeof FAMILY_COLORS] || FAMILY_COLORS.special;
                  const isActive = activeAngle?.radiansNumeric === angle.radiansNumeric;

                  return (
                    <g key={idx}>
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r={isActive ? 8 : 5}
                        fill={color}
                        stroke={isActive ? "white" : "none"}
                        strokeWidth={isActive ? 2 : 0}
                        opacity={isActive ? 1 : 0.7}
                        className="cursor-pointer transition-all"
                        onMouseEnter={() => !lockedAngle && setHoveredAngle(angle)}
                        onMouseLeave={() => !lockedAngle && setHoveredAngle(null)}
                        onClick={() => toggleLock(angle)}
                      />
                      {/* Angle label for major angles */}
                      {angle.degrees % 90 === 0 && (
                        <text
                          x={point.x + (point.x > center ? 15 : -15)}
                          y={point.y + (point.y > center ? 15 : -15)}
                          className="text-xs fill-current"
                          textAnchor={point.x > center ? "start" : "end"}
                        >
                          {angle.degrees}°
                        </text>
                      )}
                    </g>
                  );
                })}

              {/* Current angle indicator */}
              {activeAngle && (
                <g>
                  {/* Radius line to point */}
                  <line
                    x1={center}
                    y1={center}
                    x2={center + radius * activeAngle.x}
                    y2={center - radius * activeAngle.y}
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                  />

                  {/* Point on circle */}
                  <circle
                    cx={center + radius * activeAngle.x}
                    cy={center - radius * activeAngle.y}
                    r="6"
                    fill={
                      FAMILY_COLORS[activeAngle.family as keyof typeof FAMILY_COLORS] ||
                      "#000"
                    }
                    stroke="white"
                    strokeWidth="2"
                  />

                  {/* Coordinate lines */}
                  <line
                    x1={center + radius * activeAngle.x}
                    y1={center - radius * activeAngle.y}
                    x2={center + radius * activeAngle.x}
                    y2={center}
                    stroke={FAMILY_COLORS[activeAngle.family as keyof typeof FAMILY_COLORS] || "#000"}
                    strokeWidth="1"
                    strokeDasharray="2 2"
                    opacity="0.5"
                  />
                  <line
                    x1={center + radius * activeAngle.x}
                    y1={center - radius * activeAngle.y}
                    x2={center}
                    y2={center - radius * activeAngle.y}
                    stroke={FAMILY_COLORS[activeAngle.family as keyof typeof FAMILY_COLORS] || "#000"}
                    strokeWidth="1"
                    strokeDasharray="2 2"
                    opacity="0.5"
                  />
                </g>
              )}

              {/* Axis labels */}
              <text x={size - 20} y={center - 10} className="text-sm fill-current">
                x
              </text>
              <text x={center + 10} y={20} className="text-sm fill-current">
                y
              </text>
            </svg>
          </div>

          {/* Values Display */}
          <div className="lg:w-80 space-y-4">
            {activeAngle && (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Current Angle</h3>
                  {lockedAngle ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setLockedAngle(null)}
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      Locked
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setLockedAngle(activeAngle)}
                    >
                      <Unlock className="h-4 w-4 mr-2" />
                      Click to lock
                    </Button>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Degrees</div>
                    <div className="text-2xl font-bold">
                      {activeAngle.degrees.toFixed(1)}°
                    </div>
                  </div>

                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Radians</div>
                    <div className="text-2xl font-bold">
                      {activeAngle.radians}
                    </div>
                  </div>

                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Coordinates (x, y)</div>
                    <div className="text-lg font-mono">
                      ({activeAngle.x.toFixed(3)}, {activeAngle.y.toFixed(3)})
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-center">
                      <div className="text-xs text-muted-foreground mb-1">sin</div>
                      <div className="font-semibold">{activeAngle.sin}</div>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg text-center">
                      <div className="text-xs text-muted-foreground mb-1">cos</div>
                      <div className="font-semibold">{activeAngle.cos}</div>
                    </div>
                    <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-lg text-center">
                      <div className="text-xs text-muted-foreground mb-1">tan</div>
                      <div className="font-semibold">{activeAngle.tan}</div>
                    </div>
                  </div>

                  {activeAngle.family !== "custom" && (
                    <div className="p-3 border rounded-lg">
                      <div className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor:
                              FAMILY_COLORS[activeAngle.family as keyof typeof FAMILY_COLORS],
                          }}
                        />
                        {families[activeAngle.family as keyof typeof families]?.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {families[activeAngle.family as keyof typeof families]?.pattern}
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">
                    Quadrant {activeAngle.quadrant}
                    {activeAngle.referenceAngle !== "0" && ` • Reference: ${activeAngle.referenceAngle}`}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Family Legend */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-semibold mb-3">Angle Families</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(families).map(([key, family]) => (
              <div key={key} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: FAMILY_COLORS[key as keyof typeof FAMILY_COLORS] }}
                />
                <div className="text-xs">
                  <div className="font-medium">{family.name}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
