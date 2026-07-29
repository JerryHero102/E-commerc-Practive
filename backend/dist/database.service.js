"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
const common_1 = require("@nestjs/common");
const pg_1 = require("pg");
let DatabaseService = class DatabaseService {
    async onModuleInit() {
        const connectionConfig = process.env.DATABASE_URL
            ? { connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false } }
            : {
                user: process.env.DB_USER || 'postgres',
                host: process.env.DB_HOST || 'localhost',
                database: process.env.DB_NAME || 'lsbookstore',
                password: process.env.DB_PASSWORD || undefined,
                port: parseInt(process.env.DB_PORT || '5432'),
            };
        this.pool = new pg_1.Pool(connectionConfig);
        try {
            await this.pool.query(`
        CREATE TABLE IF NOT EXISTS BangTamOTP (
          id SERIAL PRIMARY KEY,
          nguoiDungID INT NOT NULL,
          email VARCHAR(150) NOT NULL,
          otp VARCHAR(10) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '15 minutes'),
          CONSTRAINT fk_otp_nguoidung FOREIGN KEY (nguoiDungID) REFERENCES NguoiDung(nguoiDungID) ON DELETE CASCADE
        );
        ALTER TABLE DonHang ADD COLUMN IF NOT EXISTS email VARCHAR(150);

        CREATE TABLE IF NOT EXISTS TinNhanCSKH (
          id SERIAL PRIMARY KEY,
          sessionID VARCHAR(100) NOT NULL,
          senderType VARCHAR(20) NOT NULL,
          senderName VARCHAR(100) NOT NULL,
          message TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          isRead BOOLEAN DEFAULT FALSE
        );
      `);
            console.log('Database schema verified & TinNhanCSKH table ready.');
        }
        catch (err) {
            console.error('Error verifying database schema:', err);
        }
    }
    async onModuleDestroy() {
        await this.pool.end();
    }
    async query(text, params) {
        return this.pool.query(text, params);
    }
    async getClient() {
        return this.pool.connect();
    }
};
exports.DatabaseService = DatabaseService;
exports.DatabaseService = DatabaseService = __decorate([
    (0, common_1.Injectable)()
], DatabaseService);
//# sourceMappingURL=database.service.js.map