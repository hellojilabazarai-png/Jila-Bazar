import React, { useState, useEffect } from "react";
import { AppProvider, useApp } from "./AppContext.jsx";
import { useCart, useIsMobile } from "./helpers.js";
import { ComingSoonScreen, csOn, featureForView } from "./ComingSoon.jsx";
import { memStorage } from "./storage.js";
import { nowISO } from "./database.js";
import { AdminShell, hasAdminPermission } from "./AdminLayout.jsx";
import { GlobalStyle } from "./BasicUI.jsx";
import { BottomNav, Header } from "./Navigation.jsx";
import { AboutUsPage, AddressBook, CartView, CategoriesScreen, CheckoutView, CustomerHome, HelpScreen, NotificationsView, OrderHistory, OrderTracking, ProductDetail, ProfileMenu, ReferralPage, SecuritySettings, WishlistView } from "./CustomerScreens.jsx";
import { AuthGate } from "./AuthScreens.jsx";
import { ResellerApply, ResellerDashboard, ResellerWithdrawal } from "./ResellerScreens.jsx";
import { SellerAddProduct, SellerDashboard, SellerEarnings, SellerInventoryAI, SellerKYC, SellerOrders, SellerProducts, SellerReviews, SellerWithdrawal } from "./SellerScreens.jsx";
import { AdminLogin, AdminSetup } from "./AdminAuth.jsx";
import { AdminDashboard, AdminFraudCheck, AdminResellers, AdminSellers, AdminStaff, AdminUsers } from "./AdminPeople.jsx";
import { AdminAds, AdminAnalytics, AdminBanners, AdminCategories, AdminCommission, AdminCoupons, AdminDelivery, AdminDeliveryPartners, AdminFlashSale, AdminOrders, AdminProducts, AdminReports, AdminReturns, AdminRevenue, AdminWithdrawals } from "./AdminCommerce.jsx";
import { AdminAIChatLogs, AdminAISettings, AdminAuditLog, AdminComingSoon, AdminHelp, AdminPages, AdminSecurity, AdminTexts } from "./AdminContent.jsx";
import { AISupportChat } from "./AISupportChat.jsx";

