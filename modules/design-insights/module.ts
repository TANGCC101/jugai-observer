import { defineModule } from "@aihot/contracts/modules";

export const designInsights = defineModule({
  name: "design-insights",
  pages: [{ path: "insights", file: "web/insights.tsx" }, { path: "sources-guide", file: "web/sources.tsx" }],
});
