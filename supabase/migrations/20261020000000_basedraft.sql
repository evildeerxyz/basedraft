/*
 * basedraft's data on Supabase.
 *
 * The browser never reads or writes a table itself: every table has row level security on and no
 * policies, and everything goes through the functions in the public schema below, which decide
 * who may do what. The browser calls them with supabase.rpc() as whoever is signed in (or no one);
 * the site's server calls the same ones as the signed-in person, and two (a purchase, and its end)
 * as basedraft itself, for Whop's webhook. Helpers live in the private schema, out of the API.
 *
 * Open Studios hear about changes on a project's live channel ("project:<id>"): the triggers at
 * the end announce each change there, and each Studio fetches what changed.
 *
 * Times come back as milliseconds since 1970, as Convex gave them, so the site's code reads them
 * as it always has.
 */

create schema if not exists private;

/* ---------- tables ---------- */

/* Everything bought through Whop, one row per purchase, tied to a basedraft account by id or email. */
create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  email text not null,
  product text not null,
  status text not null default 'active' check (status in ('active', 'refunded', 'ended')),
  payment_id text unique,
  membership_id text,
  plan_id text,
  amount numeric,
  currency text,
  created_at timestamptz not null default now()
);
create index purchases_user on public.purchases (user_id);
create index purchases_email on public.purchases (email);
create index purchases_membership on public.purchases (membership_id);

/* Webhook deliveries already handled: Whop delivers at least once, sometimes twice. */
create table public.webhook_events (
  event_id text primary key,
  created_at timestamptz not null default now()
);

/* A Team plan's people: one owner, up to ten seats. Members get Pro while they're in it. */
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);
create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  email text not null,
  user_id uuid references auth.users (id) on delete cascade,
  role text not null check (role in ('owner', 'member')),
  status text not null check (status in ('invited', 'active')),
  token text unique,
  invited_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (team_id, email)
);
create index team_members_user on public.team_members (user_id);

/* A Studio project, saved to its owner's account and shared with whoever they choose. */
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  template text not null,
  data jsonb not null,
  team_id uuid references public.teams (id) on delete set null,
  link_access text not null default 'none' check (link_access in ('none', 'view')),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null,
  /* The open Studio (one browser tab) that saved last, so it knows its own save when it comes back. */
  updated_client text,
  rev integer not null default 1,
  /* Its id on Convex, for projects made there: links from before the move still open them. */
  legacy_id text unique,
  created_at timestamptz not null default now()
);
create index projects_owner on public.projects (owner_id, updated_at desc);
create index projects_team on public.projects (team_id, updated_at desc);

/* People a project is shared with, by email, so it's waiting for them when they sign up. */
create table public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  email text not null,
  role text not null check (role in ('edit', 'view')),
  invited_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (project_id, email)
);
create index project_members_email on public.project_members (email);

/* Saved versions of a project: named ones, and one every ten minutes of editing. */
create table public.versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  name text,
  data jsonb not null,
  author_id uuid references auth.users (id) on delete set null,
  author_name text not null,
  auto boolean not null default false,
  created_at timestamptz not null default now()
);
create index versions_project on public.versions (project_id, created_at desc);

/* Comments pinned to a spot on a page, and their replies. */
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  view text not null,
  device text,
  /* The section (or block) the pin sits on; x and y are then from its top left, so it moves with it. */
  anchor text,
  x double precision not null,
  y double precision not null,
  parent_id uuid references public.comments (id) on delete cascade,
  author_id uuid references auth.users (id) on delete set null,
  author_name text not null,
  body text not null,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);
create index comments_project on public.comments (project_id);
create index comments_parent on public.comments (parent_id);

/* Sections saved to someone's Library, to drop into any page of their template. */
create table public.saved (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  template text not null,
  section_id text not null,
  created_at timestamptz not null default now(),
  unique (user_id, template, section_id)
);

/* Who has had their welcome email, so it goes once. */
create table public.welcomed (
  user_id uuid primary key references auth.users (id) on delete cascade,
  at timestamptz not null default now()
);

/*
 * This database's own settings. ('preview_allowed', '1') lets a development project preview the
 * Team plan without buying it; production leaves it out.
 */
create table public.settings (
  key text primary key,
  value text not null
);

alter table public.purchases enable row level security;
alter table public.webhook_events enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.versions enable row level security;
alter table public.comments enable row level security;
alter table public.saved enable row level security;
alter table public.welcomed enable row level security;
alter table public.settings enable row level security;

/* ---------- who's asking ---------- */

create function private.ms(t timestamptz) returns bigint
language sql immutable set search_path = ''
as $$ select (extract(epoch from t) * 1000)::bigint $$;

create function private.email_of(uid uuid) returns text
language sql stable set search_path = ''
as $$ select lower(u.email) from auth.users u where u.id = uid $$;

