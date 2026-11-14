import {defineConfig} from "@playwright/test";
export default defineConfig({
  testDir:"./tests/browser",
  timeout:30000,
  use:{baseURL:"http://127.0.0.1:5500"},
  webServer:{command:"python3 -m http.server 5500 --bind 127.0.0.1 --directory .",url:"http://127.0.0.1:5500/",reuseExistingServer:!process.env.CI,timeout:30000}
});
