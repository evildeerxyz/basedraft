import { pal } from "@/lib/palette";
/* Demo account data for the in-phone prototype. */

export type AssetClass = "US stocks" | "International" | "Bonds" | "Crypto" | "Cash";

export interface Holding {
  sym: string;
  name: string;
  shares: number;
  price: number;
  chg: number;
  cls: AssetClass;
  avgCost: number;
  logo: { bg: string; fg: string; text: string };
  seed: number;
  about: string;
  stats: Array<[string, string]>;
}

export const HOLDINGS: Holding[] = [
  {
    sym: "VTI",
    name: "Vanguard Total Stock Market ETF",
    shares: 58.4,
    price: 312.48,
    chg: 0.84,
    cls: "US stocks",
    avgCost: 241.12,
    logo: { bg: "#a3162b", fg: "#ffffff", text: "V" },
    seed: 3,
    about: "Tracks the entire US stock market, around 3,600 companies from mega caps to micro caps, in one low-cost fund.",
    stats: [["Expense ratio", "0.03%"], ["Dividend yield", "1.28%"], ["Holdings", "3,612"], ["52-week range", "$248 to $318"]],
  },
  {
    sym: "VXUS",
    name: "Vanguard Total International Stock ETF",
    shares: 96.0,
    price: 68.91,
    chg: 0.42,
    cls: "International",
    avgCost: 57.4,
    logo: { bg: "#a3162b", fg: "#ffffff", text: "V" },
    seed: 21,
    about: "Owns roughly 8,500 companies across developed and emerging markets outside the US.",
    stats: [["Expense ratio", "0.05%"], ["Dividend yield", "2.94%"], ["Holdings", "8,541"], ["52-week range", "$57 to $70"]],
  },
  {
    sym: "BND",
    name: "Vanguard Total Bond Market ETF",
    shares: 72.0,
    price: 73.92,
    chg: -0.08,
    cls: "Bonds",
    avgCost: 72.1,
    logo: { bg: "#a3162b", fg: "#ffffff", text: "V" },
    seed: 33,
    about: "Investment-grade US bonds, from Treasuries to corporate debt. The steady part of your portfolio.",
    stats: [["Expense ratio", "0.03%"], ["SEC yield", "4.31%"], ["Duration", "5.9 yrs"], ["52-week range", "$71 to $75"]],
  },
  {
    sym: "NVDA",
    name: "NVIDIA",
    shares: 24.6,
    price: 182.4,
    chg: 2.31,
    cls: "US stocks",
    avgCost: 96.3,
    logo: { bg: "#76b900", fg: "#0a0a0a", text: "N" },
    seed: 8,
    about: "Designs the GPUs and networking that power most of the world's AI data centres, plus gaming and automotive chips.",
    stats: [["Market cap", "$4.44T"], ["P/E ratio", "51.2"], ["Dividend yield", "0.02%"], ["52-week range", "$86 to $195"]],
  },
  {
    sym: "AAPL",
    name: "Apple",
    shares: 12.2,
    price: 241.18,
    chg: 0.84,
    cls: "US stocks",
    avgCost: 188.5,
    logo: { bg: "#e5e5ea", fg: "#0a0a0a", text: "A" },
    seed: 41,
    about: "Makes the iPhone, Mac and Apple Watch, and runs a fast-growing services business across 2 billion devices.",
    stats: [["Market cap", "$3.58T"], ["P/E ratio", "36.4"], ["Dividend yield", "0.42%"], ["52-week range", "$169 to $260"]],
  },
  {
    sym: "BTC",
    name: "Bitcoin",
    shares: 0.051,
    price: 112480.55,
    chg: -1.12,
    cls: "Crypto",
    avgCost: 61200,
    logo: { bg: "#f7931a", fg: "#ffffff", text: "₿" },
    seed: 15,
    about: "The original cryptocurrency. Held for you by a licensed custodian; not SIPC- or FDIC-protected.",
    stats: [["Market cap", "$2.23T"], ["24h volume", "$41.8B"], ["Supply", "19.9M"], ["52-week range", "$58K to $124K"]],
  },
];

export const RISK_TARGETS: Record<string, Record<AssetClass, number>> = {
  Conservative: { "US stocks": 25, International: 10, Bonds: 50, Crypto: 0, Cash: 15 },
  Balanced: { "US stocks": 40, International: 15, Bonds: 30, Crypto: 3, Cash: 12 },
  Growth: { "US stocks": 55, International: 18, Bonds: 12, Crypto: 5, Cash: 10 },
};

export const CLASS_COLORS: Record<AssetClass, string> = {
  get "US stocks"() {
    return pal.accent;
  },
  International: "#5ee0b0",
  Bonds: "#6cb8ff",
  Crypto: "#bf5af2",
  Cash: "#8e8e93",
};

export const ACTIVITY = [
  { title: "Sold NVDA", detail: "Autopilot · trimmed to 7% cap", amt: -420, when: "Today, 9:32 AM" },
  { title: "Bought VXUS", detail: "Autopilot · rebalance", amt: 420, when: "Today, 9:32 AM" },
  { title: "Dividend", detail: "VTI · reinvested", amt: 32.4, when: "Oct 8" },
  { title: "Bought BND", detail: "Recurring · Monday", amt: 96, when: "Oct 6" },
  { title: "Harvested loss", detail: "ARKK → QQQM · saved $96", amt: 0, when: "Sep 29" },
];

export const CASH_ACTIVITY = [
  { day: "Today", items: [
    { title: "Round-up", detail: "Blue Bottle Coffee", amt: 0.65, icon: "coffee" },
    { title: "Interest", detail: "4.10% APY", amt: 0.54, icon: "percent" },
  ] },
  { day: "Yesterday", items: [
    { title: "Round-up", detail: "Uber", amt: 0.8, icon: "car" },
    { title: "Deposit", detail: "Chase Checking ••4417", amt: 500, icon: "bank" },
    { title: "Round-up", detail: "Sweetgreen", amt: 0.25, icon: "food" },
  ] },
  { day: "Oct 8", items: [
    { title: "Moved to T-bills", detail: "Autopilot · idle cash", amt: -1200, icon: "bank" },
    { title: "Round-up", detail: "Everlane", amt: 0.5, icon: "bag" },
  ] },
];

export const COPILOT_CONVOS = [
  {
    q: "Why did you sell NVDA today?",
    a: "NVIDIA grew to 9.3% of your portfolio, above the 7% single-stock cap in your Growth plan. At 9:32 I sold $420 and bought VXUS to bring international back to target. It was a long-term gain, so the estimated tax is about $18.",
  },
  {
    q: "Am I on track to retire at 55?",
    a: "Yes. At $1,250 a month and a 7% average return you're projected to reach $1.62M by 55, which is 104% of your goal. Adding $100 a month would give you roughly a two-year cushion.",
  },
  {
    q: "How much can I spend this month?",
    a: "About $1,840 after rent, bills and your Monday auto-deposit. Your cash account covers that without selling any investments.",
  },
];
