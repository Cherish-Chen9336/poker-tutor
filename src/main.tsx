import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import App from "./App.tsx";
import { startCounting } from "./app/analytics";
import { openInLearnerLanguage } from "./i18n/preference";

const firstHash = window.location.hash;
openInLearnerLanguage();
// After the language redirect, so the first page is counted at its final address.
startCounting(firstHash);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
