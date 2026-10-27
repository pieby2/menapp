import {
  DEMO_ADDRESSES,
  DEMO_CATEGORIES,
  DEMO_MY_SERVICES,
  DEMO_PATIENT,
  DEMO_PATIENT_BOOKINGS,
  DEMO_PRO,
  DEMO_PRO_BOOKINGS,
  DEMO_PRO_PROFILE,
  DEMO_PRO_REQUESTS,
  DEMO_SERVICES,
  DEMO_SLOTS,
} from "./mock-data";
import type {
  Address,
  AvailabilitySlot,
  Booking,
  BookingListItem,
  BookingRequest,
  MyService,
  ProBooking,
  ProfessionalProfile,
  Quote,
  TokenPair,
  User,
} from "./types";

// Persistent state for offline/demo sessions
let currentUser: User | null = null;
let currentProProfile: ProfessionalProfile = { ...DEMO_PRO_PROFILE };
let userAddresses: Address[] = [...DEMO_ADDRESSES];
let patientBookings: Booking[] = [...DEMO_PATIENT_BOOKINGS];
let proRequests: BookingRequest[] = [...DEMO_PRO_REQUESTS];
let proBookings: ProBooking[] = [...DEMO_PRO_BOOKINGS];
let proSlots: AvailabilitySlot[] = [...DEMO_SLOTS];
let proServices: MyService[] = [...DEMO_MY_SERVICES];

export function setCurrentUser(user: User | null) {
  currentUser = user;
}

export function getCurrentUser(): User | null {
  return currentUser;
}

