"use client";
import StepPersonal from "./steps/StepPersonal";
import StepObjective from "./steps/StepObjective";
import StepEducation from "./steps/StepEducation";
import StepSkills from "./steps/StepSkills";
import StepExperience from "./steps/StepExperience";
import StepSections from "./steps/StepSections";


export default function CvFormStep({
  step,
  setStep,
  formData,
  setFormData,
  handleSaveAndNext,
  setIsDirty,
}: any) {
  const props = { formData, setFormData, setStep, handleSaveAndNext, setIsDirty };

  return (
    <>
      {step === 1 && <StepPersonal {...props} />}
      {step === 2 && <StepObjective {...props} />}
      {step === 3 && <StepEducation {...props} />}
      {step === 4 && <StepSkills {...props} />}
      {step === 5 && <StepExperience {...props} />}
      {step === 6 && <StepSections {...props} />}
     
    </>
  );
}
