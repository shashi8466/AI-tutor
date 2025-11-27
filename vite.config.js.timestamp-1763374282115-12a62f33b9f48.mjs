// vite.config.js
import { defineConfig } from "file:///C:/Users/user/Documents/admin%20new/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/user/Documents/admin%20new/node_modules/@vitejs/plugin-react/dist/index.js";
import path from "path";
var __vite_injected_original_dirname = "C:\\Users\\user\\Documents\\admin new";
var vite_config_default = defineConfig({
  plugins: [react()],
  base: "/",
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  build: {
    outDir: "dist",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          router: ["react-router-dom"],
          motion: ["framer-motion"],
          icons: ["react-icons"]
        }
      }
    }
  },
  server: {
    port: 3e3,
    open: true,
    cors: true,
    proxy: {
      "/api": {
        target: "http://localhost:5175",
        changeOrigin: true,
        secure: false
      }
    }
  },
  preview: {
    port: 4173,
    cors: true
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFx1c2VyXFxcXERvY3VtZW50c1xcXFxhZG1pbiBuZXdcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXHVzZXJcXFxcRG9jdW1lbnRzXFxcXGFkbWluIG5ld1xcXFx2aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvdXNlci9Eb2N1bWVudHMvYWRtaW4lMjBuZXcvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbiAgICBpbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnO1xuICAgIGltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuXG4gICAgZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgICAgIHBsdWdpbnM6IFtyZWFjdCgpXSxcbiAgICAgIGJhc2U6ICcvJyxcbiAgICAgIHJlc29sdmU6IHtcbiAgICAgICAgYWxpYXM6IHtcbiAgICAgICAgICAnQCc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYycpXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBidWlsZDoge1xuICAgICAgICBvdXREaXI6ICdkaXN0JyxcbiAgICAgICAgc291cmNlbWFwOiB0cnVlLFxuICAgICAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICAgICAgb3V0cHV0OiB7XG4gICAgICAgICAgICBtYW51YWxDaHVua3M6IHtcbiAgICAgICAgICAgICAgdmVuZG9yOiBbJ3JlYWN0JywgJ3JlYWN0LWRvbSddLFxuICAgICAgICAgICAgICByb3V0ZXI6IFsncmVhY3Qtcm91dGVyLWRvbSddLFxuICAgICAgICAgICAgICBtb3Rpb246IFsnZnJhbWVyLW1vdGlvbiddLFxuICAgICAgICAgICAgICBpY29uczogWydyZWFjdC1pY29ucyddXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgc2VydmVyOiB7XG4gICAgICAgIHBvcnQ6IDMwMDAsXG4gICAgICAgIG9wZW46IHRydWUsXG4gICAgICAgIGNvcnM6IHRydWUsXG4gICAgICAgIHByb3h5OiB7XG4gICAgICAgICAgJy9hcGknOiB7XG4gICAgICAgICAgICB0YXJnZXQ6ICdodHRwOi8vbG9jYWxob3N0OjUxNzUnLFxuICAgICAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICAgICAgc2VjdXJlOiBmYWxzZVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIHByZXZpZXc6IHtcbiAgICAgICAgcG9ydDogNDE3MyxcbiAgICAgICAgY29yczogdHJ1ZVxuICAgICAgfVxuICAgIH0pOyJdLAogICJtYXBwaW5ncyI6ICI7QUFBaVMsU0FBUyxvQkFBb0I7QUFDMVQsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUZyQixJQUFNLG1DQUFtQztBQUlyQyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTLENBQUMsTUFBTSxDQUFDO0FBQUEsRUFDakIsTUFBTTtBQUFBLEVBQ04sU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLElBQ3RDO0FBQUEsRUFDRjtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsUUFBUTtBQUFBLElBQ1IsV0FBVztBQUFBLElBQ1gsZUFBZTtBQUFBLE1BQ2IsUUFBUTtBQUFBLFFBQ04sY0FBYztBQUFBLFVBQ1osUUFBUSxDQUFDLFNBQVMsV0FBVztBQUFBLFVBQzdCLFFBQVEsQ0FBQyxrQkFBa0I7QUFBQSxVQUMzQixRQUFRLENBQUMsZUFBZTtBQUFBLFVBQ3hCLE9BQU8sQ0FBQyxhQUFhO0FBQUEsUUFDdkI7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE9BQU87QUFBQSxNQUNMLFFBQVE7QUFBQSxRQUNOLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQSxRQUNkLFFBQVE7QUFBQSxNQUNWO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxFQUNSO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
