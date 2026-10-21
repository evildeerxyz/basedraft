"use client";

import { useCallback, useEffect, useRef, useState, type Dispatch } from "react";
import type { User } from "@/site/auth";
import { refresh, rpc, useRpc, watch } from "@/site/db";
import { templateOf } from "@/site/live";
import { toast } from "@/site/toast";
import { useProjectChannel } from "./channel";
import { idOf, merge3, validProject, type Action, type Project } from "./state";

/*
 * A signed-in person's project lives in their account. Studio keeps its own copy and saves the
 * whole project a moment after each change, if the account still has the version that change was
 * made on. When another tab (or someone it was shared with before) saved first, their save
 * arrives here (the project's live channel says it's there), is merged with what you changed
 * since (see merge3), and yours goes after it. Signed out, the project stays in this browser.
 */

export type CloudAccess = "owner" | "edit" | "view";
export type CloudStatus = "local" | "loading" | "saving" | "saved" | "denied" | "missing";

/** The project last open in this browser, and the version of it this browser last had. */
const CURRENT = "bd-studio-cloud";
type Current = { id: string; rev: number };
const readCurrent = (): Current | null => {
  try {
    const c = JSON.parse(localStorage.getItem(CURRENT) ?? "null") as Current | null;
    return c && typeof c.id === "string" && typeof c.rev === "number" ? c : null;
  } catch {
    return null;
  }
};
const writeCurrent = (c: Current | null) => {
  try {
    if (c) localStorage.setItem(CURRENT, JSON.stringify(c));
    else localStorage.removeItem(CURRENT);
  } catch {
    /* storage blocked: the account still has it */
  }
};

const same = (a: unknown, b: unknown) => a === b || JSON.stringify(a) === JSON.stringify(b);

/** A project nobody has touched: the template's home page, as it comes. */
function pristine(p: Project) {
  const t = templateOf(p.template);
  return Boolean(t && p.pages.length === 1 && !p.edits.length && same(p.pages[0].keys.map(idOf), t.home));
}

const SAVE_AFTER = 500;
type Base = { id: string; rev: number; data: Project };

