import { LibraryFrame } from "@/site/library";

/* Every page of Blocks. */
export default function BlocksLayout({ children }: LayoutProps<"/blocks">) {
  return <LibraryFrame>{children}</LibraryFrame>;
}
