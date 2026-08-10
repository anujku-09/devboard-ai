import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter } from "react-router-dom";
import App from './App.tsx'
import ToastProvider from "./contexts/ToastProvider";
import AuthProvider from "./contexts/AuthProvider";
import ThemeProvider from "./contexts/ThemeProvider";
import ProjectProvider from "./contexts/ProjectContext";

createRoot(document.getElementById('root')!).render(
<StrictMode>
  <BrowserRouter>
            <ThemeProvider>
                <ToastProvider>
                    <AuthProvider>
                        <ProjectProvider>
                            <App />
                        </ProjectProvider>
                    </AuthProvider>
                </ToastProvider>
            </ThemeProvider>
        </BrowserRouter>
</StrictMode>
)
