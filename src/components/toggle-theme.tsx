import { Monitor, Moon, Sun } from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function ToggleTheme() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button size="icon" variant="ghost">
        <Sun className="h-[1.2rem] w-[1.2rem]" weight="regular" />
      </Button>
    );
  }

  const cycleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  };

  return (
    <Button
      className="h-7 w-7"
      onClick={cycleTheme}
      size="icon"
      style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
      type="button"
      variant="ghost"
    >
      {theme === "light" && (
        <Sun className="h-[1.2rem] w-[1.2rem]" weight="regular" />
      )}
      {theme === "dark" && (
        <Moon className="h-[1.2rem] w-[1.2rem]" weight="regular" />
      )}
      {theme === "system" && (
        <Monitor className="h-[1.2rem] w-[1.2rem]" weight="regular" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
