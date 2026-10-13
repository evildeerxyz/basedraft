import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();
crons.interval("clear stale presence", { minutes: 10 }, internal.presence.sweep, {});
export default crons;