export function useCloud({ user, loading, project, dispatch, fresh }: { user: User | null; loading: boolean; project: Project; dispatch: Dispatch<Action>; fresh: boolean }) {
  // One per open Studio, so a save coming back is known for this tab's own.
  const [client] = useState(() => crypto.randomUUID());
  const [link, setLink] = useState(() => new URLSearchParams(window.location.search).get("p"));
  const [id, setId] = useState<string | null>(() => link ?? (fresh ? null : (readCurrent()?.id ?? null)));
  // Work done signed out, or a template just picked, becomes a new draft once someone signs in.
  const adopt = useRef(fresh || (!readCurrent() && !link && !pristine(project)));
  const create = useCallback((a: { data: Project; client: string }) => rpc("projects_create", a), []);

  // Signed out, only a link is asked about (a shared one may be open to anyone).
  const asking = id !== null && (user !== null || (id === link && !loading));
  const remote = useRpc("projects_get", asking ? { id } : "skip");
  const list = useRpc("projects_list", user && !id ? {} : "skip");

  // The version this tab last had from the account: what its changes are made on. The ref is for
  // the effects (always current); the state, for drawing.
  const base = useRef<Base | null>(null);
  const [shown, setShown] = useState<Base | null>(null);
  const setBase = useCallback((b: Base | null) => {
    base.current = b;
    setShown(b);
    writeCurrent(b ? { id: b.id, rev: b.rev } : null);
  }, []);
  const latest = useRef(project);
  useEffect(() => {
    latest.current = project;
  });
  const [busy, setBusy] = useState(false);

  const access: CloudAccess | null = remote && !remote.denied ? remote.access : null;
  const canEdit = access === "owner" || access === "edit";

  /** Opens another project, from your drafts or a link. */
  const open = useCallback(
    (next: string) => {
      setBase(null);
      adopt.current = false;
      setId(next);
    },
    [setBase],
  );

  /** A new draft in your account, opened now. Signed out, a new project in this browser. */
  const startNew = useCallback(
    async (p: Project) => {
      if (!user) return dispatch({ type: "replace", project: p });
      const nid = await create({ data: p, client });
      setBase({ id: nid, rev: 1, data: p });
      adopt.current = false;
      dispatch({ type: "load", project: p });
      setId(nid);
    },
    [user, create, client, dispatch, setBase],
  );

  /** Back to your own drafts, when the one open is gone or not yours to open. */
  const leave = useCallback(() => {
    setBase(null);
    adopt.current = false;
    setId(null);
  }, [setBase]);

  // Signed in with nothing open: your newest draft, or this one saved as your first.
  const creating = useRef(false);
  useEffect(() => {
    if (!user || id || list === undefined || creating.current) return;
    if (!adopt.current && list?.mine[0]) {
      setId(list.mine[0].id);
      return;
    }
    creating.current = true;
    const data = latest.current;
    create({ data, client })
      .then((nid) => {
        setBase({ id: nid, rev: 1, data });
        adopt.current = false;
        setId(nid);
      })
      .catch(() => toast("Couldn't save this draft to your account", { tone: "error", detail: "It's still in this browser." }))
      .finally(() => (creating.current = false));
  }, [user, id, list, create, client, setBase]);

  // Signing out closes the account's project; this browser keeps a copy to go on with.
  const was = useRef(user);
  useEffect(() => {
    if (was.current && !user && id && id !== link) {
      base.current = null;
      setShown(null);
      setId(null);
    }
    was.current = user;
  }, [user, id, link]);

  // The address says which project is open, so it can be shared or come back to.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (id && asking) q.set("p", id);
    else q.delete("p");
    const next = `/studio${q.size ? `?${q}` : ""}`;
    if (next !== `${window.location.pathname}${window.location.search}`) window.history.replaceState(null, "", next);
  }, [id, asking]);

  // What the account has, as it changes: merged into this tab's copy as each save lands.
  useEffect(() => {
    if (!asking || !id) return;
    const project = watch("projects_get", { id });
    const arrived = () => {
      const r = project.current();
      if (r === undefined) return;
      if (r === null) {
        if (base.current?.id === id || id === link) toast("That project isn't there any more", { detail: "It may have been deleted. Here's your newest draft." });
        return leave();
      }
      // A project last open here under another account just isn't opened; a link says why.
      if (r.denied && id !== link) return leave();
      if (r.denied || !validProject(r.data)) return;
      // Opened by the id it had on Convex: from here on, by its own.
      if (r.id !== id) {
        if (id === link) setLink(r.id);
        return setId(r.id);
      }
      const data = r.data as Project;
      const b = base.current;
      const local = latest.current;
      if (!b || b.id !== id) {
        // The first look at it here. Changes this browser hadn't saved yet are kept and saved now.
        const cached = readCurrent();
        const unsaved = cached?.id === id && cached.rev === r.rev && !same(local, data) && r.access !== "view";
        setBase({ id, rev: r.rev, data });
        if (!unsaved && !same(local, data)) dispatch({ type: "load", project: data });
        return;
      }
      if (r.rev <= b.rev) return;
      setBase({ id, rev: r.rev, data });
      // This tab's own save, coming back.
      if (r.client === client) return;
      const merged = same(local, b.data) ? data : merge3(b.data, local, data);
      if (!same(merged, local)) dispatch({ type: "sync", project: merged });
    };
    // A result already in hand comes on the next tick; later ones as they land.
    const first = setTimeout(arrived, 0);
    const stop = project.onUpdate(arrived);
    return () => {
      clearTimeout(first);
      stop();
    };
  }, [asking, id, link, client, dispatch, leave, setBase]);

  // The project's live channel says when there's something new to fetch: someone's save, a
  // change to who has access, or anything missed while the channel wasn't connected.
  const projectId = asking && remote && !remote.denied ? remote.id : null;
  useProjectChannel(projectId, (event, said) => {
    // This tab's own save, already in hand.
    if (event === "project" && said.client === client && typeof said.rev === "number" && base.current && said.rev <= base.current.rev) return;
    if (event === "project" || event === "access" || event === "joined") refresh("projects_get");
  });

  // Saving, a moment after each change, one save at a time.
  const dirty = Boolean(shown && shown.id === id && !same(project, shown.data));
  useEffect(() => {
    if (!dirty || !canEdit || busy) return;
    const t = setTimeout(async () => {
      const from = base.current;
      if (!from) return;
      const sent = latest.current;
      setBusy(true);
      try {
        const r = await rpc("projects_save", { id: from.id, data: sent, rev: from.rev, client });
        // Not saved: someone else saved first. Theirs arrives, merges with this, and this saves after it.
        if (r.ok && base.current?.id === from.id && base.current.rev < r.rev) setBase({ id: from.id, rev: r.rev, data: sent });
      } catch (e) {
        toast("Couldn't save to your account", { tone: "error", detail: e instanceof Error ? e.message : "Your changes are kept here and save again on your next edit." });
      } finally {
        setBusy(false);
      }
    }, SAVE_AFTER);
    return () => clearTimeout(t);
  }, [project, dirty, canEdit, busy, client, setBase]);

  const status: CloudStatus = !asking ? (user || loading ? "loading" : "local") : remote === undefined ? "loading" : remote === null ? "missing" : remote.denied ? "denied" : busy || (dirty && canEdit) ? "saving" : "saved";
  return {
    id: projectId,
    access,
    canEdit,
    owner: remote && !remote.denied ? remote.owner : null,
    status,
    deniedSignedIn: Boolean(remote && remote.denied && remote.signedIn),
    open,
    startNew,
    leave,
  };
}
