/*
 * Shared by the server layout and the switch, so it lives outside the client module: a string
 * exported from a "use client" file would reach the layout as a reference, not as text.
 */
export const COLOR_MODE_KEY = "bd-theme";

/** Runs in <head> before first paint, so a dark page never flashes white on load. */
export const COLOR_MODE_SCRIPT = `(function(){try{var t=localStorage.getItem("${COLOR_MODE_KEY}");if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";var d=document.documentElement;d.dataset.theme=t;d.style.colorScheme=t}catch(e){}})()`;
