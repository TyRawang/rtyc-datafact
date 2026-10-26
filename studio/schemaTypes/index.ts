import { claimReview } from "./claimReview";
import { dataset } from "./dataset";
import { citation } from "./objects/citation";
import { correction } from "./objects/correction";
import { statementCapture } from "./objects/statementCapture";
import { page } from "./page";
import { source } from "./source";
import { topic } from "./topic";

export const schemaTypes = [
  claimReview,
  source,
  dataset,
  topic,
  page,
  citation,
  correction,
  statementCapture,
];
