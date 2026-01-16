import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import packageJson from "./package.json";

const nextConfig: NextConfig = {
    /* config options here */
    env: {
        NEXT_PUBLIC_APP_VERSION: packageJson.version,
    },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
