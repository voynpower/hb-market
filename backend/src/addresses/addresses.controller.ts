import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@ApiTags('addresses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @ApiOperation({ summary: 'List current user addresses' })
  @ApiOkResponse({ description: 'Address list returned' })
  @Get()
  findMine(@CurrentUser() user: AuthUser) {
    return this.addressesService.findMine(user.sub);
  }

  @ApiOperation({ summary: 'Create a new address for the current user' })
  @ApiCreatedResponse({ description: 'Address created' })
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() body: CreateAddressDto) {
    return this.addressesService.create(user.sub, body);
  }

  @ApiOperation({ summary: 'Update an address owned by the current user' })
  @ApiOkResponse({ description: 'Address updated' })
  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: UpdateAddressDto,
  ) {
    return this.addressesService.update(user.sub, id, body);
  }

  @ApiOperation({ summary: 'Delete an address owned by the current user' })
  @ApiOkResponse({ description: 'Address deleted' })
  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.addressesService.remove(user.sub, id);
  }
}
