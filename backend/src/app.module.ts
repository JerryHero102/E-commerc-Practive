import { Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { AppController } from './app.controller';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [DatabaseService],
})
export class AppModule {}
