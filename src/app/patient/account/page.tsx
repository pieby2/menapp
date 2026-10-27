"use client";

import { useState } from "react";

import { AddressForm, addressLine } from "@/components/address-form";
import { Icon } from "@/components/icons";
import { ProfileForm } from "@/components/profile-form";
import { useToast } from "@/components/toast";
import { Badge, Button, Card, PageHeader, SectionHeading } from "@/components/ui";
import { api, errorMessage } from "@/lib/api";
import { useApi } from "@/lib/hooks";
import type { Address } from "@/lib/types";

export default function PatientAccountPage() {
  const toast = useToast();
  const addresses = useApi<Address[]>("/addresses");
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  async function makeDefault(address: Address) {
    setBusy(address.id);
    try {
      await api(`/addresses/${address.id}`, { method: "PATCH", body: { is_default: true } });
      await addresses.reload();
      toast.success(`"${address.label}" set as default address.`);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  async function remove(address: Address) {
    if (!window.confirm(`Delete the "${address.label}" address?`)) return;
    setBusy(address.id);
    try {
      await api(`/addresses/${address.id}`, { method: "DELETE" });
      await addresses.reload();
      toast.success("Address deleted.");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  const list = addresses.data ?? [];

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PageHeader
        title="My Account"
        subtitle="Manage your profile information and home addresses for visits."
      />

      {/* Personal Details */}
      <ProfileForm />

      {/* Saved Addresses Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <SectionHeading title="Saved Addresses" />
          {!adding && (
            <Button size="sm" variant="secondary" icon="plus" onClick={() => setAdding(true)}>
              Add Address
            </Button>
          )}
        </div>

        {adding && (
          <Card className="p-5 sm:p-6 border-brand-200 bg-brand-50/20">
            <h3 className="text-base font-bold text-slate-900 mb-4">Add New Address</h3>
            <AddressForm
              makeDefault={list.length === 0}
              onSaved={() => {
                setAdding(false);
                void addresses.reload();
                toast.success("Address saved successfully.");
              }}
              onCancel={() => setAdding(false)}
            />
          </Card>
        )}

        <div className="space-y-3">
          {list.map((address) => (
            <Card key={address.id} className="p-5 shadow-xs border-slate-200/90 transition-all hover:border-slate-300">
              <div className="flex items-start gap-3.5">
                <div className="size-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0 mt-0.5">
                  <Icon name="pin" className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2.5">
                    <span className="text-base font-bold capitalize text-slate-900">{address.label}</span>
                    {address.is_default && <Badge tone="brand">Default</Badge>}
                  </div>
                  <p className="mt-1 text-sm sm:text-base text-slate-600 leading-relaxed">
                    {addressLine(address)}
                  </p>
                  {address.contact_name && (
                    <p className="mt-1 text-xs text-slate-500">
                      Contact: <span className="font-semibold text-slate-700">{address.contact_name}</span>
                      {address.contact_phone ? ` (${address.contact_phone})` : ""}
                    </p>
                  )}
                  {address.instructions_for_professional && (
                    <p className="mt-1 text-xs italic text-slate-500">
                      &ldquo;{address.instructions_for_professional}&rdquo;
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3">
                    {!address.is_default && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy === address.id}
                        onClick={() => makeDefault(address)}
                      >
                        Set as Default
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="dangerGhost"
                      icon="trash"
                      disabled={busy === address.id}
                      onClick={() => remove(address)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {addresses.data && list.length === 0 && !adding && (
            <Card className="p-8 text-center border-dashed">
              <Icon name="pin" className="size-8 text-slate-300 mx-auto mb-2" />
              <p className="text-base font-bold text-slate-800">No saved addresses yet</p>
              <p className="text-sm text-slate-500 mt-1">Add your home address for quick booking.</p>
              <div className="mt-4">
                <Button size="sm" icon="plus" onClick={() => setAdding(true)}>
                  Add Home Address
                </Button>
              </div>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}
