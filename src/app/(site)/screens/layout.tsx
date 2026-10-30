import "@/registry/extras.css";
import { LibraryFrame } from "@/site/library";

/* Every page of the screens, with basedraft UI's materials (extras.css) loaded, since the screens are made of it. */
export default function ScreensLayout({ children }: LayoutProps<"/screens">) {
  return <LibraryFrame>{children}</LibraryFrame>;
}
