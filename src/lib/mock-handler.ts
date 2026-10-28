import {
  DEMO_CATEGORIES,
  DEMO_MY_SERVICES,
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

export class MockHttpError extends Error {
  constructor(
    message: string,
    readonly status: number = 400,
    readonly code: string = "bad_request",
  ) {
    super(message);
    this.name = "MockHttpError";
  }
}

// Storage keys for isolated mock data
const STORAGE_CURRENT_USER = "mendyr_mock_current_user";
const STORAGE_USERS = "mendyr_mock_users_db";
const STORAGE_ADDRESSES = "mendyr_mock_addresses_db";
const STORAGE_BOOKINGS = "mendyr_mock_bookings_db";
const STORAGE_PRO_REQUESTS = "mendyr_mock_pro_requests_db";
const STORAGE_PRO_BOOKINGS = "mendyr_mock_pro_bookings_db";

function getLocalItem<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function setLocalItem<T>(key: string, value: T | null) {
  if (typeof window === "undefined") return;
  try {
    if (value === null) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch {}
}

// In-memory fallback
let inMemoryUser: User | null = null;
let currentProProfile: ProfessionalProfile = { ...DEMO_PRO_PROFILE };
let proSlots: AvailabilitySlot[] = [...DEMO_SLOTS];
let proServices: MyService[] = [...DEMO_MY_SERVICES];

export function setCurrentUser(user: User | null) {
  inMemoryUser = user;
  setLocalItem(STORAGE_CURRENT_USER, user);
}

export function getCurrentUser(): User | null {
  if (inMemoryUser) return inMemoryUser;
  const stored = getLocalItem<User | null>(STORAGE_CURRENT_USER, null);
  if (stored) {
    inMemoryUser = stored;
    return inMemoryUser;
  }
  return null;
}

function getUserAddresses(userId?: string): Address[] {
  const uid = userId ?? getCurrentUser()?.id;
  if (!uid) return [];
  const all = getLocalItem<Record<string, Address[]>>(STORAGE_ADDRESSES, {});
  return all[uid] ?? [];
}

function saveUserAddresses(addresses: Address[], userId?: string) {
  const uid = userId ?? getCurrentUser()?.id;
  if (!uid) return;
  const all = getLocalItem<Record<string, Address[]>>(STORAGE_ADDRESSES, {});
  all[uid] = addresses;
  setLocalItem(STORAGE_ADDRESSES, all);
}

function getUserBookings(userId?: string): Booking[] {
  const uid = userId ?? getCurrentUser()?.id;
  if (!uid) return [];
  const all = getLocalItem<Record<string, Booking[]>>(STORAGE_BOOKINGS, {});
  return all[uid] ?? [];
}

function saveUserBookings(bookings: Booking[], userId?: string) {
  const uid = userId ?? getCurrentUser()?.id;
  if (!uid) return;
  const all = getLocalItem<Record<string, Booking[]>>(STORAGE_BOOKINGS, {});
  all[uid] = bookings;
  setLocalItem(STORAGE_BOOKINGS, all);
}

function getProRequests(): BookingRequest[] {
  return getLocalItem<BookingRequest[]>(STORAGE_PRO_REQUESTS, [...DEMO_PRO_REQUESTS]);
}

function saveProRequests(requests: BookingRequest[]) {
  setLocalItem(STORAGE_PRO_REQUESTS, requests);
}

function getProBookings(): ProBooking[] {
  return getLocalItem<ProBooking[]>(STORAGE_PRO_BOOKINGS, [...DEMO_PRO_BOOKINGS]);
}

function saveProBookings(bookings: ProBooking[]) {
  setLocalItem(STORAGE_PRO_BOOKINGS, bookings);
}

export function handleMockRequest<T>(
  path: string,
  method: string = "GET",
  body?: any,
): T | null {
  const cleanPath = path.split("?")[0];

  // 1. Auth: Login
  if (cleanPath === "/auth/login" && method === "POST") {
    const email = (body?.email ?? "").toLowerCase().trim();
    const registered = getLocalItem<Record<string, User>>(STORAGE_USERS, {});
    let user = registered[email];

    if (!user) {
      const isPro =
        email.includes("nurse") ||
        email.includes("pro") ||
        email.includes("physio");
      const namePart = email.split("@")[0] || "User";
      const derivedName = namePart
        .split(/[._-]/)
        .filter(Boolean)
        .map((s: string) => s.charAt(0).toUpperCase() + s.slice(1))
        .join(" ");

      user = {
        id: "usr_" + Math.random().toString(36).slice(2, 9),
        full_name: isPro ? "Healthcare Professional" : (derivedName || "User"),
        email,
        phone_number: "+919876543210",
        role: isPro ? "professional" : "patient",
        gender: "unspecified",
        date_of_birth: null,
        avatar_url: null,
        status: "active",
        referral_code: "MND" + Math.floor(Math.random() * 900 + 100),
        created_at: new Date().toISOString(),
      };
      registered[email] = user;
      setLocalItem(STORAGE_USERS, registered);
    }

    setCurrentUser(user);
    const tokens: TokenPair = {
      access_token: "mock_jwt_access_" + Date.now(),
      refresh_token: "mock_jwt_refresh_" + Date.now(),
      expires_in: 3600,
      user,
    };
    return tokens as T;
  }

  // 2. Auth: Register
  if (cleanPath === "/auth/register" && method === "POST") {
    const email = (body?.email ?? "").toLowerCase().trim();
    const user: User = {
      id: "usr_" + Math.random().toString(36).slice(2, 9),
      full_name: (body?.full_name ?? "User").trim(),
      email,
      phone_number: body?.phone_number ?? "+919876543210",
      role: body?.role ?? "patient",
      gender: "unspecified",
      date_of_birth: null,
      avatar_url: null,
      status: "active",
      referral_code: "MND" + Math.floor(Math.random() * 900 + 100),
      created_at: new Date().toISOString(),
    };
    const registered = getLocalItem<Record<string, User>>(STORAGE_USERS, {});
    registered[email] = user;
    setLocalItem(STORAGE_USERS, registered);

    setCurrentUser(user);
    const tokens: TokenPair = {
      access_token: "mock_jwt_access_" + Date.now(),
      refresh_token: "mock_jwt_refresh_" + Date.now(),
      expires_in: 3600,
      user,
    };
    return tokens as T;
  }

  // 3. Auth: Me — NEVER returns demo profile. Must throw 401 if unauthenticated!
  if (cleanPath === "/auth/me" && method === "GET") {
    const user = getCurrentUser();
    if (!user) {
      throw new MockHttpError("Please log in to continue.", 401, "unauthorized");
    }
    return user as T;
  }

  // 4. Auth: Logout
  if (cleanPath === "/auth/logout" && method === "POST") {
    setCurrentUser(null);
    return { success: true } as T;
  }

  // 5. User: Me (PATCH)
  if (cleanPath === "/users/me" && method === "PATCH") {
    const user = getCurrentUser();
    if (!user) {
      throw new MockHttpError("Please log in to update your profile.", 401, "unauthorized");
    }
    const updated = { ...user, ...body };
    setCurrentUser(updated);
    const registered = getLocalItem<Record<string, User>>(STORAGE_USERS, {});
    if (updated.email) {
      registered[updated.email.toLowerCase()] = updated;
      setLocalItem(STORAGE_USERS, registered);
    }
    return updated as T;
  }

  // 6. Services & Categories
  if (cleanPath === "/services/categories") {
    return DEMO_CATEGORIES as T;
  }
  if (cleanPath === "/services") {
    return DEMO_SERVICES as T;
  }

  // 7. Addresses (scoped to the currently signed in user)
  if (cleanPath === "/addresses") {
    if (method === "GET") {
      return getUserAddresses() as T;
    }
    if (method === "POST") {
      let addresses = getUserAddresses();
      const newAddress: Address = {
        id: "addr_" + Date.now(),
        label: body?.label ?? "home",
        line1: body?.line1 ?? "",
        line2: body?.line2 ?? null,
        landmark: body?.landmark ?? null,
        city: body?.city ?? "Bengaluru",
        state: body?.state ?? "Karnataka",
        pincode: body?.pincode ?? "560038",
        is_default: addresses.length === 0 || !!body?.is_default,
        contact_name: body?.contact_name ?? null,
        contact_phone: body?.contact_phone ?? null,
        instructions_for_professional: body?.instructions_for_professional ?? null,
        latitude: body?.location?.latitude ?? 12.9716,
        longitude: body?.location?.longitude ?? 77.5946,
      };
      if (newAddress.is_default) {
        addresses = addresses.map((a) => ({ ...a, is_default: false }));
      }
      addresses.push(newAddress);
      saveUserAddresses(addresses);
      return newAddress as T;
    }
  }

  if (cleanPath.startsWith("/addresses/") && method === "PATCH") {
    const id = cleanPath.split("/")[2];
    let addresses = getUserAddresses();
    addresses = addresses.map((a) =>
      a.id === id ? { ...a, ...body } : body?.is_default ? { ...a, is_default: false } : a,
    );
    saveUserAddresses(addresses);
    const updated = addresses.find((a) => a.id === id);
    return updated as T;
  }

  if (cleanPath.startsWith("/addresses/") && method === "DELETE") {
    const id = cleanPath.split("/")[2];
    let addresses = getUserAddresses();
    addresses = addresses.filter((a) => a.id !== id);
    saveUserAddresses(addresses);
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

  // 9. Nearby professionals (within 10 km)
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

  // 10. Patient Bookings list (scoped to currently signed in user)
  if (cleanPath === "/bookings") {
    if (method === "GET") {
      const userBookings = getUserBookings();
      const items: BookingListItem[] = userBookings.map((b) => ({
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
      const addresses = getUserAddresses();
      const addr = addresses.find((a) => a.id === body?.address_id) ?? addresses[0];
      const code = "MND-" + Math.floor(1000 + Math.random() * 9000);
      const tax = Math.round((srv.base_price - 50) * 0.18);
      const newBooking: Booking = {
        id: "bkg_" + Date.now(),
        booking_code: code,
        status: "searching",
        service_id: srv.id,
        service_name_snapshot: srv.name,
        address_snapshot: addr ? `${addr.line1}, ${addr.city}` : "Indiranagar, Bengaluru",
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
      const userBookings = getUserBookings();
      userBookings.unshift(newBooking);
      saveUserBookings(userBookings);

      // Automatically add to pro requests as well for nearby nurses
      const proRequests = getProRequests();
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
      saveProRequests(proRequests);

      return newBooking as T;
    }
  }

  // 11. Patient Booking by ID
  if (cleanPath.startsWith("/bookings/") && !cleanPath.includes("/professional/")) {
    const parts = cleanPath.split("/");
    const id = parts[2];
    const action = parts[3];

    const allBookingsMap = getLocalItem<Record<string, Booking[]>>(STORAGE_BOOKINGS, {});
    let foundBooking: Booking | null = null;
    let foundUserId: string | null = null;
    for (const [uid, bList] of Object.entries(allBookingsMap)) {
      const match = bList.find((b) => b.id === id);
      if (match) {
        foundBooking = match;
        foundUserId = uid;
        break;
      }
    }

    if (action === "cancel" && method === "POST") {
      if (foundBooking && foundUserId) {
        const userBookings = allBookingsMap[foundUserId];
        const updated = userBookings.map((b) =>
          b.id === id
            ? { ...b, status: "cancelled" as const, cancellation_reason: body?.reason ?? "Cancelled" }
            : b,
        );
        allBookingsMap[foundUserId] = updated;
        setLocalItem(STORAGE_BOOKINGS, allBookingsMap);
        return updated.find((b) => b.id === id) as T;
      }
      return { success: true } as T;
    }

    if (method === "GET") {
      if (foundBooking) {
        return foundBooking as T;
      }
      // If it's a recently created booking from another session
      const userBookings = getUserBookings();
      const bkg = userBookings.find((b) => b.id === id);
      if (bkg) return bkg as T;
      throw new MockHttpError("Booking not found", 404, "not_found");
    }
  }

  // 12. Reviews
  if (cleanPath === "/reviews" && method === "POST") {
    const allBookingsMap = getLocalItem<Record<string, Booking[]>>(STORAGE_BOOKINGS, {});
    for (const uid of Object.keys(allBookingsMap)) {
      allBookingsMap[uid] = allBookingsMap[uid].map((b) =>
        b.id === body?.booking_id ? { ...b, review_rating: body?.rating } : b,
      );
    }
    setLocalItem(STORAGE_BOOKINGS, allBookingsMap);
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
    return getProRequests() as T;
  }

  // 16. Professional: Accept request
  if (cleanPath.endsWith("/accept") && method === "POST") {
    const id = cleanPath.split("/")[2];
    const proRequests = getProRequests();
    const req = proRequests.find((r) => r.id === id);
    const remainingRequests = proRequests.filter((r) => r.id !== id);
    saveProRequests(remainingRequests);

    // Update patient booking across all user accounts to confirmed
    const allBookingsMap = getLocalItem<Record<string, Booking[]>>(STORAGE_BOOKINGS, {});
    let targetBooking: Booking | null = null;
    let targetUserId: string | null = null;

    const loggedInUser = getCurrentUser();
    const proName =
      loggedInUser && loggedInUser.role === "professional" && loggedInUser.full_name
        ? loggedInUser.full_name
        : "Priya Sharma";
    const proPhone =
      loggedInUser && loggedInUser.role === "professional" && loggedInUser.phone_number
        ? loggedInUser.phone_number
        : "+91 98123 45678";

    for (const [uid, bList] of Object.entries(allBookingsMap)) {
      const idx = bList.findIndex((b) => b.id === id);
      if (idx !== -1) {
        targetBooking = bList[idx];
        targetUserId = uid;
        bList[idx] = {
          ...targetBooking,
          status: "confirmed",
          professional: {
            id: currentProProfile.id || "prof_priya_sharma",
            full_name: proName,
            avatar_url: null,
            professional_type: currentProProfile.professional_type || "nurse",
            years_of_experience: currentProProfile.years_of_experience || 6,
            average_rating: currentProProfile.average_rating || 4.9,
            total_ratings: currentProProfile.total_ratings || 124,
            languages_spoken: currentProProfile.languages_spoken || ["English", "Hindi", "Kannada"],
            phone_number: proPhone,
          },
        };
        break;
      }
    }
    setLocalItem(STORAGE_BOOKINGS, allBookingsMap);

    const registered = getLocalItem<Record<string, User>>(STORAGE_USERS, {});
    const patientUser = targetUserId
      ? Object.values(registered).find((u) => u.id === targetUserId)
      : null;

    const proBookings = getProBookings();
    const proBooking: ProBooking = {
      id,
      booking_code: req?.booking_code ?? targetBooking?.booking_code ?? "MND-1234",
      status: "confirmed",
      service_name: req?.service_name ?? targetBooking?.service_name_snapshot ?? "General Nursing Visit",
      scheduled_start_at: req?.scheduled_start_at ?? targetBooking?.scheduled_start_at ?? new Date(Date.now() + 3600000).toISOString(),
      scheduled_end_at: req?.scheduled_end_at ?? targetBooking?.scheduled_end_at ?? new Date(Date.now() + 7200000).toISOString(),
      address: targetBooking?.address_snapshot ?? "Indiranagar, Bengaluru",
      landmark: "Near Metro Pillar",
      instructions: "Call on arrival",
      latitude: 12.9784,
      longitude: 77.6408,
      patient_name: patientUser?.full_name ?? "Patient",
      patient_phone: patientUser?.phone_number ?? "+919876543210",
      patient_notes: req?.patient_notes ?? targetBooking?.patient_notes ?? null,
      earning_amount: req?.earning_amount ?? 900,
      started_at: null,
      completed_at: null,
      visit_summary_notes: null,
      created_at: new Date().toISOString(),
    };
    proBookings.unshift(proBooking);
    saveProBookings(proBookings);

    return { success: true } as T;
  }

  // 17. Professional: My Bookings
  if (cleanPath === "/bookings/professional/mine") {
    return getProBookings() as T;
  }

  if (cleanPath.startsWith("/bookings/professional/")) {
    const id = cleanPath.split("/")[3];
    const bookings = getProBookings();
    const b = bookings.find((item) => item.id === id) ?? bookings[0];
    return b as T;
  }

  // 18. Professional: Check in / Check out / Release
  if (cleanPath.endsWith("/check-in") && method === "POST") {
    const id = cleanPath.split("/")[2];
    const proBookings = getProBookings().map((b) =>
      b.id === id ? { ...b, status: "in_progress" as const, started_at: new Date().toISOString() } : b,
    );
    saveProBookings(proBookings);

    const allBookingsMap = getLocalItem<Record<string, Booking[]>>(STORAGE_BOOKINGS, {});
    for (const uid of Object.keys(allBookingsMap)) {
      allBookingsMap[uid] = allBookingsMap[uid].map((b) =>
        b.id === id ? { ...b, status: "in_progress" as const } : b,
      );
    }
    setLocalItem(STORAGE_BOOKINGS, allBookingsMap);

    return proBookings.find((b) => b.id === id) as T;
  }

  if (cleanPath.endsWith("/check-out") && method === "POST") {
    const id = cleanPath.split("/")[2];
    const proBookings = getProBookings().map((b) =>
      b.id === id
        ? {
            ...b,
            status: "completed" as const,
            completed_at: new Date().toISOString(),
            visit_summary_notes: body?.visit_summary_notes ?? null,
          }
        : b,
    );
    saveProBookings(proBookings);

    const allBookingsMap = getLocalItem<Record<string, Booking[]>>(STORAGE_BOOKINGS, {});
    for (const uid of Object.keys(allBookingsMap)) {
      allBookingsMap[uid] = allBookingsMap[uid].map((b) =>
        b.id === id
          ? {
              ...b,
              status: "completed" as const,
              visit_summary_notes: body?.visit_summary_notes ?? null,
            }
          : b,
      );
    }
    setLocalItem(STORAGE_BOOKINGS, allBookingsMap);
    currentProProfile.total_visits_completed += 1;
    return proBookings.find((b) => b.id === id) as T;
  }

  if (cleanPath.endsWith("/release") && method === "POST") {
    const id = cleanPath.split("/")[2];
    const proBookings = getProBookings().filter((b) => b.id !== id);
    saveProBookings(proBookings);

    const allBookingsMap = getLocalItem<Record<string, Booking[]>>(STORAGE_BOOKINGS, {});
    for (const uid of Object.keys(allBookingsMap)) {
      allBookingsMap[uid] = allBookingsMap[uid].map((b) =>
        b.id === id ? { ...b, status: "searching" as const, professional: null } : b,
      );
    }
    setLocalItem(STORAGE_BOOKINGS, allBookingsMap);
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
