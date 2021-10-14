import fromNdjson from "from-ndjson";
import fetch from "node-fetch";
import { createWriteStream, readFileSync } from "node:fs";
import ndjson from "ndjson";

interface Item {
  eventId: string;
  notificationId: string;
  glnHash: string;
  start: Date;
  end: Date;
  systemNotificationBody: string;
  appBannerTitle: string;
  appBannerBody: string;
  appBannerLinkLabel: string;
  appBannerLinkUrl: string;
  appBannerRequestCallbackEnabled: string;
}

interface Data {
  items: Item[];
}
async function getExposureEvents() {
  const res = await fetch(
    "https://exposure-events.tracing.covid19.govt.nz/current-exposure-events.json"
  );
  const body = (await res.json()) as Data;
  return body.items;
}

async function main() {
  const initialExposureEvents = fromNdjson(
    readFileSync("exposure-events.ndjson", "utf8")
  );
  const stringifier = ndjson.stringify();
  stringifier.pipe(createWriteStream("all-exposure-events.ndjson"));
  stringifier.pipe(process.stdout);

  const exposureEvents = await getExposureEvents();

  console.log("exposureEvents.length", exposureEvents.length);

  stringifier.end();
}

main();
