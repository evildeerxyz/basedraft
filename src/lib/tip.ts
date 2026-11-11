/*
 * Buying basedraft's maker a Claude plan: the amounts to offer, shared by the dialog and the
 * server so they agree. The presets are what Claude's plans cost a month; any amount in range works.
 */
export const TIP = {
  min: 1,
  max: 2000,
  presets: [
    { amount: 20, label: "Pro" },
    { amount: 100, label: "Max 5x" },
    { amount: 200, label: "Max 20x" },
  ],
  initial: 20,
} as const;
