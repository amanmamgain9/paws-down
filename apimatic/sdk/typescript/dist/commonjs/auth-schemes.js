"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAuthSchemes = buildAuthSchemes;
const schemes_js_1 = require("./core/auth/schemes.js");
function buildAuthSchemes(options) {
    return {
        apiKeyAuth: (0, schemes_js_1.apiKeyHeaderAuth)({ name: "X-Api-Key", token: options.apiKeyAuth }),
    };
}
//# sourceMappingURL=auth-schemes.js.map