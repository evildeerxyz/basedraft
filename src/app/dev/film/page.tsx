import { notFound } from "next/navigation";
import { Film } from "./film";

/*
 * The basedraft UI film: the real components in scenes, cut together on a beat, for a video to
 * share. scripts in /tmp record it frame by frame and drive it with real input. Development only.
 */
export default function FilmPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <Film />;
}
