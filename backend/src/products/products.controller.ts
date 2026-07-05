import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ProductsService } from './products.service';
import { ListProductsQueryDto } from './dto/list-products-query.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PatchProductDto } from './dto/patch-product.dto';
import { PosCatalogQueryDto } from './dto/pos-catalog-query.dto';

@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  list(@Query() query: ListProductsQueryDto) {
    return this.productsService.list(query);
  }

  // Antes de ':id' a propósito: si no, ':id' intercepta esta ruta literal.
  @Get('pos-catalog')
  getPosCatalog(@Query() query: PosCatalogQueryDto) {
    return this.productsService.getPosCatalog(query.branchId);
  }

  @Get(':id')
  getDetail(@Param('id') id: string) {
    return this.productsService.getDetail(id);
  }

  @Get(':id/variants')
  getVariants(@Param('id') id: string) {
    return this.productsService.getVariantsWithDetails(id);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Patch(':id')
  patch(@Param('id') id: string, @Body() dto: PatchProductDto) {
    return this.productsService.setActive(id, dto.is_active);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.softDelete(id);
  }
}
