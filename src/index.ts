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

const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // Optionally replace with specific domain
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // GET /discover
    if (pathname === "/discover" && request.method === "GET") {
      try {
        const { results } = await env.DB
          .prepare("SELECT * FROM bookmarks ORDER BY id DESC")
          .all();

        // If no results, return a default row with empty fields to show column headers
        if (results.length === 0) {
          const emptyRow: TweetEntry = {
            url: "",
            timestamp: "",
            avatar: "",
            title: "",
            text: "",
            image: "",
            video: "",
            platform: "",
            tag: ""
          };
          return new Response(JSON.stringify([emptyRow]), {
            status: 200,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json"
            }
          });
        }

        return new Response(JSON.stringify(results), {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        });
      } catch (err) {
        return new Response(
          JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
    }

    // GET /discoverfull
if (pathname === "/discoverfull" && request.method === "GET") {
  try {
    const { results } = await env.DB
      .prepare("SELECT * FROM bookmarks ORDER BY id DESC")
      .all();

    // Construct HTML content from results
    const html = results.map(entry => `
      <div class='tile'>
        <img src='${entry.avatar || ''}' alt='Profile Picture' class='profile-pic'>
        <div class='profile-info'>
          <span class='name'>${entry.title || ''}</span>
          <br><a href='${entry.url || '#'}' target='_blank' class='handle'>@${entry.title || ''}</a>
        </div>
        <div class='tweet-text'>${entry.text || ''}</div>
        <br>
        <div class='action-container'>
          <a class='btn btn-primary btn-sm view-tweet-btn' target='_blank' href='${entry.url || '#'}'>View Tweet</a>
        </div>
      </div>
    `).join("");

    const payload = {
      NumberOfTweets: `${results.length.toLocaleString()} Tweets`,
      NumberOfUploads: `${(results.length * 1.5).toLocaleString()} Uploads`, // or fetch actual uploads if tracked separately
      HTMLContent: `<div class='tilesContainer'>${html}</div>`
    };

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
}


    // POST /contribute
    if (pathname === "/contribute" && request.method === "POST") {
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
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      } catch (err) {
        return new Response(
          JSON.stringify({ error: "Invalid or malformed request." }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
    }

    // Fallback for unknown routes
    return new Response("Not Found", { status: 404, headers: corsHeaders });
  }
};
