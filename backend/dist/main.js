"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const dns = require("dns");
if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
}
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: '*',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
    });
    const port = process.env.PORT || 3001;
    await app.listen(port);
    console.log(`LSBook Store NestJS backend server running at http://localhost:${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map