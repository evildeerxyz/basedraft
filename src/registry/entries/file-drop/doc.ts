import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { FileDrop } from "@basedraft/ui";

// XMLHttpRequest reports how much has gone up; fetch doesn't yet.
const send = (
  file: File,
  report: (progress: number) => void,
  signal: AbortSignal,
) =>
  new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/uploads");
    xhr.upload.onprogress = (e) =>
      e.lengthComputable && report(e.loaded / e.total);
    xhr.onload = () =>
      xhr.status < 300
        ? resolve()
        : reject(new Error("The server turned it away."));
    xhr.onerror = () => reject(new Error("The connection dropped."));
    signal.addEventListener("abort", () => xhr.abort());
    const body = new FormData();
    body.append("file", file);
    xhr.send(body);
  });

export function SiteImages() {
  return (
    <FileDrop
      label="Images for your site"
      accept="image/*,.svg"
      maxSize={5 * 1024 * 1024}
      maxFiles={4}
      upload={send}
    />
  );
}`,
  use: [
    "For adding files people already have on their computer: images for a site, a logo, a CSV to import.",
    "When the files go up straight away and people should see each one arrive, fail, or be turned away.",
    "With multiple={false} for one file, like a favicon or an avatar, where a drop replaces what was there.",
  ],
  avoid: [
    "For choosing from images already uploaded: show them in a grid and let people pick.",
    "For a link to a file: use Input with type url.",
    "Inside a narrow row or a toolbar: the zone wants room. Use a Button that opens the file picker instead.",
  ],
  props: [
    { name: "accept", type: "string", note: 'What it takes, as a file input\'s accept: "image/*,.svg". Other files are listed as refused, with why.' },
    { name: "maxSize", type: "number", note: "The largest file it takes, in bytes. Larger ones are refused with their size and the limit." },
    { name: "maxFiles", type: "number", note: "The most files it holds. Past it, the extra ones are refused." },
    { name: "multiple", type: "boolean", default: "true", note: "Several files, or one: with one, a new drop takes the place of the last." },
    { name: "upload", type: "(file: File, report: (progress: number) => void, signal: AbortSignal) => Promise<void>", note: "Sends one file. Call report with 0 to 1 as it goes and throw to fail it; the error's message is shown. The signal aborts when the file is removed. Without upload, files are only listed." },
    { name: "onFilesChange", type: "(files: DropFile[]) => void", note: "Called with every file and its state each time anything changes. A DropFile has id, file, status (uploading, done, error or refused), progress from 0 to 1, and error." },
    { name: "defaultFiles", type: "File[]", note: "Files it starts with, checked and sent as if they'd been dropped. They go in once, the first time there are some." },
    { name: "title", type: "ReactNode", default: '"Drop files here"', note: "The zone's line. While files are dragged over the page it says Drop it here, and over the zone, how many will go in." },
    { name: "hint", type: "ReactNode", default: '"or choose files"', note: "The quieter line under it: what it takes, and how large." },
    { name: "disabled", type: "boolean", default: "false", note: "Faded; it won't open or take drops." },
    { name: "label", type: "string", note: "Names the zone for screen readers." },
    { name: "name", type: "string", note: "With a name, the hidden file input carries what was chosen with the picker in a form. Dropped files can't be added to it, so send them with upload." },
    { name: "id", type: "string", note: "Goes on the zone, so a <label htmlFor> can point at it." },
    { name: "className", type: "string", note: "Goes on the wrapper. It's full width until you say otherwise." },
  ],
  examples: [
    {
      id: "images",
      title: "Images, with limits",
      note: "Drag a file anywhere over the page and the zone wakes; over it, it lifts to meet the file.",
      code: `<FileDrop
  label="Images for your site"
  accept="image/*,.svg"
  maxSize={5 * 1024 * 1024}
  maxFiles={4}
  hint="PNG, JPG or SVG, up to 5 MB"
  upload={send}
  className="max-w-[360px]"
/>`,
    },
    {
      id: "retry",
      title: "A failed upload, tried again",
      note: "files holds storefront.png, which drops partway the first time. The arrow sends it again from the start.",
      code: `<FileDrop
  label="Hero image"
  title="Drop a hero image"
  upload={send}
  defaultFiles={files}
  className="max-w-[360px]"
/>`,
    },
    {
      id: "refused",
      title: "Turned away, and why",
      note: "Without upload, files are only listed. Of the three in files, one is too large and one is the wrong kind, and their rows say so.",
      code: `<FileDrop
  label="Images for your site"
  accept="image/*,.svg"
  maxSize={5 * 1024 * 1024}
  defaultFiles={files}
  className="max-w-[360px]"
/>`,
    },
    {
      id: "single",
      title: "One file",
      note: "A new drop takes the place of the last.",
      code: `<FileDrop
  multiple={false}
  label="Favicon"
  title="Drop a favicon"
  hint="One SVG, square"
  accept=".svg"
  upload={send}
  className="max-w-[300px]"
/>`,
    },
  ],
  keyboard: [
    { keys: "Tab", does: "Reaches the zone, then each file's try again and remove buttons." },
    { keys: "Enter / Space", does: "On the zone, opens the file picker. On a file's buttons, tries it again or removes it." },
  ],
  a11y: [
    "The zone is a button named by label, described by its hint, so it opens the file picker from the keyboard as it does from a press.",
    "Dropping is a pointer shortcut; everything it does can be done with the picker.",
    "Each upload is a progressbar named for its file. The buttons say which file they act on: Try storefront.png again, Remove storefront.png.",
    "A polite status line says what happened: files added and refused, each one uploaded or failed and why, and each one removed.",
    "With reduced motion the zone doesn't lift or scale, and rows appear and go without changing height.",
  ],
};
