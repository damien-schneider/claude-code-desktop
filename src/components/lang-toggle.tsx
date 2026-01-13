import { useTranslation } from "react-i18next";
import { setAppLanguage } from "@/actions/language";
import langs from "@/localization/langs";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";

export default function LangToggle() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language;

  function onValueChange(values: readonly unknown[]) {
    // Take the first value since we're using single selection
    const value = values[0];
    if (typeof value === "string") {
      setAppLanguage(value, i18n);
    }
  }

  return (
    <ToggleGroup onValueChange={onValueChange} value={[currentLang]}>
      {langs.map((lang) => (
        <ToggleGroupItem
          key={lang.key}
          size="lg"
          value={lang.key}
          variant="outline"
        >
          {`${lang.prefix}`}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
