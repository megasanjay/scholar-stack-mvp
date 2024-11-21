import * as Sentry from "@sentry/nuxt";

Sentry.init({
  dsn: "https://ee704d40cbf865aa1ef07e1793abd97f@o4505439471665152.ingest.us.sentry.io/4508332975063040",
  // Tracing
  // We recommend adjusting this value in production, or using a tracesSampler for finer control.
  tracesSampleRate: 1.0, // Capture 100% of the transactions
});
