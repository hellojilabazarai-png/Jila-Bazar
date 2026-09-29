
export const memStorage = (() => {
    // Real browser localStorage use karta hai, taake data page refresh/close ke
    // baad bhi save rahe. Agar localStorage available na ho (bahut purana browser,
    // private mode ki koi extreme setting) to in-memory pe fallback karta hai.
    try {
        const testKey = "__jb_test__";
        window.localStorage.setItem(testKey, "1");
        window.localStorage.removeItem(testKey);
        return window.localStorage;
    }
    catch {
        let store = {};
        return {
            getItem: (k) => (k in store ? store[k] : null),
            setItem: (k, v) => { store[k] = String(v); },
            removeItem: (k) => { delete store[k]; },
        };
    }
})();
