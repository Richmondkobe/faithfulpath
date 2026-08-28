import { NextResponse } from "next/server";

const GROUP_NAME = "Website subscribers";

// Resolved once per server instance. Looked up by name rather than pinned to an
// id so there is no extra env var to keep in sync across environments.
let cachedGroupId: string | null = null;

async function resolveGroupId(key: string): Promise<string | null> {
  if (cachedGroupId) return cachedGroupId;

  const url = new URL("https://connect.mailerlite.com/api/groups");
  url.searchParams.set("filter[name]", GROUP_NAME);

  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${key}`,
    },
  });

  if (!res.ok) {
    console.error("MailerLite group lookup failed:", res.status, await res.text());
    return null;
  }

  const body: { data?: { id: string; name: string }[] } = await res.json();

  // The filter matches loosely, so confirm the name before using the group.
  const group = body.data?.find(
    (g) => g.name.trim().toLowerCase() === GROUP_NAME.toLowerCase()
  );

  if (!group) {
    console.error(`MailerLite group "${GROUP_NAME}" not found.`);
    return null;
  }

  cachedGroupId = group.id;
  return cachedGroupId;
}

export async function POST(request: Request) {
  try {
    const { email, name } = await request.json();

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Please enter your name." },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const key = process.env.MAILERLITE_API_KEY;
    if (!key) {
      console.error("MAILERLITE_API_KEY is not set");
      return NextResponse.json(
        { error: "Something went wrong. Please try again later." },
        { status: 500 }
      );
    }

    // A failed lookup must not cost us the signup — subscribe anyway and let
    // the logged error be the thing that gets fixed.
    const groupId = await resolveGroupId(key);

    const res = await fetch("https://connect.mailerlite.com/api/subscribers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        fields: { name: name.trim() },
        ...(groupId ? { groups: [groupId] } : {}),
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error("MailerLite error:", res.status, detail);
      return NextResponse.json(
        { error: "We could not add you just now. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Subscribe route error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
