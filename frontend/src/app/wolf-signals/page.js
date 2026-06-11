import { Suspense } from "react";

import WolfSignalsClient from "./wolf-signals-client";

export const metadata = {
  title: "Wolf Signals — WolfRadar",
  description: "Upcoming earnings, dividends, and catalyst events.",
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <WolfSignalsClient />
    </Suspense>
  );
}
