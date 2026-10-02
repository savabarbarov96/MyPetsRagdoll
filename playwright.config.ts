import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir:'./tests',timeout:45000,fullyParallel:true,
  use:{baseURL:'http://127.0.0.1:8080',headless:true,trace:'retain-on-failure'},
  projects:[{name:'desktop',use:{viewport:{width:1440,height:1000}}},{name:'tablet',use:{viewport:{width:768,height:1024}}},{name:'mobile',use:{viewport:{width:390,height:844}}}],
  webServer:{command:'npm run dev -- --host 127.0.0.1 --port 8080',url:'http://127.0.0.1:8080',reuseExistingServer:!process.env.CI},
});
