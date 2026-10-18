// What the site's modules add to the web pages (site/modules/index.ts).
import type { WebModule } from "@aihot/web/modules";
import { designInsightsWeb } from "../../modules/design-insights/web.tsx";

export const WEB_MODULES: readonly WebModule[] = [designInsightsWeb];
