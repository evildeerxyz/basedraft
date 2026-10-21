import "@/registry/extras.css";
import { LibraryFrame } from "@/site/library";

/* Every page of the components library, with basedraft UI's materials (extras.css) loaded for the previews. */
export default function ComponentsLayout({ children }: LayoutProps<"/components">) {
  return <LibraryFrame>{children}</LibraryFrame>;
}
