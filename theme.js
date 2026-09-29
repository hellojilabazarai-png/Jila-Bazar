
/* ============================================================================
   जिला बाजार — JILA BAZAR
   Hyperlocal e-commerce marketplace for Bhagalpur, Bihar
   Single-file multi-role app: Customer / Seller / Admin
   Storage: browser localStorage — koi backend/Firebase/server nahi chahiye,
   yeh app poori tarah standalone chalti hai.
   ============================================================================ */
/* ---------------------------- DESIGN TOKENS ---------------------------- */
export const APP_VERSION = "1.0.0";

export const T = {
    maroon: "#131921", // Amazon-style dark header navy/black — header, navigation, buttons
    maroonDark: "#232F3E", // Amazon secondary dark blue for hover/active states
    gold: "#FF9900", // Amazon orange (Accent) — offers, highlights, CTAs, icons
    goldLight: "#FEBD69", // Amazon light orange for badges/highlights
    cream: "#F3F3F3", // Light grey (Background) — main background, product image tiles
    ink: "#0F1111", // Amazon near-black (Text) — headings, descriptions
    teal: "#18B83A", // (unused elsewhere — aligned to Green)
    rose: "#BFE8C8", // Light green tint used in decorative background gradient
    danger: "#CC0C39", // Amazon-style deal/discount red
    success: "#007600", // Amazon-style in-stock/success green
    border: "#D5D9D9", // Amazon-style neutral grey border
};