/** The name someone gave, or null. */
create function private.name_of(uid uuid) returns text
language sql stable set search_path = ''
as $$
  select coalesce(nullif(trim(u.raw_user_meta_data ->> 'name'), ''), nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''))
  from auth.users u where u.id = uid
$$;

/** The signed-in person's email, in lower case, or null. */
create function private.my_email() returns text
language sql stable set search_path = ''
as $$ select private.email_of(auth.uid()) $$;

/** Who's asking, as others see them: their name, or the start of their email. */
create function private.my_name() returns text
language sql stable set search_path = ''
as $$ select coalesce(private.name_of(auth.uid()), split_part(private.my_email(), '@', 1)) $$;

create function private.must_be_me() returns uuid
language plpgsql stable set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Sign in first.';
  end if;
  return auth.uid();
end
$$;

create function private.valid_email(e text) returns boolean
language sql immutable set search_path = ''
as $$ select e ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' $$;

create function private.seats() returns integer
language sql immutable set search_path = ''
as $$ select 10 $$;

/** The team someone owns or is an active member of, with their role in it (both null without one). */
create function private.team_of(uid uuid, out team_id uuid, out role text)
language sql stable set search_path = ''
as $$
  select x.team_id, x.role from (
    select t.id as team_id, 'owner' as role, 0 as rank from public.teams t where t.owner_id = uid
    union all
    select m.team_id, 'member', 1 from public.team_members m where m.user_id = uid and m.status = 'active'
  ) x
  order by x.rank
  limit 1
$$;

/* ---------- what they may do with a project ---------- */

/** What the signed-in person may do with a project: own it, edit it (shared, or their team's), view it, or nothing (null). */
create function private.access_to(p public.projects) returns text
language plpgsql stable set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  shared text;
begin
  if uid is not null then
    if p.owner_id = uid then
      return 'owner';
    end if;
    if p.team_id is not null and p.team_id = (private.team_of(uid)).team_id then
      return 'edit';
    end if;
    select m.role into shared from public.project_members m where m.project_id = p.id and m.email = private.my_email();
    if shared is not null then
      return shared;
    end if;
  end if;
  return case when p.link_access = 'view' then 'view' end;
end
$$;

create function private.at_least(access text, need text) returns boolean
language sql immutable set search_path = ''
as $$ select coalesce(array_position(array['view', 'edit', 'owner'], access) >= array_position(array['view', 'edit', 'owner'], need), false) $$;

/** A project, if the signed-in person may `need` it ('view', 'edit' or 'owner'); otherwise an error that says why. */
create function private.project_for(pid uuid, need text) returns public.projects
language plpgsql stable set search_path = ''
as $$
declare
  p public.projects;
begin
  select * into p from public.projects where id = pid;
  if not found then
    raise exception 'That project isn''t there any more.';
  end if;
  if not private.at_least(private.access_to(p), need) then
    raise exception '%', case when need = 'view' then 'You don''t have access to this project.' else 'You can only view this project.' end;
  end if;
  return p;
end
$$;

/** A project by its id, or by its Convex id. Anything else finds nothing. */
create function private.find_project(ref text) returns public.projects
language sql stable set search_path = ''
as $$
  select * from public.projects p
  where p.id = case when ref ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then ref::uuid end
     or p.legacy_id = ref
  limit 1
$$;

/**
 * Who may listen on a project's live channel ("project:<id>"): anyone who may view the project.
 * Signed in, they may send on it too (their cursor). Realtime asks this when a channel is joined.
 */
create function private.channel_access(topic text) returns boolean
language plpgsql stable security definer set search_path = ''
as $$
declare
  p public.projects;
begin
  if topic !~ '^project:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return false;
  end if;
  select * into p from public.projects where id = substr(topic, 9)::uuid;
  return found and private.access_to(p) is not null;
end
$$;

/* ---------- purchases ---------- */

/* What someone has bought, and what it lets them take. */

/** Someone's active purchases: on their account, or bought with their email (before signing up, or straight from Whop). */
create function private.active_purchases(uid uuid, mail text) returns setof public.purchases
language sql stable set search_path = ''
as $$ select * from public.purchases p where p.status = 'active' and (p.user_id = uid or p.email = lower(mail)) $$;

create function private.has_team_plan(uid uuid) returns boolean
language sql stable set search_path = ''
as $$ select exists (select 1 from private.active_purchases(uid, private.email_of(uid)) a where a.product = 'team') $$;

/** Someone on a team whose owner has the Team plan has Pro through it, for as long as they're on it. */
create function private.via_team(uid uuid) returns boolean
language plpgsql stable set search_path = ''
as $$
declare
  seat record;
begin
  select * into seat from private.team_of(uid);
  if seat.team_id is null or seat.role <> 'member' then
    return false;
  end if;
  return private.has_team_plan((select t.owner_id from public.teams t where t.id = seat.team_id));
end
$$;

