import type { FastifyInstance } from "fastify";
import { storage } from "../storage/in-memory.js";
import { createBooking } from "../services/booking.js";
import { ApiError } from "../types.js";
import type { BookingCreate } from "../types.js";

export async function bookingsRoutes(app: FastifyInstance): Promise<void> {
  // GET /api/bookings - list Upcoming bookings (startTime >= now)
  app.get("/bookings", async () => {
    return storage.listUpcomingBookings(new Date());
  });

  // POST /api/bookings - create a booking
  app.post("/bookings", async (request, reply) => {
    const body = request.body as Partial<BookingCreate>;

    // The Booking topic is a snapshot: trim the edges, keep inner spaces and
    // line breaks, and never HTML-escape. A missing, non-string, empty or
    // whitespace-only topic counts as a missing required field.
    const topic = typeof body?.topic === "string" ? body.topic.trim() : "";

    if (!body?.meetingTypeId || !body?.guestName || !body?.guestEmail || !topic || !body?.startTime) {
      throw new ApiError(400, "Укажите тип встречи, имя, email, тему разговора и время начала");
    }

    const startTime = new Date(body.startTime);
    if (isNaN(startTime.getTime())) {
      throw new ApiError(400, "Время начала должно быть датой в формате ISO 8601");
    }

    const data: BookingCreate = {
      meetingTypeId: body.meetingTypeId,
      guestName: body.guestName,
      guestEmail: body.guestEmail,
      topic,
      startTime: startTime.toISOString(),
    };

    const booking = await createBooking(data);

    return reply.code(201).send(booking);
  });
}