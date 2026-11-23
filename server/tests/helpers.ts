import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";
import { storage } from "../src/storage/in-memory.js";

// Tests build the app through the same factory as production, minus seeding and
// static serving, so the composition under test is the one that ships.
export async function createTestApp(): Promise<FastifyInstance> {
  storage.reset();
  return buildApp({ logger: false, seed: false });
}

export async function createMeetingType(
  app: FastifyInstance,
  name = "Test Meeting",
  description = "Test description",
  durationMinutes = 30,
) {
  const res = await app.inject({
    method: "POST",
    url: "/api/meeting-types",
    payload: { name, description, durationMinutes },
  });

  return JSON.parse(res.payload);
}

// Every Booking carries a Booking topic (required since #4). Existing tests use
// this helper so the required field lives in one place; tests about the topic
// itself build the body explicitly.
export const TEST_BOOKING_TOPIC = "Обсудить проект";

export function bookingBody(payload: Record<string, unknown>) {
  return { topic: TEST_BOOKING_TOPIC, ...payload };
}