/**
 * The signed-in person's purchases, and the products they may take (with Pro from their team), or
 * null when signed out. Which templates those products unlock is src/lib/products.ts's to say.
 */
create function public.purchases_mine() returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  bought jsonb;
  products text[];
  bought_all boolean;
begin
  if uid is null then
    return null;
  end if;
  select
    coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object('id', a.id, 'product', a.product, 'at', private.ms(a.created_at), 'amount', a.amount, 'currency', a.currency)) order by a.created_at), '[]'),
    coalesce(array_agg(distinct a.product), '{}')
  into bought, products
  from private.active_purchases(uid, private.my_email()) a;
  bought_all := products && array['pro', 'team'];
  if not bought_all and private.via_team(uid) then
    products := array_append(products, 'pro');
  end if;
  return jsonb_build_object('products', to_jsonb(products), 'viaTeam', not bought_all and 'pro' = any(products), 'purchases', bought);
end
$$;

/**
 * A paid order, from Whop's webhook. Recording the same event or payment twice changes nothing.
 * The purchase, for its email, or null when there's nothing new.
 */
create function public.record_purchase(event_id text, email text, product text, payment_id text, user_id text default null, membership_id text default null, plan_id text default null, amount numeric default null, currency text default null) returns jsonb
language plpgsql security definer set search_path = ''
as $$
#variable_conflict use_column
declare
  buyer uuid;
  bought public.purchases;
begin
  insert into public.webhook_events (event_id) values (record_purchase.event_id) on conflict do nothing;
  if not found then
    return null;
  end if;
  if exists (select 1 from public.purchases p where p.payment_id = record_purchase.payment_id) then
    return null;
  end if;
  -- The account the checkout was opened from. One opened before the move to Supabase carries a
  -- Convex id, which isn't one: its email finds the account instead.
  if record_purchase.user_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    select u.id into buyer from auth.users u where u.id = record_purchase.user_id::uuid;
  end if;
  insert into public.purchases (user_id, email, product, payment_id, membership_id, plan_id, amount, currency, status)
  values (buyer, lower(record_purchase.email), record_purchase.product, record_purchase.payment_id, record_purchase.membership_id, record_purchase.plan_id, record_purchase.amount, record_purchase.currency, 'active')
  returning * into bought;
  return to_jsonb(bought);
end
$$;

/** A refund or an ended subscription takes the purchase's access away. */
create function public.end_purchase(event_id text, status text, payment_id text default null, membership_id text default null) returns void
language plpgsql security definer set search_path = ''
as $$
#variable_conflict use_column
begin
  insert into public.webhook_events (event_id) values (end_purchase.event_id) on conflict do nothing;
  if not found then
    return;
  end if;
  update public.purchases set status = end_purchase.status
  where id = (
    select p.id from public.purchases p
    where case when end_purchase.payment_id is not null then p.payment_id = end_purchase.payment_id else p.membership_id = end_purchase.membership_id end
    limit 1
  );
end
$$;

/* ---------- teams ---------- */

/*
 * Teams: the Team plan's ten seats. The owner invites people by email; an invite is a link that
 * works once, for that email, and joining gives them Pro while they're on the team. The owner
 * can remove anyone; anyone can leave. A team exists once its owner has the Team plan (or, on a
 * development project, previews it).
 */

create function private.preview_allowed(preview boolean) returns boolean
language sql stable set search_path = ''
as $$ select coalesce(preview, false) and exists (select 1 from public.settings s where s.key = 'preview_allowed' and s.value = '1') $$;

create function private.team_people(tid uuid) returns jsonb
language sql stable set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', m.id, 'email', m.email, 'role', m.role, 'status', m.status, 'name', private.name_of(m.user_id)) order by m.created_at), '[]')
  from public.team_members m where m.team_id = tid
$$;

/** Your team, its people and your place in it, or what's stopping you from having one. */
create function public.teams_mine(preview boolean default false) returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  seat record;
  team public.teams;
begin
  if uid is null then
    return null;
  end if;
  select * into seat from private.team_of(uid);
  if seat.team_id is null then
    return jsonb_build_object('team', null, 'canCreate', private.preview_allowed(preview) or private.has_team_plan(uid));
  end if;
  select * into team from public.teams t where t.id = seat.team_id;
  return jsonb_build_object('team', jsonb_build_object('id', team.id, 'name', team.name), 'role', seat.role, 'people', private.team_people(team.id), 'seats', private.seats(), 'canCreate', false);
end
$$;

create function public.teams_create(name text, preview boolean default false) returns uuid
language plpgsql security definer set search_path = ''
as $$
#variable_conflict use_column
declare
  uid uuid := private.must_be_me();
  made uuid;
