export interface Env {
  DB: D1Database;
}

interface TweetEntry {
  url: string;
  timestamp?: string;
  avatar?: string;
  title?: string;
  text?: string;
  image?: string;
  video?: string;
  platform?: string;
  tag?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);

    if (pathname === "/api/discover" && request.method === "GET") {
      try {
        const { results } = await env.DB.prepare(
          "SELECT * FROM bookmarks ORDER BY id DESC"
        ).all();

        return new Response(JSON.stringify(results), {
          headers: { "Content-Type": "application/json" }
        });
      } catch (err) {
        return new Response(
          JSON.stringify({ error: "Failed to fetch bookmarks." }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    if (pathname === "/api/contribute" && request.method === "POST") {
      try {
        const payload = await request.json();
        const entries: TweetEntry[] = Array.isArray(payload)
          ? payload
          : [payload];

        const insert = env.DB.prepare(
          `INSERT INTO bookmarks 
            (url, timestamp, avatar, title, text, image, video, platform, tag) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        );

        const batch = entries.map((entry) =>
          insert.bind(
            entry.url,
            entry.timestamp || new Date().toISOString(),
            entry.avatar || "",
            entry.title || "",
            entry.text || "",
            entry.image || "",
            entry.video || "",
            entry.platform || "x",
            entry.tag || ""
          )
        );

        for (const q of batch) {
          await q.run();
        }

        return new Response(
          JSON.stringify({ success: true, count: batch.length }),
          { headers: { "Content-Type": "application/json" } }
        );
      } catch (err) {
        return new Response(
          JSON.stringify({ error: "Invalid or malformed request." }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    return new Response("Not Found", { status: 404 });
  }
};
