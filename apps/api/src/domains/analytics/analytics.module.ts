import { Module } from "@nestjs/common";
import { AnalyticsService } from "./analytics.service";
import {
  AnalyticsController,
  StudentDetailController,
} from "./analytics.controller";
import { DashboardStatsController } from "./dashboard-stats.controller";
import { DashboardStatsService } from "./dashboard-stats.service";
import { SurrealDbModule } from "src/core/database";

@Module({
  imports: [SurrealDbModule],
  providers: [AnalyticsService, DashboardStatsService],
  controllers: [
    AnalyticsController,
    StudentDetailController,
    DashboardStatsController,
  ],
  exports: [AnalyticsService, DashboardStatsService],
})
export class AnalyticsModule {}
