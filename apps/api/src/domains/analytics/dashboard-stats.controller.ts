import { Controller, Get, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../core/auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../core/auth/decorators/current-user.decorator";
import { DashboardStatsService } from "./dashboard-stats.service";

@Controller("dashboard")
@UseGuards(JwtAuthGuard)
export class DashboardStatsController {
  constructor(private readonly dashboardStatsService: DashboardStatsService) {}

  @Get("stats")
  async getStats(@CurrentUser() user: any) {
    return this.dashboardStatsService.getStats(user.id);
  }
}
