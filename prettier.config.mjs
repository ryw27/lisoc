const config = {
    printWidth: 100,
    tabWidth: 4,
    semi: true,
    trailingComma: "es5",

    bracketSpacing: true,
    arrowParens: "always",

    plugins: [
        "prettier-plugin-tailwindcss",
        "prettier-plugin-packagejson",
    ],
    importOrder: [
        "^(react/(.*)$)|^(react$)",
        "^(next/(.*)$)|^(next$)",

        "<THIRD_PARTY_MODULES>",

        "^@/lib/(.*)$",
        "^@/types/(.*)$",
        "^@/server/(.*)$",
        "^@/components/(.*)$",
        "^@/styles/(.*)$",

        "^[./]",
    ],
};

export default config;
