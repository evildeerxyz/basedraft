"use client";

import { ArrowCounterClockwiseIcon, GitCommitIcon, HammerIcon, RocketLaunchIcon, WarningIcon } from "@phosphor-icons/react";
import { useEffect, useState, type ComponentType } from "react";
import { Button } from "../../ui/button";
import { Timeline, TimelineGroup, TimelineItem, TimelineMeta, TimelineQuote } from "../../ui/timeline";

const MAYA = { name: "Maya Okafor" };
const JONAH = { name: "Jonah Park" };
const LEA = { name: "Lea Moreau" };

/* A commit hash, set in mono. */
const Hash = ({ children }: { children: string }) => <code className="font-mono text-[11.5px]">{children}</code>;

/** A build that finishes, then a comment that arrives at the top. Again plays it over. */
function Activity({ onAgain }: { onAgain: () => void }) {
  const [built, setBuilt] = useState(false);
  const [comment, setComment] = useState(false);
  useEffect(() => {
    const a = setTimeout(() => setBuilt(true), 2600);
    const b = setTimeout(() => setComment(true), 4800);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, []);
  return (
    <div className="grid w-full max-w-[420px] gap-2">
      <Timeline continues>
        <TimelineGroup label="Today">
          {comment && (
            <TimelineItem key="lea" time="09:42" person={LEA} title="commented on Pricing">
              <TimelineQuote>Can the yearly price round to $12?</TimelineQuote>
            </TimelineItem>
          )}
          <TimelineItem key="build" time="09:30" live={!built} tone={built ? "ok" : "default"} icon={built ? <RocketLaunchIcon weight="duotone" /> : <HammerIcon weight="duotone" />} title={built ? "Published to zuno.site" : "Building zuno.site"}>
            <TimelineMeta items={["main", <Hash key="h">a3f9c1e</Hash>, built ? "41s" : "Rendering 14 pages"]} />
          </TimelineItem>
          <TimelineItem key="maya" minor time="09:12" person={MAYA} title="changed the headline" />
        </TimelineGroup>
        <TimelineGroup label="Yesterday">
          <TimelineItem minor time="17:05" person={JONAH} title="invited Lea Moreau" />
          <TimelineItem time="16:40" tone="stop" icon={<WarningIcon weight="duotone" />} title="Build failed">
            <TimelineMeta items={["main", <Hash key="h">9be20d4</Hash>, "pricing/plans.ts"]} />
          </TimelineItem>
        </TimelineGroup>
      </Timeline>
      <div className="flex h-8 justify-center">
        {comment && (
          <Button variant="ghost" size="sm" onClick={onAgain}>
            <ArrowCounterClockwiseIcon weight="regular" /> Again
          </Button>
        )}
      </div>
    </div>
  );
}

export function Demo() {
  const [run, setRun] = useState(0);
  return <Activity key={run} onAgain={() => setRun((r) => r + 1)} />;
}

function Deploys() {
  return (
    <Timeline continues className="w-full max-w-[420px]">
      <TimelineItem time="09:30" tone="ok" icon={<RocketLaunchIcon weight="duotone" />} title="Published to zuno.site">
        <TimelineMeta items={["main", <Hash key="h">a3f9c1e</Hash>, "41s"]} />
      </TimelineItem>
      <TimelineItem time="09:18" icon={<GitCommitIcon weight="duotone" />} title="Pushed 3 commits to main" />
      <TimelineItem time="08:52" tone="stop" icon={<WarningIcon weight="duotone" />} title="Build failed">
        pricing/plans.ts: Type &apos;string&apos; is not assignable to type &apos;number&apos;.
      </TimelineItem>
    </Timeline>
  );
}

function Comments() {
  return (
    <Timeline className="w-full max-w-[420px]">
      <TimelineItem time="2m" person={LEA} title="commented on Pricing">
        <TimelineQuote>Can the yearly price round to $12?</TimelineQuote>
      </TimelineItem>
      <TimelineItem time="1h" person={MAYA} title="replied">
        <TimelineQuote>It can. I&apos;ll change it in the plans file.</TimelineQuote>
      </TimelineItem>
    </Timeline>
  );
}

function Days() {
  return (
    <Timeline className="w-full max-w-[420px]">
      <TimelineGroup label="Today">
        <TimelineItem time="11:04" person={MAYA} title="published zuno.site" />
        <TimelineItem minor time="10:51" person={MAYA} title="changed the headline" />
        <TimelineItem minor time="10:47" person={MAYA} title="moved Pricing above FAQ" />
      </TimelineGroup>
      <TimelineGroup label="Monday, October 12">
        <TimelineItem time="16:20" person={JONAH} title="invited Lea Moreau" />
        <TimelineItem minor time="16:02" tone="warn" title="Domain check is still waiting on DNS" />
      </TimelineGroup>
    </Timeline>
  );
}

function Live() {
  return (
    <Timeline className="w-full max-w-[420px]">
      <TimelineItem time="now" live icon={<HammerIcon weight="duotone" />} title="Building zuno.site">
        Step 2 of 3: rendering 14 pages.
      </TimelineItem>
      <TimelineItem minor time="18s" tone="ok" title="Installed packages" />
      <TimelineItem minor time="31s" tone="ok" title="Pulled main" />
    </Timeline>
  );
}

export const examples: Record<string, ComponentType> = { deploys: Deploys, comments: Comments, days: Days, live: Live };
