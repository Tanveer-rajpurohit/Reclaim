import type { Item, State } from "@repo/domain";
import type { Identity } from "./auth.ts";
import { digest } from "./auth.ts";
import { prisma, query, transaction, type DB } from "./db.ts";
import { AppError, notFound, rule } from "./errors.ts";
import { profileSchema, parse } from "./validation.ts";

interface ItemRow {
  id: string;
  event_id: string;
  name: string;
  description: string;
  category: Item["category"];
  purpose: Item["purpose"];
  quantity: string;
  unit: Item["unit"];
  condition: Item["condition"];
  price: string;
  hazards: string;
  art: Item["art"];
  state: Item["state"];
  created_at: Date;
  revision: number;
  photos: string[];
}
const itemSelect = `SELECT i.*,coalesce((SELECT array_agg('/api/photos/'||p.upload_id::text ORDER BY p.position)
  FROM item_photos p WHERE p.item_id=i.id),'{}') AS photos FROM items i JOIN events e ON e.id=i.event_id`;
function itemView(row: ItemRow): Item {
  return {
    id: row.id,
    eventId: row.event_id,
    name: row.name,
    description: row.description,
    category: row.category,
    purpose: row.purpose,
    quantity: Number(row.quantity),
    unit: row.unit,
    condition: row.condition,
    price: Number(row.price),
    hazards: row.hazards,
    art: row.art,
    state: row.state,
    createdAt: row.created_at.getTime(),
    image: row.photos[0] || "",
    images: row.photos.slice(1),
    revision: row.revision,
  };
}
interface EventRow {
  id: string;
  owner_id: string;
  name: string;
  area: string;
  event_date: string;
  pickup_note: string;
  delivery_note: string;
}
const eventSelect =
  "SELECT id,owner_id,name,area,event_date::text,pickup_note,delivery_note FROM events";
function eventView(row: EventRow) {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    area: row.area,
    eventAt: Date.parse(`${row.event_date}T00:00:00+05:30`),
    pickupNote: row.pickup_note,
    deliveryNote: row.delivery_note,
  };
}
interface DealRow {
  id: string;
  item_id: string;
  buyer_id: string;
  status: State["deals"][number]["status"];
  pickup_at: Date;
  note: string;
  reason: string;
  buyer_confirmed: boolean;
  seller_confirmed: boolean;
  created_at: Date;
  updated_at: Date;
  accepted_at: Date | null;
  completed_at: Date | null;
  revision: number;
}
function dealView(row: DealRow) {
  return {
    id: row.id,
    itemId: row.item_id,
    buyerId: row.buyer_id,
    status: row.status,
    pickupAt: row.pickup_at.getTime(),
    note: row.note,
    reason: row.reason,
    buyerConfirmed: row.buyer_confirmed,
    sellerConfirmed: row.seller_confirmed,
    createdAt: row.created_at.getTime(),
    updatedAt: row.updated_at.getTime(),
    acceptedAt: row.accepted_at?.getTime(),
    completedAt: row.completed_at?.getTime(),
    revision: row.revision,
  };
}
const profileSelect = `SELECT u.id,u.name,u.area,u.buyer_type,u.interests,
  (SELECT count(*)::int FROM deals d WHERE d.buyer_id=u.id AND d.status='Done') collected_count,
  (SELECT count(*)::int FROM deals d JOIN items i ON i.id=d.item_id JOIN events e ON e.id=i.event_id WHERE e.owner_id=u.id AND d.status='Done') offered_count FROM users u`;
