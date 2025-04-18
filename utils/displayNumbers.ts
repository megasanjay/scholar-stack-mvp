import { usePreferredLanguages } from "@vueuse/core";

const displayAbbreviatedNumber = (number: number) => {
  const languages = usePreferredLanguages();

  const formatter = new Intl.NumberFormat(languages.value, {
    compactDisplay: "short",
    notation: "compact",
  });

  return formatter.format(number);
};

export { displayAbbreviatedNumber };
