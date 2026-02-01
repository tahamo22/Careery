// src/components/cv/steps/StepPersonal.tsx
"use client";
import React, { useState } from "react";

import RichInput from "../RichInput";

export default function StepPersonal({ formData, setFormData, handleSaveAndNext, setIsDirty }: any) {
  const [errors, setErrors] = useState<any>({});

  const [justSaved, setJustSaved] = useState(false);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setIsDirty?.(true);
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const saveHtmlToLocalStorage = () => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem("stepPersonalData", JSON.stringify(formData || {}));
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 1500);
    } catch (error) {
      console.error("Failed to save personal data", error);
    }
  };

  const validate = () => {
    const newErr: any = {};
    if (!formData.first_name?.trim()) newErr.first_name = "First name is required";
    if (!formData.last_name?.trim()) newErr.last_name = "Last name is required";
    if (!formData.email?.trim()) newErr.email = "Email is required";
    if (!formData.phone?.trim()) newErr.phone = "Phone is required";
    if (!formData.location?.trim()) newErr.location = "Location is required";
    setErrors(newErr);
    return Object.keys(newErr).length === 0;
  };

  const onNext = () => {
    if (!validate()) return;
    handleSaveAndNext(2);
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Step 1: Personal Information</h2>

      {/* شريط الأدوات */}

      <RichInput name="first_name" placeholder="First Name" required value={formData.first_name} onChange={handleChange} error={errors.first_name} />
      <RichInput name="last_name" placeholder="Last Name" required value={formData.last_name} onChange={handleChange} error={errors.last_name} />
      <RichInput name="email" placeholder="Email" required value={formData.email} onChange={handleChange} error={errors.email} />
      <RichInput name="phone" placeholder="Phone" required value={formData.phone} onChange={handleChange} error={errors.phone} />
      <RichInput
        name="location"
        placeholder="Location (e.g., Cairo, Egypt)"
        required
        value={formData.location}
        onChange={handleChange}
        error={errors.location}
      />
      <RichInput name="linkedin" placeholder="LinkedIn (optional)" value={formData.linkedin} onChange={handleChange} />
      <RichInput name="website" placeholder="Website / GitHub (optional)" value={formData.website} onChange={handleChange} />

      <div className="flex gap-4 mt-4">
        <button
          onClick={onNext}
          className="w-full sm:w-auto px-6 py-2 bg-primary hover:bg-primary-dark text-zinc-900 cursor-pointer hover:bg-white/70 duration-300   font-semibold rounded-md shadow-md transition"
        >
          Save & Continue →
        </button>
      </div>
    </div>
  );
}
