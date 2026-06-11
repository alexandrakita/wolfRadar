import { Suspense } from "react";

import AlertsClient from "./alerts-client";

export const metadata = {
  title: "Alerts — WolfRadar",
  description: "Price alerts, earnings reminders, and watchlist notifications.",
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AlertsClient />
    </Suspense>
  );
}
