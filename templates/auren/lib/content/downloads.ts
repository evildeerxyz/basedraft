// Artifact links point at this page's platform sections until real build URLs exist.
// Replace `href` with the CDN URL of each signed artifact when publishing.
export const PLATFORMS = [
  {
    id: "macos",
    name: "macOS",
    requirement: "macOS 13 Ventura or later",
    command: "brew install --cask auren",
    artifacts: [
      { label: "Universal", file: "Auren-2.0.3-universal.dmg", size: "118 MB", href: "/download#macos", primary: true },
      { label: "Apple silicon", file: "Auren-2.0.3-arm64.dmg", size: "64 MB", href: "/download#macos" },
      { label: "Intel", file: "Auren-2.0.3-x64.dmg", size: "68 MB", href: "/download#macos" },
    ],
  },
  {
    id: "linux",
    name: "Linux",
    requirement: "glibc 2.31+, Vulkan 1.2",
    command: "curl -fsSL https://auren.dev/install.sh | sh",
    artifacts: [
      { label: ".deb", file: "auren_2.0.3_amd64.deb", size: "71 MB", href: "/download#linux", primary: true },
      { label: ".rpm", file: "auren-2.0.3.x86_64.rpm", size: "71 MB", href: "/download#linux" },
      { label: "AppImage", file: "Auren-2.0.3.AppImage", size: "84 MB", href: "/download#linux" },
    ],
  },
  {
    id: "windows",
    name: "Windows",
    requirement: "Windows 11, DirectX 12",
    command: "winget install Auren.Auren",
    artifacts: [
      { label: "x64 installer", file: "AurenSetup-2.0.3-x64.exe", size: "77 MB", href: "/download#windows", primary: true },
      { label: "arm64 installer", file: "AurenSetup-2.0.3-arm64.exe", size: "74 MB", href: "/download#windows" },
      { label: "MSI for IT", file: "Auren-2.0.3-x64.msi", size: "79 MB", href: "/download#windows" },
    ],
  },
] as const;

export type PlatformId = (typeof PLATFORMS)[number]["id"];
