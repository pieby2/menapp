"use client";

import { useEffect, useState, type FormEvent } from "react";

import { useToast } from "@/components/toast";
import { Button, Card, Field, Input } from "@/components/ui";
import { api, errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { isValidIndianMobile, toE164India } from "@/lib/format";
import type { User } from "@/lib/types";

/** Name, mobile and email — shared by the patient and professional account pages. */
export function ProfileForm() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(user?.full_name ?? "");
  const [phone, setPhone] = useState(user?.phone_number ? user.phone_number.replace(/^\+91/, "") : "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [errors, setErrors] = useState<{ name?: string; phone?: string; email?: string }>({});
  const [saving, setSaving] = useState(false);

  // Sync state whenever auth user loads or updates
  useEffect(() => {
    if (user) {
      if (user.full_name) setName(user.full_name);
      if (user.phone_number) setPhone(user.phone_number.replace(/^\+91/, ""));
      if (user.email) setEmail(user.email);
    }
  }, [user]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const found: typeof errors = {};
    if (name.trim().length < 2) found.name = "Please enter your full name.";
    if (!isValidIndianMobile(phone)) found.phone = "Enter a valid 10-digit mobile number.";
    if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) found.email = "Enter a valid email address.";
    setErrors(found);
    if (Object.keys(found).length) return;

    setSaving(true);
    try {
      const updated = await api<User>("/users/me", {
        method: "PATCH",
        body: {
          full_name: name.trim(),
          phone_number: toE164India(phone),
          email: email.trim() || null,
        },
      });
      setUser(updated);
      toast.success("Profile saved successfully.");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-5 sm:p-6 shadow-xs">
      <h2 className="mb-4 text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
        Personal Details
      </h2>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Field label="Full Name" htmlFor="profile-name" error={errors.name}>
          <Input
            id="profile-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Asha Patel"
          />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Mobile Number" htmlFor="profile-phone" error={errors.phone} hint="10-digit Indian phone number">
            <Input
              id="profile-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="98765 43210"
            />
          </Field>
          <Field label="Email Address" htmlFor="profile-email" error={errors.email} optional>
            <Input
              id="profile-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="asha@example.com"
            />
          </Field>
        </div>
        <div className="pt-2">
          <Button type="submit" loading={saving} size="md">
            Save Profile
          </Button>
        </div>
      </form>
    </Card>
  );
}
