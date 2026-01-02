import { type Config } from "prettier";

const config: Config = {
    semi: true,
    tabWidth: 4,
    trailingComma: "es5",
    printWidth: 100,
    plugins: ["prettier-plugin-tailwindcss"],
};

export default config;
