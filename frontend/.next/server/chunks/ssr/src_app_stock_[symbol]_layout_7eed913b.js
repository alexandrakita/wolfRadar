module.exports = [
"[project]/src/app/stock/[symbol]/layout.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>StockSymbolLayout,
    "generateMetadata",
    ()=>generateMetadata
]);
async function generateMetadata({ params }) {
    const { symbol } = await params;
    const sym = decodeURIComponent(symbol || "").toUpperCase();
    return {
        title: sym,
        description: `Live quote, fundamentals, analyst ratings and news for ${sym}.`
    };
}
function StockSymbolLayout({ children }) {
    return children;
}
}),
];

//# sourceMappingURL=src_app_stock_%5Bsymbol%5D_layout_7eed913b.js.map