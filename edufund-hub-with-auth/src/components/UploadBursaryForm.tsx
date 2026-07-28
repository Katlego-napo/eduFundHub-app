"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { FIELDS_OF_STUDY, PROVINCES } from "@/lib/types/bursary";

export default function UploadBursaryForm() {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [funder, setFunder] = useState("");
  const [fieldOfStudy, setFieldOfStudy] = useState<string>(FIELDS_OF_STUDY[0]);
  const [province, setProvince] = useState<string>(PROVINCES[0]);
  const [closingDate, setClosingDate] = useState("");
  const [coverage, setCoverage] = useState("");
  const [description, setDescription] = useState("");
  const [eligibility, setEligibility] = useState("");
  const [benefits, setBenefits] = useState("");
  const [officialUrl, setOfficialUrl] = useState("");
  const [contactInfo, setContactInfo] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function resetForm() {
    setName("");
    setFunder("");
    setClosingDate("");
    setCoverage("");
    setDescription("");
    setEligibility("");
    setBenefits("");
    setOfficialUrl("");
    setContactInfo("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: insertError } = await supabase.from("bursaries").insert({
      name,
      funder,
      field_of_study: fieldOfStudy,
      province,
      closing_date: closingDate,
      coverage,
      description,
      eligibility,
      benefits,
      official_url: officialUrl,
      contact_info: contactInfo || null,
    });

    setLoading(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setSuccess(true);
    resetForm();
    router.refresh();
  }

  const inputClass =
    "mt-1.5 w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-secondary";
  const labelClass = "text-sm font-medium text-foreground";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Bursary Name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. NSFAS Bursary 2027"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Funder</label>
          <input
            required
            value={funder}
            onChange={(e) => setFunder(e.target.value)}
            placeholder="e.g. National Student Financial Aid Scheme"
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className={labelClass}>Field of Study</label>
          <select
            value={fieldOfStudy}
            onChange={(e) => setFieldOfStudy(e.target.value)}
            className={inputClass}
          >
            {FIELDS_OF_STUDY.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Province</label>
          <select
            value={province}
            onChange={(e) => setProvince(e.target.value)}
            className={inputClass}
          >
            {PROVINCES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Closing Date</label>
          <input
            type="date"
            required
            value={closingDate}
            onChange={(e) => setClosingDate(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Coverage (short summary)</label>
        <input
          required
          value={coverage}
          onChange={(e) => setCoverage(e.target.value)}
          placeholder="e.g. Full tuition, accommodation & allowance"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Description</label>
        <textarea
          required
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What is this bursary, and who funds it?"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Eligibility Requirements</label>
        <textarea
          required
          rows={3}
          value={eligibility}
          onChange={(e) => setEligibility(e.target.value)}
          placeholder="Who can apply? Academic, financial, citizenship requirements..."
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Benefits</label>
        <textarea
          required
          rows={3}
          value={benefits}
          onChange={(e) => setBenefits(e.target.value)}
          placeholder="What does the bursary cover or provide?"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Official Application Link</label>
          <input
            type="url"
            required
            value={officialUrl}
            onChange={(e) => setOfficialUrl(e.target.value)}
            placeholder="https://..."
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Contact Info (optional)</label>
          <input
            value={contactInfo}
            onChange={(e) => setContactInfo(e.target.value)}
            placeholder="email or phone number"
            className={inputClass}
          />
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-lg bg-secondary/10 px-3 py-2 text-sm text-foreground">
          Bursary added successfully.
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-light disabled:opacity-60"
      >
        {loading ? "Saving..." : "Add Bursary"}
      </button>
    </form>
  );
}
