import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { PromotionsService } from './promotions.service';
import { ListPromotionsQueryDto } from './dto/list-promotions-query.dto';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { PatchPromotionDto } from './dto/patch-promotion.dto';

// RLS real (confirmada contra la DB): SELECT es "cualquier autenticado" (USING true)
// en promotions y promotion_rules — el POS necesita leer promos activas sin ser admin.
// INSERT/UPDATE/DELETE son admin-only.
@UseGuards(JwtAuthGuard)
@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Get()
  list(@Query() query: ListPromotionsQueryDto) {
    return this.promotionsService.list(query);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.promotionsService.getById(id);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Post()
  create(@Body() dto: CreatePromotionDto) {
    return this.promotionsService.create(dto);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePromotionDto) {
    return this.promotionsService.update(id, dto);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Patch(':id')
  patch(@Param('id') id: string, @Body() dto: PatchPromotionDto) {
    return this.promotionsService.patch(id, dto);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.promotionsService.remove(id);
  }
}
