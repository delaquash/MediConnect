"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const connectDB = async () => {
    mongoose_1.default.connection.on("connected", () => console.log("Database Connected"));
    await mongoose_1.default.connect(process.env.MONGO_URI);
};
exports.default = connectDB;
