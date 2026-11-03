import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import App from "./App.tsx";
import { openInLearnerLanguage } from "./i18n/preference";

openInLearnerLanguage();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
