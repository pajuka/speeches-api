import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { StatisticsModule } from './statistics/statistics.module';

@Module({
  imports: [
    StatisticsModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'assets')
    })
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
