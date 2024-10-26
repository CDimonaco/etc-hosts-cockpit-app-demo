import React from "react";
import "patternfly/patternfly-5-cockpit.scss";
import "@patternfly/react-core/dist/styles/base.css";
import { createRoot } from "react-dom/client";

import { Application } from "./app.jsx";

document.addEventListener("DOMContentLoaded", () => {
    createRoot(document.getElementById("app")!).render(<Application />);
});