interface ProfileRow {
  id: string;
  name: string;
  area: string;
  buyer_type: "none" | "reuse" | "bulk";
  interests: State["people"][number]["interests"];
  collected_count: number;
  offered_count: number;
}
function profileView(p: ProfileRow) {
  return {
    id: p.id,
    name: p.name,
    phone: "",
    area: p.area,
    buyerType: p.buyer_type,
    interests: p.interests,
    collectedCount: p.collected_count,
    offeredCount: p.offered_count,
  };
}
export async function board(actor: Identity | null) {
  // A repeatable-read snapshot avoids mixing pre/post-transition state across these reads.
  return transaction(async (db) => {
    await db.$executeRaw`SET TRANSACTION READ ONLY`;
    const userId = actor?.id || null;
    const items = await query<ItemRow>(
      db,
      `${itemSelect} WHERE i.state IN ('Available','Reserved') OR e.owner_id=$1
      OR EXISTS(SELECT 1 FROM deals d WHERE d.item_id=i.id AND d.buyer_id=$1) ORDER BY i.created_at DESC`,
      [userId],
    );
    const itemIds = items.rows.map((r) => r.id);
    const events = await query<EventRow>(
      db,
      `${eventSelect} WHERE id IN (SELECT event_id FROM items WHERE id=ANY($1::uuid[]))`,
      [itemIds],
    );
    const people = await query<ProfileRow>(
      db,
      `${profileSelect} WHERE u.id=$1 OR u.id IN (SELECT owner_id FROM events WHERE id=ANY($2::uuid[]))
      OR u.id IN (SELECT d.buyer_id FROM deals d JOIN items i ON i.id=d.item_id JOIN events e ON e.id=i.event_id WHERE e.owner_id=$1)`,
      [userId, events.rows.map((e) => e.id)],
    );
    const own = userId
      ? await query(
          db,
          "SELECT phone,email,verified_at FROM users WHERE id=$1",
          [userId],
        )
      : null;
    const deals = userId
      ? await query<DealRow>(
          db,
          `SELECT d.* FROM deals d JOIN items i ON i.id=d.item_id JOIN events e ON e.id=i.event_id
      WHERE d.buyer_id=$1 OR e.owner_id=$1 ORDER BY d.created_at DESC`,
          [userId],
        )
      : { rows: [] };
    const contacts = userId
      ? await query(
          db,
          `SELECT d.id,u.name,u.phone FROM deals d JOIN items i ON i.id=d.item_id JOIN events e ON e.id=i.event_id
      JOIN users u ON u.id=CASE WHEN d.buyer_id=$1 THEN e.owner_id ELSE d.buyer_id END
      WHERE (d.buyer_id=$1 OR e.owner_id=$1) AND (d.status='Accepted' OR (d.status='Done' AND d.completed_at>now()-interval '30 days'))`,
          [userId],
        )
      : { rows: [] };
    const notices = userId
      ? await query(
          db,
          "SELECT * FROM notifications WHERE recipient_id=$1 ORDER BY created_at DESC",
          [userId],
        )
      : { rows: [] };
    const saved = userId
      ? await query(db, "SELECT item_id FROM saved_items WHERE user_id=$1", [
          userId,
        ])
      : { rows: [] };
    return {
      currentUserId: userId,
      email: own?.rows[0]?.email || null,
      verified: Boolean(own?.rows[0]?.verified_at),
      contacts: Object.fromEntries(
        contacts.rows.map((c) => [c.id, { name: c.name, phone: c.phone }]),
      ),
      state: {
        version: 1 as const,
        people: people.rows.map((p) => ({
          ...profileView(p),
          phone: p.id === userId ? own?.rows[0]?.phone || "" : "",
        })),
        items: items.rows.map(itemView),
        events: events.rows.map(eventView),
        deals: deals.rows.map(dealView),
        notices: notices.rows.map((n) => ({
          id: n.id,
          personId: n.recipient_id,
          title: n.title,
          detail: n.detail,
          href: n.href,
          read: Boolean(n.read_at),
          at: n.created_at.getTime(),
        })),
        saved: saved.rows.map((r) => r.item_id),
      } satisfies State,
    };
  }, "RepeatableRead");
}
export async function publicProfile(userId: string) {
  const profile = await query<ProfileRow>(
    prisma(),
    `${profileSelect} WHERE u.id=$1`,
    [userId],
  );
  if (!profile.rowCount) notFound("Profile not found.");
  const history = await query(
    prisma(),
    `SELECT d.id,d.completed_at,i.name,i.quantity,i.unit,e.name event_name,e.area,
    CASE WHEN e.owner_id=$1 THEN 'offered' ELSE 'collected' END role
    FROM deals d JOIN items i ON i.id=d.item_id JOIN events e ON e.id=i.event_id
    WHERE d.status='Done' AND (d.buyer_id=$1 OR e.owner_id=$1) ORDER BY d.completed_at DESC`,
    [userId],
  );
  return {
    person: profileView(profile.rows[0]!),
    history: history.rows.map((r) => ({
      id: r.id,
      name: r.name,
      quantity: Number(r.quantity),
      unit: r.unit,
      eventName: r.event_name,
      area: r.area,
      role: r.role,
      completedAt: r.completed_at.getTime(),
    })),
  };
}
export async function listItems(search: URLSearchParams) {
  const limit = Math.min(100, Math.max(1, Number(search.get("limit")) || 24));
  const offset = Math.min(
    100000,
    Math.max(0, Number(search.get("offset")) || 0),
  );
  const result = await query<ItemRow>(
    prisma(),
    `${itemSelect} WHERE i.state='Available'
    AND ($1='' OR i.name ILIKE '%'||$1||'%' OR e.name ILIKE '%'||$1||'%' OR e.area ILIKE '%'||$1||'%')
    AND ($2='' OR i.category=$2) AND ($3='' OR e.area=$3) AND ($4='' OR i.purpose=$4)
    AND ($5='' OR ($5='free' AND i.price=0) OR ($5='paid' AND i.price>0))
    ORDER BY i.created_at DESC,i.id LIMIT $6 OFFSET $7`,
    [
      search.get("q")?.slice(0, 100) || "",
      search.get("category") || "",
      search.get("area") || "",
      search.get("purpose") || "",
      search.get("price") || "",
      Math.floor(limit),
      Math.floor(offset),
    ],
  );
  return { items: result.rows.map(itemView), limit, offset };
}
export async function itemDetail(itemId: string, actor: Identity | null) {
  const result = await query<ItemRow>(
    prisma(),
    `${itemSelect} WHERE i.id=$1 AND (i.state IN ('Available','Reserved') OR e.owner_id=$2
    OR EXISTS(SELECT 1 FROM deals WHERE item_id=i.id AND buyer_id=$2))`,
    [itemId, actor?.id || null],
  );
  const item = result.rows[0];
  if (!item) notFound();
  const event = await query<EventRow>(prisma(), `${eventSelect} WHERE id=$1`, [
    item.event_id,
  ]);
  return { item: itemView(item), event: eventView(event.rows[0]!) };
}

