import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReportsService } from './reports.service';
import { ReportQueryDto } from './dto/report-query.dto';
import { CashierReportQueryDto } from './dto/cashier-report-query.dto';

@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales')
  getSales(@Query() query: ReportQueryDto) {
    return this.reportsService.getSales(query);
  }

  @Get('daily')
  getDaily(@Query() query: ReportQueryDto) {
    return this.reportsService.getDaily(query);
  }

  @Get('top-products')
  getTopProducts(@Query() query: ReportQueryDto) {
    return this.reportsService.getTopProducts(query);
  }

  @Get('cashiers')
  getCashiers(@Query() query: CashierReportQueryDto) {
    return this.reportsService.getCashiers(query);
  }
}