begin
  if (private.team_of(uid)).team_id is not null then
    raise exception 'You''re already on a team.';
  end if;
  if not private.preview_allowed(teams_create.preview) and not private.has_team_plan(uid) then
    raise exception 'Teams come with basedraft Team.';
  end if;
  insert into public.teams (owner_id, name)
  values (uid, coalesce(nullif(left(trim(teams_create.name), 60), ''), private.my_name() || '''s team'))
  returning id into made;
  insert into public.team_members (team_id, email, user_id, role, status) values (made, private.my_email(), uid, 'owner', 'active');
  return made;
end
$$;

/** The team the signed-in person owns, or an error: only its owner can change it. */
create function private.owned_team() returns public.teams
language plpgsql stable set search_path = ''
as $$
declare
  seat record;
  team public.teams;
begin
  select * into seat from private.team_of(private.must_be_me());
  if seat.team_id is null or seat.role <> 'owner' then
    raise exception 'Only the team''s owner can do that.';
  end if;
  select * into team from public.teams t where t.id = seat.team_id;
  return team;
end
$$;

create function public.teams_rename(name text) returns void
language plpgsql security definer set search_path = ''
as $$
#variable_conflict use_column
declare
  team public.teams := private.owned_team();
begin
  if trim(teams_rename.name) <> '' then
    update public.teams set name = left(trim(teams_rename.name), 60) where id = team.id;
  end if;
end
$$;

/** What a team invite's email needs: who it's to, its link's token, the team, and who's inviting. */
create function private.invite_mail(m public.team_members) returns jsonb
language sql stable set search_path = ''
as $$
  select jsonb_build_object('id', m.id, 'email', m.email, 'token', m.token, 'team', coalesce((select t.name from public.teams t where t.id = m.team_id), 'a team'), 'inviter', private.my_name(), 'inviterEmail', private.my_email())
$$;

/** An invite by email: a seat held for them. Returns what the email with their link needs (the site sends it). */
create function public.teams_invite(email text) returns jsonb
language plpgsql security definer set search_path = ''
as $$
#variable_conflict use_column
declare
  team public.teams := private.owned_team();
  mail text := lower(trim(teams_invite.email));
  seat public.team_members;
begin
  if not private.valid_email(mail) then
    raise exception 'That doesn''t look like an email address.';
  end if;
  if exists (select 1 from public.team_members m where m.team_id = team.id and m.email = mail) then
    raise exception 'They''re already on the team, or invited.';
  end if;
  if (select count(*) from public.team_members m where m.team_id = team.id) >= private.seats() then
    raise exception 'Your team has all % seats taken. Remove someone to invite another.', private.seats();
  end if;
  insert into public.team_members (team_id, email, role, status, token, invited_by)
  values (team.id, mail, 'member', 'invited', replace(gen_random_uuid()::text, '-', ''), auth.uid())
  returning * into seat;
  return private.invite_mail(seat);
end
$$;

/** An open invite's email again. */
create function public.teams_resend(member_id uuid) returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  team public.teams := private.owned_team();
  seat public.team_members;
begin
  select * into seat from public.team_members m where m.id = member_id;
  if not found or seat.team_id <> team.id or seat.status <> 'invited' then
    raise exception 'That invite isn''t open any more.';
  end if;
  return private.invite_mail(seat);
end
$$;

/** The owner takes someone off the team, or cancels an invite. Their Pro ends with it. */
create function public.teams_remove(member_id uuid) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  team public.teams := private.owned_team();
  seat public.team_members;
begin
  select * into seat from public.team_members m where m.id = member_id;
  if not found or seat.team_id <> team.id then
    return;
  end if;
  if seat.role = 'owner' then
    raise exception 'The owner can''t be removed from their own team.';
  end if;
  delete from public.team_members m where m.id = seat.id;
end
$$;

create function public.teams_leave() returns void
language plpgsql security definer set search_path = ''
as $$
begin
  delete from public.team_members m
  where m.id = (select s.id from public.team_members s where s.user_id = private.must_be_me() and s.status = 'active' and s.role = 'member' limit 1);
end
$$;

/** What an invite link is for, shown before joining. Anyone with the link can read this much. */
create function public.teams_invitation(token text) returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object('team', coalesce(t.name, 'a team'), 'inviter', coalesce(private.name_of(m.invited_by), private.email_of(m.invited_by), 'Someone'), 'email', m.email)
  from public.team_members m left join public.teams t on t.id = m.team_id
  where m.token = teams_invitation.token and m.status = 'invited'
$$;

create function public.teams_accept(token text) returns uuid
language plpgsql security definer set search_path = ''
as $$
#variable_conflict use_column
declare
  uid uuid := private.must_be_me();
  seat public.team_members;
  on_team record;
begin
  select * into seat from public.team_members m where m.token = teams_accept.token;
  if not found or seat.status <> 'invited' then
    raise exception 'That invite has been used or cancelled.';
  end if;
  if seat.email <> private.my_email() then
    raise exception 'This invite is for %. Sign in with that email to join.', seat.email;
  end if;
  select * into on_team from private.team_of(uid);
  if on_team.team_id is not null and on_team.team_id <> seat.team_id then
    raise exception 'You''re on %. Leave it first to join another team.', (select t.name from public.teams t where t.id = on_team.team_id);
  end if;
  update public.team_members set status = 'active', user_id = uid, token = null where id = seat.id;
  return seat.team_id;
end
$$;

/* ---------- projects ---------- */

/*
 * Studio projects, saved to their owner's account. Shared three ways: with people by email (who
 * can edit or view), with the owner's whole team (who can all edit), and as a view-only link.
 * Everyone with access works on the same project: a save is the whole project, the last one wins,
 * and every open Studio hears of it the moment it lands.
 */

/** Well within what a row holds; a real project is a few kilobytes. */
create function private.sized(data jsonb) returns void
language plpgsql immutable set search_path = ''
as $$
begin
  if length(coalesce(data, 'null'::jsonb)::text) > 600000 then
    raise exception 'This project is too big to save.';
  end if;
end
$$;

/** A project as the Library shows it. */
create function private.card(p public.projects, access text) returns jsonb
language sql stable set search_path = ''
as $$
  select jsonb_build_object(
    'id', p.id,
    'name', p.name,
    'template', p.template,
    'updatedAt', private.ms(p.updated_at),
    'role', access,
    'owner', coalesce(private.name_of(p.owner_id), private.email_of(p.owner_id), ''),
    -- The first section of its first page, past the nav: what its card shows.
    'lead', (
      select split_part(k.key, ':', 1)
      from jsonb_array_elements_text(case when jsonb_typeof(p.data -> 'pages' -> 0 -> 'keys') = 'array' then p.data -> 'pages' -> 0 -> 'keys' else '[]'::jsonb end) with ordinality as k(key, n)
      where split_part(k.key, ':', 1) <> 'nav'
      order by k.n
      limit 1
    ),
    'shared', p.team_id is not null or p.link_access = 'view'
  )
$$;

/** The Library's drafts: yours, your team's, and the ones shared with you. */
create function public.projects_list() returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  seat record;
  mine jsonb;
  team jsonb;
  shared jsonb;
begin
  if uid is null then
    return null;
  end if;
  select coalesce(jsonb_agg(x.card order by x.at desc), '[]') into mine
  from (select private.card(p, 'owner') as card, p.updated_at as at from public.projects p where p.owner_id = uid order by p.updated_at desc limit 60) x;
  select * into seat from private.team_of(uid);
  select coalesce(jsonb_agg(x.card order by x.at desc), '[]') into team
  from (select private.card(p, 'edit') as card, p.updated_at as at from public.projects p where p.team_id = seat.team_id and p.owner_id <> uid order by p.updated_at desc limit 60) x;
  select coalesce(jsonb_agg(private.card(p, m.role) order by p.updated_at desc), '[]') into shared
  from public.project_members m join public.projects p on p.id = m.project_id
  where m.email = private.my_email() and p.owner_id <> uid;
  return jsonb_build_object('mine', mine, 'team', team, 'shared', shared, 'teamName', (select t.name from public.teams t where t.id = seat.team_id));
end
$$;

/** One project, for Studio: its contents and what you may do with it. Any string is asked about: a broken link is just not there. */
create function public.projects_get(id text) returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  p public.projects := private.find_project(projects_get.id);
  access text;
begin
  if p.id is null then
    return null;
  end if;
  access := private.access_to(p);
  if access is null then
    return jsonb_build_object('denied', true, 'signedIn', auth.uid() is not null);
  end if;
  return jsonb_build_object(
    'denied', false,
    'id', p.id,
    'data', p.data,
    'rev', p.rev,
    'client', p.updated_client,
    'access', access,
    'owner', case when access = 'owner' then null else coalesce(private.name_of(p.owner_id), private.email_of(p.owner_id)) end
  );
end
$$;

create function public.projects_create(data jsonb, client text default null) returns uuid
language plpgsql security definer set search_path = ''
as $$
#variable_conflict use_column
declare
  uid uuid := private.must_be_me();
  made uuid;
begin
  perform private.sized(projects_create.data);
  insert into public.projects (owner_id, name, template, data, updated_by, updated_client)
  values (uid, left(coalesce(projects_create.data ->> 'name', 'Untitled'), 120), coalesce(projects_create.data ->> 'template', 'zuno'), projects_create.data, uid, projects_create.client)
  returning id into made;
  return made;
end
$$;

/**
 * Saves the whole project, if it's still the version the save was made from (`rev`). If someone
 * else saved in between, nothing changes and Studio merges their save with yours, then tries
 * again. Every ten minutes of editing also keeps an automatic version.
 */
create function public.projects_save(id uuid, data jsonb, rev integer, client text) returns jsonb
language plpgsql security definer set search_path = ''
as $$
#variable_conflict use_column
declare
  p public.projects := private.project_for(projects_save.id, 'edit');
  last timestamptz;
begin
  -- One save at a time: the next waits for this one, and then finds its version taken.
  select * into p from public.projects where id = p.id for update;
  if p.rev <> projects_save.rev then
    return jsonb_build_object('ok', false, 'rev', p.rev);
  end if;
  perform private.sized(projects_save.data);
  select max(v.created_at) into last from public.versions v where v.project_id = p.id;
  if last is null or now() - last > interval '10 minutes' then
    insert into public.versions (project_id, data, author_id, author_name, auto) values (p.id, p.data, auth.uid(), private.my_name(), true);
  end if;
  update public.projects
  set data = projects_save.data,
      name = left(coalesce(projects_save.data ->> 'name', p.name), 120),
      template = coalesce(projects_save.data ->> 'template', p.template),
      updated_at = now(),
      updated_by = auth.uid(),
      updated_client = projects_save.client,
      rev = p.rev + 1
  where id = p.id;
  return jsonb_build_object('ok', true, 'rev', p.rev + 1);
end
$$;

/** Deletes a project, and with it who it's shared with, its versions and its comments. */
create function public.projects_remove(id uuid) returns void
language plpgsql security definer set search_path = ''
as $$
#variable_conflict use_column
begin
  perform private.project_for(projects_remove.id, 'owner');
  delete from public.projects where id = projects_remove.id;
end
$$;

/** Who a project is shared with, for the Share dialog. */
create function public.projects_people(id uuid) returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  p public.projects := private.project_for(projects_people.id, 'view');
  seat record;
begin
  select * into seat from private.team_of(p.owner_id);
  return jsonb_build_object(
    'owner', jsonb_build_object('name', coalesce(private.name_of(p.owner_id), private.email_of(p.owner_id), ''), 'email', coalesce(private.email_of(p.owner_id), '')),
    'people', (select coalesce(jsonb_agg(jsonb_build_object('id', m.id, 'email', m.email, 'role', m.role) order by m.created_at), '[]') from public.project_members m where m.project_id = p.id),
    'linkAccess', p.link_access,
    'team', case when seat.team_id is null then null else jsonb_build_object('name', (select t.name from public.teams t where t.id = seat.team_id), 'shared', p.team_id is not distinct from seat.team_id) end,
    'canManage', private.access_to(p) = 'owner'
  );
end
$$;

/**
 * Shares a project with someone by email. Returns what the email to them needs (the site sends
 * it), or null when they already had it: then only their role changes, and no email goes.
 */
create function public.projects_invite(id uuid, email text, role text) returns jsonb
language plpgsql security definer set search_path = ''
as $$
#variable_conflict use_column
declare
  p public.projects := private.project_for(projects_invite.id, 'owner');
  mail text := lower(trim(projects_invite.email));
  known uuid;
begin
  if not private.valid_email(mail) then
    raise exception 'That doesn''t look like an email address.';
  end if;
  if mail = private.my_email() then
    raise exception 'That''s you: you own this project.';
  end if;
  select m.id into known from public.project_members m where m.project_id = p.id and m.email = mail;
  if known is not null then
    update public.project_members set role = projects_invite.role where id = known;
    return null;
  end if;
  insert into public.project_members (project_id, email, role, invited_by) values (p.id, mail, projects_invite.role, auth.uid());
  return jsonb_build_object('email', mail, 'project', p.name, 'inviter', private.my_name(), 'role', projects_invite.role, 'id', p.id);
end
$$;

create function public.projects_set_role(member_id uuid, role text) returns void
language plpgsql security definer set search_path = ''
as $$
#variable_conflict use_column
declare
  m public.project_members;
begin
  select * into m from public.project_members where id = projects_set_role.member_id;
  if not found then
    return;
  end if;
  perform private.project_for(m.project_id, 'owner');
  update public.project_members set role = projects_set_role.role where id = m.id;
end
$$;

create function public.projects_unshare(member_id uuid) returns void
language plpgsql security definer set search_path = ''
as $$
#variable_conflict use_column
declare
  m public.project_members;
begin
  select * into m from public.project_members where id = projects_unshare.member_id;
  if not found then
    return;
  end if;
  perform private.project_for(m.project_id, 'owner');
  delete from public.project_members where id = m.id;
end
$$;

create function public.projects_set_link(id uuid, access text) returns void
language plpgsql security definer set search_path = ''
as $$
#variable_conflict use_column
begin
  perform private.project_for(projects_set_link.id, 'owner');
  update public.projects set link_access = projects_set_link.access where id = projects_set_link.id;
end
$$;

/** Shares the project with everyone on the owner's team, or stops. */
create function public.projects_set_team(id uuid, shared boolean) returns void
language plpgsql security definer set search_path = ''
as $$
#variable_conflict use_column
declare
  p public.projects := private.project_for(projects_set_team.id, 'owner');
  seat record;
begin
  select * into seat from private.team_of(p.owner_id);
  if projects_set_team.shared and seat.team_id is null then
    raise exception 'You''re not on a team yet.';
  end if;
  update public.projects set team_id = case when projects_set_team.shared then seat.team_id end where id = p.id;
end
$$;

/* ---------- versions ---------- */

/* Saved versions of a project: named ones you make, and the automatic ones saving keeps. */

create function public.versions_list(project_id uuid) returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
#variable_conflict use_column
begin
  perform private.project_for(versions_list.project_id, 'view');
  return (
    select coalesce(jsonb_agg(jsonb_build_object('id', v.id, 'name', v.name, 'at', private.ms(v.created_at), 'author', v.author_name, 'auto', v.auto) order by v.created_at desc), '[]')
    from (select * from public.versions where project_id = versions_list.project_id order by created_at desc limit 50) v
  );
end
$$;

/** Keeps the project as it is now, under a name. */
create function public.versions_save(project_id uuid, name text) returns void
language plpgsql security definer set search_path = ''
as $$
#variable_conflict use_column
declare
  p public.projects := private.project_for(versions_save.project_id, 'edit');
begin
  insert into public.versions (project_id, name, data, author_id, author_name, auto)
  values (p.id, coalesce(nullif(left(trim(versions_save.name), 80), ''), 'Saved version'), p.data, auth.uid(), private.my_name(), false);
end
$$;

/** A version's contents, to restore in Studio (which saves it as the project again). */
create function public.versions_get(id uuid) returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
#variable_conflict use_column
declare
  v public.versions;
begin
  select * into v from public.versions where id = versions_get.id;
  if not found then
    return null;
  end if;
  perform private.project_for(v.project_id, 'edit');
  return jsonb_build_object('data', v.data, 'name', v.name, 'at', private.ms(v.created_at));
end
$$;

/* ---------- comments ---------- */

/* Comments pinned to a spot on a page of a project, as in Figma: a thread per pin. */

create function public.comments_list(project_id uuid) returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
#variable_conflict use_column
begin
  perform private.project_for(comments_list.project_id, 'view');
  return (
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', c.id, 'view', c.view, 'device', c.device, 'anchor', c.anchor, 'x', c.x, 'y', c.y, 'parentId', c.parent_id,
      'author', c.author_name, 'authorId', c.author_id, 'body', c.body, 'resolved', c.resolved, 'at', private.ms(c.created_at)
    ) order by c.created_at), '[]')
    from public.comments c where c.project_id = comments_list.project_id
  );
end
$$;

/** A new pin, or a reply in a pin's thread. Anyone who can view a project can comment on it. */
create function public.comments_create(project_id uuid, view text, x double precision, y double precision, body text, device text default null, anchor text default null, parent_id uuid default null) returns uuid
language plpgsql security definer set search_path = ''
as $$
#variable_conflict use_column
declare
  said text := left(trim(comments_create.body), 4000);
  made uuid;
begin
  perform private.project_for(comments_create.project_id, 'view');
  if auth.uid() is null then
    raise exception 'Sign in to comment.';
  end if;
  if said = '' then
    raise exception 'Write something first.';
  end if;
  if comments_create.parent_id is not null and not exists (select 1 from public.comments c where c.id = comments_create.parent_id and c.project_id = comments_create.project_id) then
    raise exception 'That thread isn''t there any more.';
  end if;
  insert into public.comments (project_id, view, device, anchor, x, y, parent_id, author_id, author_name, body)
  values (comments_create.project_id, comments_create.view, comments_create.device, comments_create.anchor, comments_create.x, comments_create.y, comments_create.parent_id, auth.uid(), private.my_name(), said)
  returning id into made;
  return made;
end
$$;

create function public.comments_resolve(id uuid, resolved boolean) returns void
language plpgsql security definer set search_path = ''
as $$
#variable_conflict use_column
declare
  c public.comments;
begin
  select * into c from public.comments where id = comments_resolve.id;
  if not found then
    return;
  end if;
  perform private.project_for(c.project_id, 'view');
  update public.comments set resolved = comments_resolve.resolved where id = c.id;
end
$$;

/** Deletes a comment (its author, or the project's owner); a pin goes with its whole thread. */
create function public.comments_remove(id uuid) returns void
language plpgsql security definer set search_path = ''
as $$
#variable_conflict use_column
declare
  c public.comments;
  p public.projects;
begin
  select * into c from public.comments where id = comments_remove.id;
  if not found then
    return;
  end if;
  p := private.project_for(c.project_id, 'view');
  if auth.uid() is null or (c.author_id is distinct from auth.uid() and private.access_to(p) is distinct from 'owner') then
    raise exception 'Only its author or the project''s owner can delete a comment.';
  end if;
  delete from public.comments where id = c.id;
end
$$;

/* ---------- saved sections ---------- */

/* Sections saved to your Library, to drop into any page of their template. */

create function public.saved_list() returns jsonb
language sql stable security definer set search_path = ''
as $$
  select case when auth.uid() is null then null else (
    select coalesce(jsonb_agg(jsonb_build_object('id', x.id, 'template', x.template, 'sectionId', x.section_id, 'at', private.ms(x.created_at)) order by x.created_at desc), '[]')
    from (select * from public.saved s where s.user_id = auth.uid() order by s.created_at desc limit 100) x
  ) end
$$;

create function public.saved_add(template text, section_id text) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.saved (user_id, template, section_id) values (private.must_be_me(), saved_add.template, saved_add.section_id) on conflict do nothing;
end
$$;

create function public.saved_remove(id uuid) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  delete from public.saved s where s.id = saved_remove.id and s.user_id = private.must_be_me();
end
$$;

/* ---------- welcome ---------- */

/** True the first time a signed-in person asks, and never again: their welcome email goes once. */
create function public.claim_welcome() returns boolean
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.welcomed (user_id) values (private.must_be_me()) on conflict do nothing;
  return found;
end
$$;

/* ---------- live channels ---------- */

/*
 * Each change to a project is announced on its channel, with the little each Studio needs to know
 * it's there: a project's save says its new rev and which Studio made it, so that Studio knows
 * its own; the rest just name what changed. Studios then fetch it through the functions above.
 */
create function private.announce() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  changed record;
  pid uuid;
  said jsonb := '{}';
begin
  if tg_op = 'DELETE' then
    changed := old;
  else
    changed := new;
  end if;
  if tg_table_name = 'projects' then
    pid := changed.id;
    said := case when tg_op = 'DELETE' then jsonb_build_object('deleted', true) else jsonb_build_object('rev', changed.rev, 'client', changed.updated_client) end;
  else
    pid := changed.project_id;
  end if;
  perform realtime.send(said, tg_argv[0], 'project:' || pid, true);
  return null;
end
$$;

create trigger announce after update or delete on public.projects for each row execute function private.announce('project');
create trigger announce after insert or update or delete on public.project_members for each row execute function private.announce('access');
create trigger announce after insert or update or delete on public.versions for each row execute function private.announce('versions');
create trigger announce after insert or update or delete on public.comments for each row execute function private.announce('comments');

-- Anyone who may view a project may listen on its channel; signed in, they may send on it too.
create policy "project channels: listen" on realtime.messages for select to anon, authenticated
  using (private.channel_access((select realtime.topic())));
create policy "project channels: send" on realtime.messages for insert to authenticated
  with check (private.channel_access((select realtime.topic())));

/* ---------- images ---------- */

/*
 * Images put in place of a template's own (see src/site/images.ts): kept in the public "images"
 * bucket, each signed-in person in a folder of their own id. Pictures only, and no bigger than a
 * photo needs to be: Storage itself turns away anything else.
 */
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('images', 'images', true, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "images: put in your own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'images' and (storage.foldername(name))[1] = (select auth.uid()::text));

/* ---------- who may call what ---------- */

revoke all on all tables in schema public from anon, authenticated;
revoke execute on all functions in schema public from public, anon, authenticated;
revoke execute on all functions in schema private from public;

grant usage on schema private to anon, authenticated;
grant execute on function private.channel_access(text) to anon, authenticated;

-- Each of these says for itself who may do what, signed in or not.
grant execute on function
  public.purchases_mine(),
  public.teams_mine(boolean),
  public.teams_create(text, boolean),
  public.teams_rename(text),
  public.teams_invite(text),
  public.teams_resend(uuid),
  public.teams_remove(uuid),
  public.teams_leave(),
  public.teams_invitation(text),
  public.teams_accept(text),
  public.projects_list(),
  public.projects_get(text),
  public.projects_create(jsonb, text),
  public.projects_save(uuid, jsonb, integer, text),
  public.projects_remove(uuid),
  public.projects_people(uuid),
  public.projects_invite(uuid, text, text),
  public.projects_set_role(uuid, text),
  public.projects_unshare(uuid),
  public.projects_set_link(uuid, text),
  public.projects_set_team(uuid, boolean),
  public.versions_list(uuid),
  public.versions_save(uuid, text),
  public.versions_get(uuid),
  public.comments_list(uuid),
  public.comments_create(uuid, text, double precision, double precision, text, text, text, uuid),
  public.comments_resolve(uuid, boolean),
  public.comments_remove(uuid),
  public.saved_list(),
  public.saved_add(text, text),
  public.saved_remove(uuid),
  public.claim_welcome()
to anon, authenticated;

-- Whop's webhook, through the site's server with the secret key: no one else.
grant execute on function
  public.record_purchase(text, text, text, text, text, text, text, numeric, text),
  public.end_purchase(text, text, text, text)
to service_role;
