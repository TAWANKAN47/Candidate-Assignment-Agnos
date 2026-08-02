import { Suspense } from "react";
import { StaffView } from "./staff-view";

export default function StaffPage() {
  return (
    <Suspense>
      <StaffView />
    </Suspense>
  );
}
