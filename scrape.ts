import fromNdjson from "from-ndjson";
import fetch from "node-fetch";
import { createWriteStream, readFileSync } from "node:fs";
import ndjson from "ndjson";
import simpleGit from "simple-git";

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
  const existingItems: Item[] = fromNdjson(
    readFileSync("all-exposure-events.ndjson", "utf8")
  );
  const existingNotificationIds = [
    ...new Set(existingItems.map((item) => item.notificationId)),
  ];

  const stringifier = ndjson.stringify();
  stringifier.pipe(createWriteStream("all-exposure-events.ndjson"));
  stringifier.pipe(process.stdout);

  const items = await getExposureEvents();

  await Promise.all(
    existingItems.map((item) => {
      return new Promise((resolve) => stringifier.write(item, "utf8", resolve));
    })
  );
  await Promise.all(
    items.map((item) => {
      if (!existingNotificationIds.includes(item.notificationId)) {
        return new Promise((resolve) =>
          stringifier.write(item, "utf8", resolve)
        );
      }
    })
  );

  stringifier.end();
  simpleGit()
    .add("./*")
    .commit(
      `update data from ${new Date().toLocaleString("en-nz", {
        timeZone: "Pacific/Auckland",
      })}`
    )
    .push(["-u", "origin", "main"], () => console.log("pushed"));
}

main();
