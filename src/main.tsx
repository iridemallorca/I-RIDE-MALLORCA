import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import IRideMallorcaPage from "./pages/IRideMallorcaPage";

const el = document.getElementById("root")!;
createRoot(el).render(<IRideMallorcaPage />);
