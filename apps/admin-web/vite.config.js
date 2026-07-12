import { defineConfig } from "vite";
import { resolve } from "path";
import fs from "node:fs";

export default defineConfig({
  root: "src",
  publicDir: "../public",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        adminLogin:       resolve(__dirname, "src/pages/admin/login.html"),
        adminRegister:    resolve(__dirname, "src/pages/admin/register.html"),
        adminChangePass:  resolve(__dirname, "src/pages/admin/change-password.html"),
        adminWelcome:     resolve(__dirname, "src/pages/admin/welcome.html"),
        adminDashboard:   resolve(__dirname, "src/pages/admin/dashboard.html"),
        adminLogs:        resolve(__dirname, "src/pages/admin/logs.html"),
        adminAccounts:    resolve(__dirname, "src/pages/admin/accounts.html"),
        adminProducts:    resolve(__dirname, "src/pages/admin/products.html"),
        adminOrders:      resolve(__dirname, "src/pages/admin/orders.html"),
        adminReviews:     resolve(__dirname, "src/pages/admin/reviews.html"),
        adminReturnsCskh: resolve(__dirname, "src/pages/admin/returns-cskh.html"),
        adminPricing:     resolve(__dirname, "src/pages/admin/pricing.html"),
        adminPromotions:  resolve(__dirname, "src/pages/admin/promotions.html"),
        adminAuthCallback: resolve(__dirname, "src/pages/admin/auth-callback.html")
      }
    }
  },
  server: {
    port: 5174,
    host: true,
    ...(fs.existsSync(resolve(__dirname, "../../certs/key.pem")) ? {
      https: {
        key: fs.readFileSync(resolve(__dirname, "../../certs/key.pem")),
        cert: fs.readFileSync(resolve(__dirname, "../../certs/cert.pem"))
      }
    } : {}),
    proxy: {
      "/api": {
        target: "http://localhost:8787",
        changeOrigin: true,
        secure: false
      },
      "/uploads": {
        target: "http://localhost:8787",
        changeOrigin: true,
        secure: false
      }
    },
    open: "/pages/admin/login.html"
  }
});