export function handleMockRequest<T>(
  path: string,
  method: string = "GET",
  body?: any,
): T | null {
  const cleanPath = path.split("?")[0];

  // 1. Auth: Login
  if (cleanPath === "/auth/login" && method === "POST") {
    const isPro =
      body?.email?.includes("nurse") ||
      body?.email?.includes("pro") ||
      body?.email?.includes("physio");
    const user: User = isPro
      ? { ...DEMO_PRO, email: body?.email ?? DEMO_PRO.email }
      : { ...DEMO_PATIENT, email: body?.email ?? DEMO_PATIENT.email };
    currentUser = user;
    const tokens: TokenPair = {
      access_token: "demo_mock_access_token_" + Date.now(),
      refresh_token: "demo_mock_refresh_token_" + Date.now(),
      expires_in: 3600,
      user,
    };
    return tokens as T;
  }

  // 2. Auth: Register
  if (cleanPath === "/auth/register" && method === "POST") {
    const user: User = {
      id: "usr_" + Math.random().toString(36).slice(2, 9),
      full_name: body?.full_name ?? "Demo User",
      email: body?.email ?? "demo@mendyr.app",
      phone_number: body?.phone_number ?? "+919876543210",
      role: body?.role ?? "patient",
      gender: "unspecified",
      date_of_birth: null,
      avatar_url: null,
      status: "active",
      referral_code: "MND" + Math.floor(Math.random() * 900 + 100),
      created_at: new Date().toISOString(),
    };
    currentUser = user;
    return {
      access_token: "demo_token_" + Date.now(),
      refresh_token: "demo_refresh_" + Date.now(),
      expires_in: 3600,
      user,
    } as T;
  }

  // 3. Auth: Me
  if (cleanPath === "/auth/me" && method === "GET") {
    if (!currentUser) {
      // Auto-fallback to patient demo for convenience
      currentUser = DEMO_PATIENT;
    }
    return currentUser as T;
  }

  // 4. Auth: Logout
  if (cleanPath === "/auth/logout" && method === "POST") {
    currentUser = null;
    return { success: true } as T;
  }

  // 5. User: Me (PATCH)
  if (cleanPath === "/users/me" && method === "PATCH") {
    if (currentUser) {
      currentUser = { ...currentUser, ...body };
      return currentUser as T;
    }
    return { ...DEMO_PATIENT, ...body } as T;
  }

  // 6. Services & Categories
  if (cleanPath === "/services/categories") {
    return DEMO_CATEGORIES as T;
  }
  if (cleanPath === "/services") {
    return DEMO_SERVICES as T;
  }

  // 7. Addresses
  if (cleanPath === "/addresses") {
    if (method === "GET") {
      return userAddresses as T;
    }
    if (method === "POST") {
      const newAddress: Address = {
        id: "addr_" + Date.now(),
        label: body?.label ?? "home",
        line1: body?.line1 ?? "",
        line2: body?.line2 ?? null,
        landmark: body?.landmark ?? null,
        city: body?.city ?? "Bengaluru",
        state: body?.state ?? "Karnataka",
        pincode: body?.pincode ?? "560038",
        is_default: userAddresses.length === 0 || !!body?.is_default,
        contact_name: body?.contact_name ?? null,
        contact_phone: body?.contact_phone ?? null,
        instructions_for_professional: body?.instructions_for_professional ?? null,
        latitude: body?.location?.latitude ?? 12.9716,
        longitude: body?.location?.longitude ?? 77.5946,
      };
      if (newAddress.is_default) {
        userAddresses = userAddresses.map((a) => ({ ...a, is_default: false }));
      }
      userAddresses.push(newAddress);
      return newAddress as T;
    }
  }

  if (cleanPath.startsWith("/addresses/") && method === "PATCH") {
    const id = cleanPath.split("/")[2];
    userAddresses = userAddresses.map((a) =>
      a.id === id ? { ...a, ...body } : body?.is_default ? { ...a, is_default: false } : a,
    );
    const updated = userAddresses.find((a) => a.id === id);
    return updated as T;
  }

  if (cleanPath.startsWith("/addresses/") && method === "DELETE") {
    const id = cleanPath.split("/")[2];
    userAddresses = userAddresses.filter((a) => a.id !== id);
    return { success: true } as T;
  }

  // 8. Quote
  if (cleanPath === "/bookings/quote" && method === "POST") {
    const srv = DEMO_SERVICES.find((s) => s.id === body?.service_id) ?? DEMO_SERVICES[0];
    const discount = 50;
    const taxable = srv.base_price - discount;
    const tax = Math.round(taxable * 0.18);
    const quote: Quote = {
      base_price: srv.base_price,
      discount_amount: discount,
      platform_fee: 0,
      tax_amount: tax,
      total_amount: taxable + tax,
    };
    return quote as T;
  }

  // 9. Nearby professionals
  if (cleanPath === "/professionals/nearby") {
    return [
      {
        ...DEMO_PRO_PROFILE,
        full_name: "Priya Sharma",
        avatar_url: null,
        distance_km: 2.4,
      },
      {
        ...DEMO_PRO_PROFILE,
        id: "prof_arjun",
        full_name: "Dr. Arjun Nair",
        professional_type: "physiotherapist",
        distance_km: 4.1,
      },
    ] as T;
  }

  // 10. Patient Bookings list
  if (cleanPath === "/bookings") {
    if (method === "GET") {
      const items: BookingListItem[] = patientBookings.map((b) => ({
        id: b.id,
        booking_code: b.booking_code,
        status: b.status,
        service_name_snapshot: b.service_name_snapshot,
        scheduled_start_at: b.scheduled_start_at,
        total_amount: b.total_amount,
        professional_name: b.professional?.full_name ?? null,
      }));
      return items as T;
    }
    if (method === "POST") {
      const srv = DEMO_SERVICES.find((s) => s.id === body?.service_id) ?? DEMO_SERVICES[0];
      const addr = userAddresses.find((a) => a.id === body?.address_id) ?? userAddresses[0];
      const code = "MND-" + Math.floor(1000 + Math.random() * 9000);
      const tax = Math.round((srv.base_price - 50) * 0.18);
      const newBooking: Booking = {
        id: "bkg_" + Date.now(),
        booking_code: code,
        status: "searching",
        service_id: srv.id,
        service_name_snapshot: srv.name,
        address_snapshot: `${addr?.line1 ?? ""}, ${addr?.city ?? ""}`,
        scheduled_start_at: body?.scheduled_start_at ?? new Date(Date.now() + 7200000).toISOString(),
        scheduled_end_at: new Date(Date.now() + 10800000).toISOString(),
        base_price: srv.base_price,
        discount_amount: 50,
        tax_amount: tax,
        total_amount: srv.base_price - 50 + tax,
        patient_notes: body?.patient_notes ?? null,
        cancellation_reason: null,
        professional: null,
        visit_summary_notes: null,
        review_rating: null,
        created_at: new Date().toISOString(),
      };
      patientBookings.unshift(newBooking);

      // Automatically add to pro requests as well
      proRequests.unshift({
        id: newBooking.id,
        booking_code: code,
        service_id: srv.id,
        service_name: srv.name,
        scheduled_start_at: newBooking.scheduled_start_at,
        scheduled_end_at: newBooking.scheduled_end_at,
        area: addr?.city ?? "Bengaluru",
        distance_km: 3.5,
        earning_amount: Math.round(srv.base_price * 0.8),
        patient_notes: newBooking.patient_notes,
        created_at: newBooking.created_at,
      });

      return newBooking as T;
    }
  }

  // 11. Patient Booking by ID
  if (cleanPath.startsWith("/bookings/") && !cleanPath.includes("/professional/")) {
    const parts = cleanPath.split("/");
    const id = parts[2];
    const action = parts[3];

    if (action === "cancel" && method === "POST") {
      patientBookings = patientBookings.map((b) =>
        b.id === id ? { ...b, status: "cancelled", cancellation_reason: body?.reason ?? "Cancelled" } : b,
      );
      proBookings = proBookings.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b));
      return patientBookings.find((b) => b.id === id) as T;
    }

    if (method === "GET") {
      const bkg = patientBookings.find((b) => b.id === id) ?? patientBookings[0];
      return bkg as T;
    }
  }

  // 12. Reviews
  if (cleanPath === "/reviews" && method === "POST") {
    patientBookings = patientBookings.map((b) =>
      b.id === body?.booking_id ? { ...b, review_rating: body?.rating } : b,
    );
    return { success: true } as T;
  }

  // 13. Professional: Profile
  if (cleanPath === "/professionals/me") {
    if (method === "GET") {
      return currentProProfile as T;
    }
    if (method === "PATCH") {
      currentProProfile = { ...currentProProfile, ...body };
      return currentProProfile as T;
    }
  }

  // 14. Professional: Onboarding
  if (cleanPath === "/professionals/onboard" && method === "POST") {
    currentProProfile = {
      ...currentProProfile,
      ...body,
      verification_status: "approved",
      is_accepting_bookings: true,
    };
    return currentProProfile as T;
  }

  // 15. Professional: Requests
  if (cleanPath === "/bookings/professional/requests") {
    return proRequests as T;
  }

  // 16. Professional: Accept request
  if (cleanPath.endsWith("/accept") && method === "POST") {
    const id = cleanPath.split("/")[2];
    const req = proRequests.find((r) => r.id === id);
    proRequests = proRequests.filter((r) => r.id !== id);

    const proBooking: ProBooking = {
      id,
      booking_code: req?.booking_code ?? "MND-1234",
      status: "confirmed",
      service_name: req?.service_name ?? "General Nursing Visit",
      scheduled_start_at: req?.scheduled_start_at ?? new Date(Date.now() + 3600000).toISOString(),
      scheduled_end_at: req?.scheduled_end_at ?? new Date(Date.now() + 7200000).toISOString(),
      address: "Flat 402, Sunrise Heights, 12th Main Road, Indiranagar, Bengaluru",
      landmark: "Near Metro Pillar 84",
      instructions: "Ring bell twice; parking inside gate.",
      latitude: 12.9784,
      longitude: 77.6408,
      patient_name: "Asha Patel",
      patient_phone: "+919876543210",
      patient_notes: req?.patient_notes ?? null,
      earning_amount: req?.earning_amount ?? 900,
      started_at: null,
      completed_at: null,
      visit_summary_notes: null,
      created_at: new Date().toISOString(),
    };
    proBookings.unshift(proBooking);

    // Update patient booking to confirmed
    patientBookings = patientBookings.map((b) =>
      b.id === id
        ? {
            ...b,
            status: "confirmed",
            professional: {
              id: currentProProfile.id,
              full_name: currentUser?.full_name ?? "Priya Sharma",
              avatar_url: null,
              professional_type: currentProProfile.professional_type,
              years_of_experience: currentProProfile.years_of_experience,
              average_rating: currentProProfile.average_rating,
              total_ratings: currentProProfile.total_ratings,
              languages_spoken: currentProProfile.languages_spoken,
              phone_number: currentUser?.phone_number ?? "+919812345678",
            },
          }
        : b,
    );

    return { success: true } as T;
  }

  // 17. Professional: My Bookings
  if (cleanPath === "/bookings/professional/mine") {
    return proBookings as T;
  }

  if (cleanPath.startsWith("/bookings/professional/")) {
    const id = cleanPath.split("/")[3];
    const b = proBookings.find((item) => item.id === id) ?? proBookings[0];
    return b as T;
  }

  // 18. Professional: Check in / Check out / Release
  if (cleanPath.endsWith("/check-in") && method === "POST") {
    const id = cleanPath.split("/")[2];
    proBookings = proBookings.map((b) =>
      b.id === id ? { ...b, status: "in_progress", started_at: new Date().toISOString() } : b,
    );
    patientBookings = patientBookings.map((b) =>
      b.id === id ? { ...b, status: "in_progress" } : b,
    );
    return proBookings.find((b) => b.id === id) as T;
  }

  if (cleanPath.endsWith("/check-out") && method === "POST") {
    const id = cleanPath.split("/")[2];
    proBookings = proBookings.map((b) =>
      b.id === id
        ? {
            ...b,
            status: "completed",
            completed_at: new Date().toISOString(),
            visit_summary_notes: body?.visit_summary_notes ?? null,
          }
        : b,
    );
    patientBookings = patientBookings.map((b) =>
      b.id === id
        ? {
            ...b,
            status: "completed",
            visit_summary_notes: body?.visit_summary_notes ?? null,
          }
        : b,
    );
    currentProProfile.total_visits_completed += 1;
    return proBookings.find((b) => b.id === id) as T;
  }

  if (cleanPath.endsWith("/release") && method === "POST") {
    const id = cleanPath.split("/")[2];
    proBookings = proBookings.filter((b) => b.id !== id);
    patientBookings = patientBookings.map((b) =>
      b.id === id ? { ...b, status: "searching", professional: null } : b,
    );
    return { success: true } as T;
  }

  // 19. Schedule slots
  if (cleanPath === "/professionals/me/availability/slots") {
    if (method === "GET") return proSlots as T;
    if (method === "PUT") {
      proSlots = Array.isArray(body) ? body : [];
      return proSlots as T;
    }
  }

  // 20. Professional services
  if (cleanPath === "/professionals/me/services") {
    return proServices as T;
  }
  if (cleanPath.startsWith("/professionals/me/services/") && method === "PUT") {
    const srvId = cleanPath.split("/")[4];
    proServices = proServices.map((s) =>
      s.service_id === srvId ? { ...s, is_opted_in: !!body?.is_opted_in } : s,
    );
    return { success: true } as T;
  }

  // 21. Geo
  if (cleanPath.startsWith("/geo/locate")) {
    return {
      latitude: 12.9716,
      longitude: 77.5946,
      label: "Bengaluru, Karnataka",
      precision: "city",
    } as T;
  }

  if (cleanPath.startsWith("/geo/reverse")) {
    return {
      latitude: 12.9716,
      longitude: 77.5946,
      label: "Indiranagar, Bengaluru",
      area: "Indiranagar",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560038",
    } as T;
  }

  return null;
}
