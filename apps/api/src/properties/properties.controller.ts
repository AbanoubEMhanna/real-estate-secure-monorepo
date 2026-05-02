import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { CurrentUser, RequestUser } from "../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CreatePropertyDto } from "./property.dto";
import { PropertiesService } from "./properties.service";

@Controller("properties")
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get()
  list(@Query("city") city?: string) {
    return this.propertiesService.list(city);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreatePropertyDto) {
    return this.propertiesService.create(user.sub, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(":id/publish")
  publish(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return this.propertiesService.publish(user.sub, id);
  }
}
