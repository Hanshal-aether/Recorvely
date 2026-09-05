import "dotenv/config"; 
import http from "http"; 
 
/** 
 * Render's free tier only sleeps/charges for services it can classify 
 * as web services vs paid background workers - and it decides that by 
 * whether something is listening on $PORT. Importing these two modules 
 * starts the actual BullMQ worker and the retry scheduler as side 
 * effects (both already self-start when loaded, see the bottom of 
 * worker.ts and runScheduledRetries.ts). The HTTP server below exists 
 * purely so Render sees a web service and treats this as free-tier 
 * eligible - it does no real work itself beyond a healthcheck response. 
 * 
 * Keeping this alive 24/7 on a free tier also requires an external 
 * pinger (e.g. UptimeRobot, cron-job.org - both free) hitting this 
 * URL every 5-10 minutes, since Render's free web services still sleep 
 * after 15 minutes with zero HTTP traffic. 
 */ 
import "./src/workers/worker"; 
import "./scripts/runScheduledRetries"; 
 
const PORT = process.env.PORT || 3001; 
 
http 
  .createServer((req, res) => { 
    res.writeHead(200, { "Content-Type": "text/plain" }); 
    res.end("Recoverly worker + scheduler are running.\n"); 
  }) 
  .listen(PORT, () => { 
    console.log(`[combined] healthcheck server listening on port ${PORT}`); 
  });    