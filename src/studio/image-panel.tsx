"use client";

import { ArrowCounterClockwiseIcon, CaretDownIcon, CaretUpIcon, CrosshairSimpleIcon, ImageIcon, SpinnerGapIcon, UploadSimpleIcon } from "@phosphor-icons/react";
import { useRef, useState, type DragEvent } from "react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { openAuth } from "@/site/auth";
import { typeOf, type ImageSwap } from "@/site/images";
import { Tip } from "@/site/keys";
import { btnSm } from "@/site/sheet";
import { toast } from "@/site/toast";
import type { TextLayer } from "./text-layers";
import { Group } from "./ui";

/*
 * An image of the template's, picked in Layers: what it shows now, and a way to put your own in
 * its place. Yours is drawn by the template's own code, the way it draws its file: a portrait
 * printed in a dither comes out dithered, in the template's tones, in light and dark alike.
 */

/** The longest side an image is kept at: sharp at any size the templates draw them. */
const LONGEST = 2000;

/** A picture made ready to stand in for `path`: no bigger than it needs to be, and the same kind of file. */
async function prepared(file: File, path: string): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const k = Math.min(1, LONGEST / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * k);
    canvas.height = Math.round(img.naturalHeight * k);
    const ctx = canvas.getContext("2d")!;
    const type = typeOf(path);
    // A JPEG has no see-through parts: what was see-through goes white, not black.
    if (type === "image/jpeg") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((done) => canvas.toBlob(done, type, 0.9));
    if (!blob) throw new Error("That image couldn't be read.");
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}

const EXT = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } as const;

/**
 * Sends an image to storage, made ready for `path`, and says where it's kept: the "images" bucket,
 * in a folder of the signed-in person's own. Storage itself turns away anything but a JPEG, PNG or
 * WebP under 8 MB (see supabase/migrations).
 */
export function useImageUpload() {
  return async (file: File, path: string): Promise<ImageSwap> => {
    if (!file.type.startsWith("image/")) throw new Error("That isn't an image.");
    const blob = await prepared(file, path);
    const db = supabase();
    const { data } = await db.auth.getSession();
    if (!data.session) throw new Error("Sign in to use your own images.");
    const key = `${data.session.user.id}/${crypto.randomUUID()}.${EXT[blob.type as keyof typeof EXT] ?? "jpg"}`;
    const { error } = await db.storage.from("images").upload(key, blob, { contentType: blob.type, cacheControl: "31536000" });
    if (error) throw new Error(/size|mime|type/i.test(error.message) ? "That image can't be used: a JPEG, PNG or WebP under 8 MB works." : "The image didn't upload. Try it again.");
    return { url: db.storage.from("images").getPublicUrl(key).data.publicUrl, name: file.name.slice(0, 120) };
  };
}

export function ImagePanel({ layer, file, original, swap, signedIn, place, onStep, onReplace, onReset, onShow }: { layer: TextLayer; file: string; original: string; swap?: ImageSwap; signedIn: boolean; place: { at: number; of: number }; onStep: (by: 1 | -1) => void; onReplace: (f: File) => Promise<void>; onReset: () => void; onShow: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const drawn = layer.parts[0]?.tag === "canvas";
  const name = file.split("/").pop()!;
  const pick = () => (signedIn ? input.current?.click() : openAuth("sign-in", { reason: "save" }));
  const take = async (f: File | undefined) => {
    if (!f || busy) return;
    if (!signedIn) return openAuth("sign-in", { reason: "save" });
    setBusy(true);
    try {
      await onReplace(f);
    } catch (e) {
      toast("Couldn't use that image", { tone: "error", detail: e instanceof Error ? e.message.replace(/^.*Uncaught Error: /, "").split("\n")[0] : undefined });
    } finally {
      setBusy(false);
    }
  };
  const drop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    void take(e.dataTransfer.files[0]);
  };
  const step = "grid size-7 place-items-center rounded-[8px] text-muted transition-colors hover:bg-fg/[0.06] hover:text-fg disabled:pointer-events-none disabled:opacity-30";
  return (
    <>
      <div className="flex items-center gap-3 border-b border-line py-3.5 pl-4 pr-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-[#0d99ff]/10 text-[#0d99ff]">
          <ImageIcon size={18} weight="bold" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-semibold">Image</span>
          <span className="mt-0.5 block truncate text-[12px] text-muted">{layer.name}</span>
        </span>
        <span className="flex shrink-0 items-center">
          <Tip label="Previous layer" keys="Shift Tab">
            <button type="button" aria-label="Previous layer" disabled={place.at <= 1} onClick={() => onStep(-1)} className={step}>
              <CaretUpIcon size={13} weight="bold" />
            </button>
          </Tip>
          <span className="min-w-[38px] text-center text-[12px] tabular-nums text-subtle">
            {place.at} of {place.of}
          </span>
          <Tip label="Next layer" keys="Tab">
            <button type="button" aria-label="Next layer" disabled={place.at >= place.of} onClick={() => onStep(1)} className={step}>
              <CaretDownIcon size={13} weight="bold" />
            </button>
          </Tip>
        </span>
      </div>
      <Group
        title="Image"
        icon={ImageIcon}
        aside={
          swap && (
            <button type="button" onClick={onReset} title="Back to the template's image" className="flex h-7 items-center gap-1 rounded-[8px] px-2 text-[12px] font-medium text-muted hover:bg-fg/[0.06] hover:text-fg">
              <ArrowCounterClockwiseIcon size={12} /> Reset
            </button>
          )
        }
      >
        <button
          type="button"
          onClick={pick}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={drop}
          aria-label={signedIn ? "Replace the image: choose a file, or drop one here" : "Sign in to use your own image"}
          className={cn("group relative block aspect-[4/3] w-full overflow-hidden rounded-[10px] bg-fg/[0.04] outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-fg/15", over && "ring-2 ring-[#0d99ff]")}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- a preview of a stored image, any size */}
          <img src={swap?.url ?? original} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <span className={cn("absolute inset-0 grid place-items-center bg-black/45 text-[13px] font-medium text-white transition-opacity", busy || over ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100")}>
            <span className="flex items-center gap-1.5">
              {busy ? <SpinnerGapIcon size={15} className="animate-spin" /> : <UploadSimpleIcon size={15} weight="bold" />}
              {busy ? "Uploading" : over ? "Drop to use it" : "Replace"}
            </span>
          </span>
        </button>
        <input
          ref={input}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            void take(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <p className="truncate text-[12px] text-muted">{swap?.name ?? name}</p>
        <button type="button" onClick={pick} disabled={busy} className={cn(btnSm.ink, "w-full")}>
          <UploadSimpleIcon size={14} weight="bold" /> {signedIn ? (swap ? "Use another image" : "Replace image") : "Sign in to use your own"}
        </button>
        <p className="text-[12px] leading-snug text-muted">
          {drawn ? "Drawn the template's way: your photo is printed in its dither, in its own tones, in light and dark." : "Shown the way the template shows this file."} Every place that uses {name} takes it, and it goes in your download as that file.
        </p>
        <button type="button" onClick={onShow} className={cn(btnSm.quiet, "w-full")}>
          <CrosshairSimpleIcon size={14} /> Show on the canvas
        </button>
      </Group>
    </>
  );
}
