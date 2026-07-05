import { Body, Controller, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { VariantTypesService } from './variant-types.service';
import { ListVariantTypesQueryDto } from './dto/list-variant-types-query.dto';
import { CreateVariantTypeDto } from './dto/create-variant-type.dto';
import { UpdateVariantTypeDto } from './dto/update-variant-type.dto';
import { PatchVariantTypeDto } from './dto/patch-variant-type.dto';

// RLS real (confirmada contra la DB): SELECT es público para cualquier autenticado
// (variant_types_select_all), INSERT/UPDATE/DELETE solo admin.
@UseGuards(JwtAuthGuard)
@Controller('variant-types')
export class VariantTypesController {
  constructor(private readonly variantTypesService: VariantTypesService) {}

  @Get()
  list(@Query() query: ListVariantTypesQueryDto) {
    return this.variantTypesService.list(query);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Post()
  create(@Body() dto: CreateVariantTypeDto) {
    return this.variantTypesService.create(dto);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateVariantTypeDto) {
    return this.variantTypesService.update(id, dto);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Patch(':id')
  patch(@Param('id') id: string, @Body() dto: PatchVariantTypeDto) {
    return this.variantTypesService.setActive(id, dto.is_active);
  }
}
