/*
 * The database's functions (supabase/migrations) as the site calls them: what each takes, and
 * what it gives back. Times are milliseconds since 1970.
 */

export type Access = "owner" | "edit" | "view";
export type Role = "edit" | "view";
type None = Record<string, never>;

export type Purchase = { id: string; product: string; at: number; amount?: number; currency?: string };
/** What someone may take: the products they bought (plus Pro, through their team). */
export type Mine = { products: string[]; viaTeam: boolean; purchases: Purchase[] };

export type Member = { id: string; email: string; role: "owner" | "member"; status: "invited" | "active"; name: string | null };
export type TeamMine = { team: { id: string; name: string } | null; canCreate: boolean; role?: "owner" | "member"; people?: Member[]; seats?: number };
/** What a team invite's email needs. */
export type InviteMail = { id: string; email: string; token: string; team: string; inviter: string; inviterEmail: string };
export type Invitation = { team: string; inviter: string; email: string };

/** A project as the Library shows it. */
export type Draft = { id: string; name: string; template: string; updatedAt: number; role: string; owner: string; lead: string | null; shared: boolean };
export type Drafts = { mine: Draft[]; team: Draft[]; shared: Draft[]; teamName: string | null };
export type RemoteProject = { denied: true; signedIn: boolean } | { denied: false; id: string; data: unknown; rev: number; client: string | null; access: Access; owner: string | null };
export type People = { owner: { name: string; email: string }; people: { id: string; email: string; role: Role }[]; linkAccess: "none" | "view"; team: { name: string; shared: boolean } | null; canManage: boolean };
/** What the email to someone a project is shared with needs. */
export type ShareMail = { email: string; project: string; inviter: string; role: Role; id: string };
export type Version = { id: string; name: string | null; at: number; author: string; auto: boolean };
export type CommentRow = { id: string; view: string; device: string | null; anchor: string | null; x: number; y: number; parentId: string | null; author: string; authorId: string | null; body: string; resolved: boolean; at: number };
export type SavedSection = { id: string; template: string; sectionId: string; at: number };

export interface Api {
  purchases_mine: { args: None; returns: Mine | null };
  record_purchase: {
    args: { event_id: string; email: string; product: string; payment_id: string; user_id?: string; membership_id?: string; plan_id?: string; amount?: number; currency?: string };
    returns: { id: string; email: string; product: string; payment_id: string; amount: number | null; currency: string | null } | null;
  };
  end_purchase: { args: { event_id: string; status: "refunded" | "ended"; payment_id?: string; membership_id?: string }; returns: null };

  teams_mine: { args: { preview: boolean }; returns: TeamMine | null };
  teams_create: { args: { name: string; preview: boolean }; returns: string };
  teams_rename: { args: { name: string }; returns: null };
  teams_invite: { args: { email: string }; returns: InviteMail };
  teams_resend: { args: { member_id: string }; returns: InviteMail };
  teams_remove: { args: { member_id: string }; returns: null };
  teams_leave: { args: None; returns: null };
  teams_invitation: { args: { token: string }; returns: Invitation | null };
  teams_accept: { args: { token: string }; returns: string };

  projects_list: { args: None; returns: Drafts | null };
  projects_get: { args: { id: string }; returns: RemoteProject | null };
  projects_create: { args: { data: unknown; client?: string }; returns: string };
  projects_save: { args: { id: string; data: unknown; rev: number; client: string }; returns: { ok: boolean; rev: number } };
  projects_remove: { args: { id: string }; returns: null };
  projects_people: { args: { id: string }; returns: People };
  projects_invite: { args: { id: string; email: string; role: Role }; returns: ShareMail | null };
  projects_set_role: { args: { member_id: string; role: Role }; returns: null };
  projects_unshare: { args: { member_id: string }; returns: null };
  projects_set_link: { args: { id: string; access: "none" | "view" }; returns: null };
  projects_set_team: { args: { id: string; shared: boolean }; returns: null };

  versions_list: { args: { project_id: string }; returns: Version[] };
  versions_save: { args: { project_id: string; name: string }; returns: null };
  versions_get: { args: { id: string }; returns: { data: unknown; name: string | null; at: number } | null };

  comments_list: { args: { project_id: string }; returns: CommentRow[] };
  comments_create: { args: { project_id: string; view: string; x: number; y: number; body: string; device?: string; anchor?: string; parent_id?: string }; returns: string };
  comments_resolve: { args: { id: string; resolved: boolean }; returns: null };
  comments_remove: { args: { id: string }; returns: null };

  saved_list: { args: None; returns: SavedSection[] | null };
  saved_add: { args: { template: string; section_id: string }; returns: null };
  saved_remove: { args: { id: string }; returns: null };

  claim_welcome: { args: None; returns: boolean };
}

export type Fn = keyof Api;
export type Args<F extends Fn> = Api[F]["args"];
export type Result<F extends Fn> = Api[F]["returns"];
