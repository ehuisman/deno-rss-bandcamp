import { serve } from "https://deno.land/std@0.155.0/http/server.ts";
import { DOMParser } from "https://esm.sh/linkedom@0.14.16";
import jsonFeedToRss from "https://esm.sh/jsonfeed-to-rss@3.0.7";

serve(async (req: Request) => {
  const url = new URL(req.url);
  const artist = url.searchParams.get("artist");

  const res = await fetch(`https://${artist}.bandcamp.com/music`);

  if (!artist || !res.ok) {
    return Response.json(
      {
        error:
          "Something is broken here. Did you add an artist search param? For example: https://rss-bandcamp.deno.dev/?artist=plash",
      },
      {
        status: 404,
      }
    );
  }

  const html = await res.text();
  const document = new DOMParser().parseFromString(html, "text/html");
  const items = Array.from(document.querySelectorAll("#music-grid li")).map(
    (item) => {
      const title = item
        .querySelector(".title")
        .textContent.replace(/(\r\n|\n|\r)/gm, "")
        .trim();
      const url = `https://${artist}.bandcamp.com/${
        item.querySelector("a").href
      }`;

      return {
        title,
        url,
        content_html: title,
      };
    }
  );

  return new Response(jsonFeedToRss({
    version: "https://jsonfeed.org/version/1",
    title: `Bandcamp: ${artist}`,
    home_page_url: `https://${artist}.bandcamp.com`,
    feed_url: `https://rss-bandcamp.deno.dev?artist=${artist}`,
    favicon: "https://s4.bcbits.com/img/favicon/apple-touch-icon.png",
    items,
  }));
});
