import { Queue } from "bullmq";
import IORedis from "ioredis";

// A single Redis connection, reused by the queue and (in the worker
// process) by the QueueEvents/Worker classes too.
export const connection = new IORedis(process.env.REDIS_URL as string, {
  maxRetriesPerRequest: null, // required by BullMQ
});

export const FAILURE_QUEUE_NAME = "payment-failures";

// Producer side. The ingestion API only ever pushes a job here and returns -
// it never runs classification/policy/retry logic inline. That's what
// makes this horizontally scalable: processing capacity is just "how many
// worker processes are running", decoupled from how fast failures arrive.
export const failureQueue = new Queue(FAILURE_QUEUE_NAME, { connection });

export type FailureJobData = {
  transactionId: string;
};
