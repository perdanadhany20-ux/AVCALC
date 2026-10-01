import path from "node:path";
import { Font } from "@react-pdf/renderer";

let registered = false;

export function registerPdfFonts() {
  if (registered) return;
  const dir = path.join(process.cwd(), "assets", "fonts");
  Font.register({
    family: "DejaVu",
    fonts: [
      { src: path.join(dir, "DejaVuSans.ttf") },
      { src: path.join(dir, "DejaVuSans-Bold.ttf"), fontWeight: 700 },
    ],
  });
  Font.register({
    family: "SpaceGrotesk",
    fonts: [
      { src: path.join(dir, "space-grotesk-latin-600-normal.woff"), fontWeight: 600 },
      { src: path.join(dir, "space-grotesk-latin-700-normal.woff"), fontWeight: 700 },
    ],
  });
  Font.registerHyphenationCallback((word) => [word]);
  registered = true;
}
