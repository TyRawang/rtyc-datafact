import { defineCliConfig } from "sanity/cli";

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID,
    dataset: process.env.SANITY_STUDIO_DATASET || "production",
  },
  deployment: { autoUpdates: true, appId: "zvv6we2lvm0j5r64g269aw2l" },
});