export async function mutate<T>(
  actor: Identity,
  key: string,
  operation: string,
  body: unknown,
  work: (db: DB) => Promise<T>,
): Promise<T> {
  if (!/^[A-Za-z0-9_-]{16,128}$/.test(key))
    throw new AppError(
      400,
      "IDEMPOTENCY_REQUIRED",
      "Supply a unique Idempotency-Key header (16–128 characters).",
    );
  const fingerprint = digest(JSON.stringify({ operation, body }));
  return transaction(async (db) => {
    await db.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`${actor.id}:${key}`},0))`;
    const previous = await db.idempotency.findUnique({
      where: { user_id_key: { user_id: actor.id, key } },
    });
    if (previous) {
      rule(
        previous.fingerprint === fingerprint,
        "That idempotency key was already used for a different operation.",
      );
      return previous.response as T;
    }
    const response = await work(db);
    await db.idempotency.create({
      data: {
        user_id: actor.id,
        key,
        fingerprint,
        response: JSON.parse(JSON.stringify(response)),
      },
    });
    return response;
  });
}
export async function updateProfile(db: DB, actor: Identity, value: unknown) {
  const input = parse(profileSchema, value);
  await db.user.update({
    where: { id: actor.id },
    data: {
      name: input.name,
      area: input.area,
      phone: input.phone,
      buyer_type: input.buyerType,
      interests: input.interests,
    },
  });
  return { userId: actor.id };
}
export async function saveItem(
  db: DB,
  actor: Identity,
  itemId: string,
  save: boolean,
) {
  const found = await db.item.findFirst({
    where: { id: itemId, state: { in: ["Available", "Reserved"] } },
    select: { id: true },
  });
  if (save && !found) notFound();
  if (save)
    await db.savedItem.createMany({
      data: [{ user_id: actor.id, item_id: itemId }],
      skipDuplicates: true,
    });
  else
    await db.savedItem.deleteMany({
      where: { user_id: actor.id, item_id: itemId },
    });
  return { itemId, saved: save };
}
export async function readNotices(db: DB, actor: Identity, noticeId?: string) {
  await db.notification.updateMany({
    where: {
      recipient_id: actor.id,
      ...(noticeId ? { id: noticeId } : {}),
      read_at: null,
    },
    data: { read_at: new Date() },
  });
  return { read: true };
}
