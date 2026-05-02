import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import { CreatePropertyDto, PropertyImageDto } from "./property.dto";

@Injectable()
export class PropertiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService
  ) {}

  create(ownerId: string, dto: CreatePropertyDto) {
    dto.images.forEach((image) => this.validateImageOwnership(ownerId, image));

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

  private validateImageOwnership(ownerId: string, image: PropertyImageDto) {
    const rootFolder = this.config.get<string>("CLOUDINARY_UPLOAD_FOLDER", "real-estate");
    const expectedPublicIdPrefix = `${rootFolder}/${ownerId}/properties/`;
    const cloudName = this.config.getOrThrow<string>("CLOUDINARY_CLOUD_NAME");
    const expectedUrlPrefix = `https://res.cloudinary.com/${cloudName}/image/upload/`;

    if (!image.publicId.startsWith(expectedPublicIdPrefix)) {
      throw new BadRequestException("Image publicId is outside the authenticated user's upload folder");
    }

    if (!image.secureUrl.startsWith(expectedUrlPrefix)) {
      throw new BadRequestException("Image secureUrl is not from the configured Cloudinary cloud");
    }
  }
}
