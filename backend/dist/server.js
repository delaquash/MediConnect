"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const database_1 = __importDefault(require("./config/database"));
const cloudinary_1 = __importDefault(require("./config/cloudinary"));
const adminRouter_1 = __importDefault(require("./routes/adminRouter"));
const doctorRoutes_1 = __importDefault(require("./routes/doctorRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
// import "./types/global"
// app config
const app = (0, express_1.default)();
const port = process.env.PORT || 5000;
// ✅ Connect to services
(0, database_1.default)();
(0, cloudinary_1.default)();
// ✅ Middlewares (CORS first, then body parsers)
app.use((0, cors_1.default)()); // Move this up
app.use(express_1.default.json()); // Parse JSON bodies
app.use(express_1.default.urlencoded({ extended: true })); // Parse URL-encoded bodies
// ✅ API endpoints
app.use("/api/v1/admin", adminRouter_1.default);
app.use("/api/v1/doctor", doctorRoutes_1.default);
app.use("/api/v1/user", userRoutes_1.default);
app.get("/", (req, res) => {
    res.send("API WORKING");
});
app.listen(port, () => console.log("Server started", port));