export function Shell() {
    const { t: tt } = useApp();
    const { session, db, logout, notify, t, lang } = useApp();
    const isMobile = useIsMobile();
    const [rawView, setView] = useState("home");
    const csKey = featureForView(rawView);
    const view = (csKey && csOn(db, csKey) && (!session || session.role !== "admin")) ? "coming-soon" : rawView;
    const [activeProduct, setActiveProduct] = useState(null);
    const [activeOrder, setActiveOrder] = useState(null);
    const [editProductId, setEditProductId] = useState(null);
    const [search, setSearch] = useState("");
    const [chatOpen, setChatOpen] = useState(false);
    const cartApi = useCart((pid) => { var _a, _b; return (_b = (_a = db.products.find(p => p.id === pid)) === null || _a === void 0 ? void 0 : _a.stock) !== null && _b !== void 0 ? _b : Infinity; });
    // Browser tab title bhi selected language ke hisaab se badalta hai.
    useEffect(() => { document.title = t("brand_name"); }, [lang]);
    // Capture reseller link (?ref=CODE&pid=PRODUCTID) on load — used to apply reseller pricing/margin.
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const ref = params.get("ref");
        const pid = params.get("pid");
        if (ref && pid) {
            memStorage.setItem("jilabazar_active_ref", JSON.stringify({ resellerCode: ref, productId: pid, capturedAt: nowISO() }));
            setActiveProduct(pid);
            setView("product");
        }
    }, []);
    // Secret URL-based admin entry: koi bhi visible button/hint nahi, sirf ye exact link open karne se khulta hai.
    // Super Admin: ?jb_gate=<db.adminUrlSecret> (first-time par setup bhi khol sakta hai)
    // Staff: ?jb_staff_gate=<db.adminStaffUrlSecret> (hamesha seedha Admin Login, kabhi setup nahi)
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (db.adminUrlSecret && params.get("jb_gate") === db.adminUrlSecret) {
            const hasAdmin = db.users.some(u => u.role === "admin");
            setView(hasAdmin ? "admin-login" : "admin-setup");
            return;
        }
        if (db.adminStaffUrlSecret && params.get("jb_staff_gate") === db.adminStaffUrlSecret) {
            setView("admin-login");
        }
    }, []);
    // Session auto-timeout: admin = 15 min inactivity, others = 30 min. Protects an unattended shop counter.
    useEffect(() => {
        if (!session)
            return;
        const timeoutMs = (session.role === "admin" ? 15 : 30) * 60 * 1000;
        let timer = setTimeout(doTimeout, timeoutMs);
        function doTimeout() {
            logout();
            setView("home");
            notify(tt("m_inactivity_ki_wajah_se_aap_l"), "info");
        }
        function reset() { clearTimeout(timer); timer = setTimeout(doTimeout, timeoutMs); }
        const events = ["mousemove", "keydown", "click", "touchstart"];
        events.forEach(e => window.addEventListener(e, reset));
        return () => { clearTimeout(timer); events.forEach(e => window.removeEventListener(e, reset)); };
    }, [session]);
    // Route guards: keep customer/seller-only views safe if session missing
    useEffect(() => {
        const customerOnly = ["cart", "checkout", "orders", "tracking", "wishlist", "profile", "address", "referral", "notifications", "reseller-dashboard", "reseller-withdrawal", "reseller-apply", "security"];
        const sellerOnly = ["seller-dashboard", "seller-kyc", "seller-products", "seller-add-product", "seller-orders", "seller-earnings", "seller-inventory-ai", "seller-withdrawal", "seller-reviews", "seller-notifications"];
        const adminOnly = ["admin-dashboard", "admin-users", "admin-sellers", "admin-resellers", "admin-products", "admin-orders", "admin-returns", "admin-ads", "admin-coupons", "admin-flashsale", "admin-delivery-partners", "admin-revenue", "admin-withdrawals", "admin-banners", "admin-categories", "admin-commission", "admin-delivery", "admin-analytics", "admin-pages", "admin-help", "admin-texts", "admin-comingsoon", "admin-staff", "admin-audit", "admin-reports", "admin-fraud", "admin-aichats", "admin-aisettings", "admin-security", "admin-notifications"];
        if (customerOnly.includes(view) && (!session || session.role !== "customer"))
            setView("auth");
        if (sellerOnly.includes(view) && (!session || session.role !== "seller"))
            setView("auth");
        if (adminOnly.includes(view) && (!session || session.role !== "admin"))
            setView("home");
        if (adminOnly.includes(view) && (session === null || session === void 0 ? void 0 : session.role) === "admin" && !hasAdminPermission(session, view))
            setView("admin-dashboard");
        if (view === "admin-setup" && (session === null || session === void 0 ? void 0 : session.role) === "admin")
            setView("admin-dashboard");
    }, [view, session]);
    const showBack = !["home", "admin-login"].includes(view) && !view.startsWith("admin-");
    const isAdminArea = view.startsWith("admin-");
    const showBottomNav = isMobile && !isAdminArea && view !== "admin-login" && view !== "admin-setup" && (session === null || session === void 0 ? void 0 : session.role) !== "seller";
    const cartCount = cartApi.cart.reduce((a, i) => a + i.qty, 0);
    const goBack = () => {
        const map = {
            product: "home", cart: "home", checkout: "cart", orders: "profile", tracking: "orders",
            wishlist: "home", profile: "home", address: "profile", referral: "profile", notifications: "profile",
            "seller-kyc": "seller-dashboard", "seller-products": "seller-dashboard", "seller-add-product": "seller-products",
            "seller-orders": "seller-dashboard", "seller-earnings": "seller-dashboard", "seller-inventory-ai": "seller-dashboard", "seller-withdrawal": "seller-dashboard",
            "seller-reviews": "seller-dashboard", "seller-notifications": "seller-dashboard",
            "reseller-dashboard": "profile", "reseller-withdrawal": "reseller-dashboard", "reseller-apply": "profile",
            about: "profile", terms: "profile", privacy: "profile", security: "profile",
            categories: "home",
            "coming-soon": "home",
            help: "home",
            auth: "home",
        };
        setView(map[view] || "home");
    };
    return (<div className="jb-root" style={{ paddingBottom: showBottomNav ? 60 : 0 }}><GlobalStyle />{!isAdminArea && view !== "admin-login" && view !== "admin-setup" && (<Header view={view} setView={setView} cartCount={cartCount} onSearch={setSearch} searchValue={search} showBack={showBack} onBack={goBack} />)}{view === "coming-soon" && <ComingSoonScreen setView={setView} />}{view === "home" && <CustomerHome setView={setView} setActiveProduct={setActiveProduct} cartApi={cartApi} searchTerm={search} />}{view === "categories" && <CategoriesScreen setView={setView} setSearch={setSearch} />}{view === "help" && <HelpScreen setView={setView} />}{view === "auth" && <AuthGate setView={setView} />}{view === "product" && <ProductDetail productId={activeProduct} setView={setView} cartApi={cartApi} />}{view === "cart" && <CartView cartApi={cartApi} setView={setView} />}{view === "checkout" && <CheckoutView cartApi={cartApi} setView={setView} />}{view === "orders" && <OrderHistory setView={setView} setActiveOrder={setActiveOrder} />}{view === "tracking" && <OrderTracking orderId={activeOrder} setView={setView} />}{view === "wishlist" && <WishlistView setView={setView} setActiveProduct={setActiveProduct} cartApi={cartApi} />}{view === "profile" && <ProfileMenu setView={setView} />}{view === "address" && <AddressBook setView={setView} />}{view === "referral" && <ReferralPage />}{view === "notifications" && <NotificationsView />}{view === "security" && <SecuritySettings setView={setView} />}{view === "about" && <AboutUsPage page="about" setView={setView} />}{view === "terms" && <AboutUsPage page="terms" />}{view === "privacy" && <AboutUsPage page="privacy" />}{view === "reseller-apply" && <ResellerApply setView={setView} />}{view === "reseller-dashboard" && <ResellerDashboard setView={setView} setActiveProduct={setActiveProduct} />}{view === "reseller-withdrawal" && <ResellerWithdrawal />}{view === "seller-dashboard" && <SellerDashboard setView={setView} />}{view === "seller-kyc" && <SellerKYC setView={setView} />}{view === "seller-products" && <SellerProducts setView={setView} setEditId={setEditProductId} />}{view === "seller-add-product" && <SellerAddProduct setView={setView} editId={editProductId} />}{view === "seller-orders" && <SellerOrders />}{view === "seller-earnings" && <SellerEarnings />}{view === "seller-inventory-ai" && <SellerInventoryAI />}{view === "seller-withdrawal" && <SellerWithdrawal />}{view === "seller-reviews" && <SellerReviews />}{view === "seller-notifications" && <NotificationsView />}{view === "admin-login" && <AdminLogin setView={setView} />}{view === "admin-setup" && <AdminSetup setView={setView} />}{isAdminArea && (<AdminShell setView={setView} active={view}>{view === "admin-dashboard" && <AdminDashboard />}{view === "admin-users" && <AdminUsers />}{view === "admin-sellers" && <AdminSellers />}{view === "admin-resellers" && <AdminResellers />}{view === "admin-products" && <AdminProducts />}{view === "admin-orders" && <AdminOrders />}{view === "admin-returns" && <AdminReturns />}{view === "admin-ads" && <AdminAds />}{view === "admin-coupons" && <AdminCoupons />}{view === "admin-flashsale" && <AdminFlashSale />}{view === "admin-delivery-partners" && <AdminDeliveryPartners />}{view === "admin-revenue" && <AdminRevenue />}{view === "admin-withdrawals" && <AdminWithdrawals />}{view === "admin-banners" && <AdminBanners />}{view === "admin-categories" && <AdminCategories />}{view === "admin-commission" && <AdminCommission />}{view === "admin-delivery" && <AdminDelivery />}{view === "admin-analytics" && <AdminAnalytics />}{view === "admin-pages" && <AdminPages />}{view === "admin-help" && <AdminHelp />}{view === "admin-comingsoon" && <AdminComingSoon />}{view === "admin-texts" && <AdminTexts />}{view === "admin-staff" && <AdminStaff />}{view === "admin-audit" && <AdminAuditLog />}{view === "admin-reports" && <AdminReports />}{view === "admin-fraud" && <AdminFraudCheck />}{view === "admin-aichats" && <AdminAIChatLogs />}{view === "admin-aisettings" && <AdminAISettings />}{view === "admin-security" && <AdminSecurity />}{view === "admin-notifications" && <NotificationsView adminBroadcast={true} />}</AdminShell>)}{!isAdminArea && view !== "admin-login" && view !== "admin-setup" && (<div style={{ position: "fixed", bottom: showBottomNav ? 72 : 16, right: 16, zIndex: 90 }}><button className="jb-btn jb-btn-primary" style={{ borderRadius: "50%", width: 52, height: 52, padding: 0, justifyContent: "center", boxShadow: "0 4px 14px rgba(122,30,42,0.35)" }} onClick={() => setChatOpen(true)}>✨</button></div>)}{showBottomNav && <BottomNav view={view} setView={setView} session={session} cartCount={cartCount} />}<AISupportChat open={chatOpen} onClose={() => setChatOpen(false)} /></div>);
}

export default function JilaBazarApp() {
    return (<AppProvider><Shell /></AppProvider>);
}
