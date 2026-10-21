"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { useEffect, useRef } from "react";
import { getSession, SUPABASE_ON, subscribeSession, supabase } from "@/lib/supabase";

/*
 * A project's live channel ("project:<id>"), one per project however many parts of Studio listen.
 * The database announces each change on it (to the project, and to who it's shared with: see the
 * triggers in supabase/migrations), so a draft open in two tabs stays one draft. Anyone who may
 * view the project can listen. "joined" is heard each time the channel connects, or connects
 * again after a drop: whatever was missed meanwhile is fetched then.
 */

export type Heard = (event: string, payload: Record<string, unknown>) => void;
type Room = { id: string; channel: RealtimeChannel; heard: Set<Heard>; closing?: ReturnType<typeof setTimeout> };
const rooms = new Map<string, Room>();

function open(id: string, heard = new Set<Heard>()) {
  const channel = supabase().channel(`project:${id}`, { config: { private: true, broadcast: { self: false } } });
  const room: Room = { id, channel, heard };
  channel.on("broadcast", { event: "*" }, (m) => room.heard.forEach((h) => h(m.event, (m.payload ?? {}) as Record<string, unknown>)));
  channel.subscribe((status) => {
    if (status === "SUBSCRIBED") room.heard.forEach((h) => h("joined", {}));
  });
  rooms.set(id, room);
  return room;
}

export function listen(id: string, heard: Heard) {
  const room = rooms.get(id) ?? open(id);
  clearTimeout(room.closing);
  room.heard.add(heard);
  return () => {
    room.heard.delete(heard);
    if (room.heard.size) return;
    // Left a moment later, so moving between parts of Studio keeps the one connection.
    room.closing = setTimeout(() => {
      if (room.heard.size || rooms.get(id) !== room) return;
      rooms.delete(id);
      void supabase().removeChannel(room.channel);
    }, 2000);
  };
}

/** Hears a project's channel while `id` is set. */
export function useProjectChannel(id: string | null, heard: Heard) {
  const latest = useRef(heard);
  useEffect(() => {
    latest.current = heard;
  });
  useEffect(() => (id && SUPABASE_ON ? listen(id, (event, payload) => latest.current(event, payload)) : undefined), [id]);
}

if (typeof window !== "undefined" && SUPABASE_ON) {
  // Someone else signed in (or out): each channel is joined again as them, so what they may hear and say is theirs.
  let who: string | null | undefined;
  subscribeSession(async () => {
    const id = getSession().user?.id ?? null;
    const changed = who !== undefined && id !== who;
    who = id;
    if (!changed) return;
    for (const room of [...rooms.values()]) {
      rooms.delete(room.id);
      clearTimeout(room.closing);
      await supabase().removeChannel(room.channel);
      if (room.heard.size) open(room.id, room.heard);
    }
  });
}
