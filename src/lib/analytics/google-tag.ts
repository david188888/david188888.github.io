import { analyticsConfig } from "@/config/analytics";

// Runs once in the root layout. Loading the tag only on the live hostname
// keeps local development and static previews out of the real property.
export const googleAnalyticsBootstrap = `(function () {
  if (window.location.hostname !== ${JSON.stringify(analyticsConfig.hostname)} || document.getElementById("ga4-tag")) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag("js", new Date());
  window.gtag("config", ${JSON.stringify(analyticsConfig.trackingId)}, {
    allow_google_signals: false,
    allow_ad_personalization_signals: false
  });

  var tag = document.createElement("script");
  tag.id = "ga4-tag";
  tag.async = true;
  tag.src = ${JSON.stringify(`https://www.googletagmanager.com/gtag/js?id=${analyticsConfig.trackingId}`)};
  document.head.appendChild(tag);
})();`;

// GA4 enhanced measurement already tracks history changes for this stream.
// Do not add manual route page_view events alongside it: that would count twice.
