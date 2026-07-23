import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AttendanceService } from './attendance.service';
import { ScanAttendanceDto } from './dto/scan-attendance.dto';
import { AttendanceHistoryQueryDto } from './dto/attendance-history-query.dto';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  // No @UseGuards on purpose — quien ficha puede ser cualquier empleado, no
  // el cajero logueado en el dispositivo (mismo espíritu que
  // public-menu.controller.ts). La identidad viene enteramente del token/
  // código de la credencial, verificado dentro del propio service.
  @Post('scan')
  scan(@Body() dto: ScanAttendanceDto) {
    return this.attendanceService.scan(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('history')
  history(@Query() query: AttendanceHistoryQueryDto) {
    return this.attendanceService.history(query);
  }
}
