import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { PromotionsService } from './promotions.service';
import { ListPromotionsQueryDto } from './dto/list-promotions-query.dto';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { PatchPromotionDto } from './dto/patch-promotion.dto';

// Real RLS (confirmed against the DB): SELECT is "any authenticated user" (USING true)
// on promotions and promotion_rules — the POS needs to read active promos without being admin.
// INSERT/UPDATE/DELETE are admin-only.
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
