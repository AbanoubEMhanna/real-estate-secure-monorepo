import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreatePropertyDto } from "./property.dto";

@Injectable()
export class PropertiesService {
  constructor(private readonly prisma: PrismaService) {}

  create(ownerId: string, dto: CreatePropertyDto) {
    return this.prisma.property.create({
      data: {
        ownerId,
        title: dto.title,
        description: dto.description,
        price: dto.price,
        city: dto.city,
        address: dto.address,
        bedrooms: dto.bedrooms,
        bathrooms: dto.bathrooms,
        areaSqm: dto.areaSqm,
        images: {
          create: dto.images.map((image) => ({
            publicId: image.publicId,
            secureUrl: image.secureUrl,
            width: image.width,
            height: image.height
          }))
        }
      },
      include: { images: true }
    });
  }

  list(city?: string) {
    return this.prisma.property.findMany({
      where: { status: "PUBLISHED", ...(city ? { city: { equals: city, mode: "insensitive" } } : {}) },
      include: { images: true },
      orderBy: { createdAt: "desc" },
      take: 50
    });
  }

  async publish(ownerId: string, propertyId: string) {
    const property = await this.prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) {
      throw new NotFoundException("Property was not found");
    }
    if (property.ownerId !== ownerId) {
      throw new ForbiddenException("You can publish only your own properties");
    }

    return this.prisma.property.update({
      where: { id: propertyId },
      data: { status: "PUBLISHED" },
      include: { images: true }
    });
  }
}
