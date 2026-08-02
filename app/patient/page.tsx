import { Suspense } from "react";
import { PatientForm } from "./patient-form";

export default function PatientPage() {
  return (
    <Suspense>
      <PatientForm />
    </Suspense>
  );
}
