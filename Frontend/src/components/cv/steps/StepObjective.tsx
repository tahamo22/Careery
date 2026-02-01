import { useState } from "react";
import RichInput from "../RichInput";

export default function StepObjective({ formData, setFormData, handleSaveAndNext, setStep, setIsDirty }: any) {
  const [justSaved, setJustSaved] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setIsDirty?.(true);
    setErrors({});
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const saveHtmlToLocalStorage = () => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem("stepObjectiveData", JSON.stringify(formData || {}));
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 1500);
    } catch (error) {
      console.error("Failed to save objective data", error);
    }
  };
  const validate = () => {
    const newErr: any = {};

    // Check if empty or only contains whitespace
    // If RichInput uses HTML, strip tags to check if actual text exists
    const plainText = formData.objective?.replace(/<[^>]*>/g, "").trim();

    if (!formData.objective || plainText === "") {
      newErr.objective = "Objective is required before moving to the next step.";
    }

    setErrors(newErr);
    return Object.keys(newErr).length === 0;
  };

  const onNext = () => {
    if (validate()) {
      handleSaveAndNext(3);
    } else {
      // Optional: Scroll to the input if there is an error
      console.log("Validation failed", errors);
    }
  };

  console.log(errors);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Step 2: Objective</h2>

    
      <div className="relative">
        <RichInput
          name="objective"
          placeholder="Your Career Objective"
          value={formData.objective}
          onChange={handleChange}
          className={`pb-10 transition-colors ${errors.objective}`}
          error={errors.objective}
        />
      </div>

      <div className="flex gap-4 mt-6">
        <button onClick={() => setStep(1)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition">
          ← Back
        </button>

        <button
          onClick={onNext}
          className={`w-full sm:w-auto px-6 py-2 font-semibold rounded-md shadow-md transition duration-300
            ${
              !formData.objective?.trim() ? "bg-gray-400 cursor-not-allowed opacity-70" : "bg-primary hover:bg-white/70 text-zinc-900 cursor-pointer"
            }`}
        >
          Save & Continue →
        </button>
      </div>
    </div>
  );
}
