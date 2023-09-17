import express from "express";
import { router } from "./routes/v1/";
const app = express();

app.use('/api/v1/', router);

// 応答するport
const PORT = process.env.PORT || 3000;
process.env.NOW_REGION ? (module.exports = app) : app.listen(PORT);
console.log(`Server running at ${PORT}`);
console.log(`ctrl + click :http://localhost:${PORT}/api/v1/`);