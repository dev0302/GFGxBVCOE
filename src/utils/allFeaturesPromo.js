export const ALL_FEATURES_PROMO_KEY = "gfg-all-features-promo-v1";

export function hasSeenAllFeaturesPromo() {
  try {
    if (new URLSearchParams(window.location.search).has("featurePromo")) {
      return false;
    }
    return window.localStorage.getItem(ALL_FEATURES_PROMO_KEY) === "1";
  } catch {
    return true;
  }
}

export function markAllFeaturesPromoSeen() {
  try {
    window.localStorage.setItem(ALL_FEATURES_PROMO_KEY, "1");
  } catch {
    /* ignore quota / private mode */
  }
}

export function getVisibleProfileMenuTrigger() {
  const nodes = [
    ...document.querySelectorAll("[data-profile-menu-trigger]"),
  ];
  return (
    nodes.find((el) => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return (
        rect.width > 4 &&
        rect.height > 4 &&
        style.visibility !== "hidden" &&
        style.display !== "none" &&
        rect.bottom > 0 &&
        rect.top < 96
      );
    }) ||
    nodes.find((el) => {
      const rect = el.getBoundingClientRect();
      return rect.width > 4 && rect.height > 4;
    }) ||
    null
  );
}
