import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Prevent build errors for missing plugin rules
      "@typescript-eslint/no-unused-vars": "off",
      "@next/next/no-page-custom-font": "off",
      "react/no-unescaped-entities": "off",
      "@typescript-eslint/ban-ts-comment": [
        "error",
        {
          "ts-ignore": "never",
          "ts-expect-error": "allow-with-description"
        }
      ],
      "no-var": "error",
      "@typescript-eslint/no-unused-expressions": "error"
    },
  },
];

export default eslintConfig;
