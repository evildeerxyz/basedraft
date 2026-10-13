import { pageMeta } from "@/lib/metadata";
import { DocArticle } from "@/components/site/doc-article";
import { getDoc } from "@/lib/content/docs";

export const metadata = pageMeta("Docs", "Install Auren, hand off your first task, and learn how agents, Tab and rules work.");

export default function DocsIndex() {
  return <DocArticle doc={getDoc("introduction")!} />;
}
