import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;

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

    this.pool = new Pool(connectionConfig);

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
    } catch (err) {
      console.error('Error verifying database schema:', err);
    }
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  async query(text: string, params?: any[]) {
    return this.pool.query(text, params);
  }

  async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }
}
