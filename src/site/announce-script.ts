/*
 * Shared by the server layout and the announcement, so it lives outside the client module.
 * Once you close an announcement it stays closed in this browser; the script in <head> marks the
 * page before first paint, so a closed one never flashes in and out. A new announcement takes a
 * new key, and shows again.
 */
export const ANNOUNCE_KEY = "bd-announce-ui-library";

export const ANNOUNCE_SCRIPT = `(function(){try{if(localStorage.getItem("${ANNOUNCE_KEY}"))document.documentElement.dataset.announce="off"}catch(e){}})()`;
