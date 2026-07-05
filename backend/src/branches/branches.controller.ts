import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/types/jwt.types';
import { BranchesService } from './branches.service';
import { ListBranchesQueryDto } from './dto/list-branches-query.dto';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { PatchBranchDto } from './dto/patch-branch.dto';

// RLS real (confirmada contra la DB): SELECT es admin ve todas, no-admin solo su
// propia sucursal (id = get_user_branch_id()) — replicado en el service, no en un guard.
@UseGuards(JwtAuthGuard)
@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  list(@Query() query: ListBranchesQueryDto, @CurrentUser() user: CurrentUserPayload) {
    return this.branchesService.list(query, user);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Post()
  create(@Body() dto: CreateBranchDto) {
    return this.branchesService.create(dto);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBranchDto) {
    return this.branchesService.update(id, dto);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Patch(':id')
  patch(@Param('id') id: string, @Body() dto: PatchBranchDto) {
    return this.branchesService.setActive(id, dto.is_active);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.branchesService.remove(id);
  }
}
