import { createRoot } from "react-dom/client";
import "./index.css";

// Show loading indicator immediately
const rootElement = document.getElementById("root");
if (rootElement) {
  rootElement.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;color:#6b7280;">Loading...</div>';
}

// Dynamic import to catch any module-level errors
async function bootstrap() {
  try {
    console.log("[DEBUG] Starting app bootstrap...");
    
    const { default: App } = await import("./App.tsx");
    console.log("[DEBUG] App module loaded successfully");
    
    const { default: ErrorBoundary } = await import("./components/ErrorBoundary");
    console.log("[DEBUG] ErrorBoundary loaded successfully");

    if (!rootElement) {
      throw new Error("Root element not found");
    }

    console.log("[DEBUG] Rendering app...");
    createRoot(rootElement).render(
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    );
    console.log("[DEBUG] App rendered successfully");
  } catch (error) {
    console.error("[DEBUG] Failed to bootstrap app:", error);
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; text-align: center; font-family: sans-serif;">
          <div>
            <h1 style="color: #ef4444; margin-bottom: 16px; font-size: 24px;">Failed to load application</h1>
            <p style="color: #6b7280; margin-bottom: 16px;">${error instanceof Error ? error.message : "An unexpected error occurred"}</p>
            <pre style="color: #9ca3af; font-size: 12px; text-align: left; max-width: 600px; margin: 0 auto 16px; padding: 12px; background: #f3f4f6; border-radius: 8px; overflow: auto;">${error instanceof Error ? error.stack : String(error)}</pre>
            <button onclick="window.location.reload()" style="padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer;">
              Reload Page
            </button>
          </div>
        </div>
      `;
    }
  }
}

bootstrap();
