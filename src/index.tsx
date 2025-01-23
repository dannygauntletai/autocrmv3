import './index.css';
import { createRoot } from "react-dom/client";
import { App } from "./App";
// ... existing code ...

const root = createRoot(document.getElementById("root")!);
root.render(<App />);