import { Suspense } from "react";
import { PatientForm } from "./patient/patient-form";

export default function Home() {
  return (
    <Suspense>
      <PatientForm />
    </Suspense>
  );
}
