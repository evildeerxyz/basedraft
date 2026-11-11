/*
 * The database's functions (supabase/migrations) as the site calls them: what each takes, and
 * what it gives back. Times are milliseconds since 1970.
 */

export type Access = "owner" | "edit" | "view";
type None = Record<string, never>;

/** A project as the Library shows it. */
export type Draft = { id: string; name: string; template: string; updatedAt: number; role: string; owner: string; lead: string | null; shared: boolean };
export type Drafts = { mine: Draft[]; team: Draft[]; shared: Draft[]; teamName: string | null };
export type RemoteProject = { denied: true; signedIn: boolean } | { denied: false; id: string; data: unknown; rev: number; client: string | null; access: Access; owner: string | null };

export interface Api {
  projects_list: { args: None; returns: Drafts | null };
  projects_get: { args: { id: string }; returns: RemoteProject | null };
  projects_create: { args: { data: unknown; client?: string }; returns: string };
  projects_save: { args: { id: string; data: unknown; rev: number; client: string }; returns: { ok: boolean; rev: number } };
  projects_remove: { args: { id: string }; returns: null };

  claim_welcome: { args: None; returns: boolean };
}

export type Fn = keyof Api;
export type Args<F extends Fn> = Api[F]["args"];
export type Result<F extends Fn> = Api[F]["returns"];
