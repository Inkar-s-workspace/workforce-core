import { useTheme } from "next-themes";
import { Sun, Moon, Monitor, Layout, LayoutGrid, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [compactMode, setCompactMode] = useState(false);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);

  const themes = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">Customize your experience</p>
        </div>
      </div>

      {/* Appearance */}
      <Card className="p-5 space-y-5">
        <div>
          <h2 className="text-base font-semibold">Appearance</h2>
          <p className="text-sm text-muted-foreground">Choose your preferred theme</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {themes.map((t) => (
            <button
              key={t.value}
              onClick={() => setTheme(t.value)}
              className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                theme === t.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <t.icon className="h-5 w-5" />
              <span className="text-sm font-medium">{t.label}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Layout */}
      <Card className="p-5 space-y-4">
        <div>
          <h2 className="text-base font-semibold">Layout</h2>
          <p className="text-sm text-muted-foreground">Adjust the display preferences</p>
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LayoutGrid className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="compact" className="cursor-pointer">Compact mode</Label>
          </div>
          <Switch id="compact" checked={compactMode} onCheckedChange={setCompactMode} />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Layout className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="animations" className="cursor-pointer">Animations</Label>
          </div>
          <Switch id="animations" checked={animationsEnabled} onCheckedChange={setAnimationsEnabled} />
        </div>
      </Card>

      {/* About */}
      <Card className="p-5 space-y-2">
        <h2 className="text-base font-semibold">About</h2>
        <p className="text-sm text-muted-foreground">
          Accra Medical Centre — Attendance Monitoring System
        </p>
        <p className="text-xs text-muted-foreground">Version 1.0.0</p>
      </Card>
    </div>
  );
}
