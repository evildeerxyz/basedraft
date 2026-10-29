import { notFound } from "next/navigation";
import { Reel } from "./reel";

/*
 * The basedraft UI reel: every component, one to a frame, for a fast GIF to share. A script in
 * /tmp steps through it and screenshots each frame. Development only.
 */
export default function ReelPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <Reel />;
}
