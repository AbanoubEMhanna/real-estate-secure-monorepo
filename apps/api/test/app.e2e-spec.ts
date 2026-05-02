import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { v2 as cloudinary } from "cloudinary";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";

type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    displayName: string;
    roles: string[];
  };
};

type UploadSignatureResponse = {
  cloudName: string;
  apiKey: string;
  uploadUrl: string;
  maxBytes: number;
  allowedFormats: string[];
  params: {
    folder: string;
    public_id: string;
    timestamp: number;
    tags: string;
    allowed_formats: string;
    overwrite: "false";
  };
  signature: string;
};

describe("Real Estate API e2e", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let httpServer: Parameters<typeof request>[0];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true
      })
    );

    await app.init();
    prisma = app.get(PrismaService);
    httpServer = app.getHttpServer();
  });

  beforeEach(async () => {
    await prisma.propertyImage.deleteMany();
    await prisma.property.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  it("registers, rejects duplicate registration, logs in, and refreshes tokens", async () => {
    const register = await request(httpServer)
      .post("/auth/register")
      .send({
        email: "agent@example.com",
        displayName: "Demo Agent",
        password: "StrongPass123!"
      })
      .expect(201);

    const auth = register.body as AuthResponse;
    expect(auth.accessToken).toEqual(expect.any(String));
    expect(auth.refreshToken).toEqual(expect.any(String));
    expect(auth.user).toMatchObject({
      email: "agent@example.com",
      displayName: "Demo Agent",
      roles: ["AGENT"]
    });
    expect(auth).not.toHaveProperty("passwordHash");

    await request(httpServer)
      .post("/auth/register")
      .send({
        email: "agent@example.com",
        displayName: "Demo Agent",
        password: "StrongPass123!"
      })
      .expect(409);

    await request(httpServer)
      .post("/auth/login")
      .send({ email: "agent@example.com", password: "wrong-password" })
      .expect(401);

    const login = await request(httpServer)
      .post("/auth/login")
      .send({ email: "agent@example.com", password: "StrongPass123!" })
      .expect(201);

    expect((login.body as AuthResponse).accessToken).toEqual(expect.any(String));

    const refresh = await request(httpServer)
      .post("/auth/refresh")
      .send({ refreshToken: login.body.refreshToken })
      .expect(201);

    expect((refresh.body as AuthResponse).refreshToken).toEqual(expect.any(String));
    expect(refresh.body.refreshToken).not.toEqual(login.body.refreshToken);
  });

  it("validates auth DTOs and rejects unknown input fields", async () => {
    await request(httpServer)
      .post("/auth/register")
      .send({
        email: "not-an-email",
        displayName: "A",
        password: "short",
        role: "ADMIN"
      })
      .expect(400);
  });

  it("requires auth and returns constrained Cloudinary direct-upload parameters", async () => {
    await request(httpServer).post("/uploads/sign-property-image").send({ fileName: "home.png" }).expect(401);

    const auth = await registerAgent("agent@example.com");
    const response = await request(httpServer)
      .post("/uploads/sign-property-image")
      .set("authorization", `Bearer ${auth.accessToken}`)
      .send({ fileName: "My Cairo Home.png" })
      .expect(201);

    const signature = response.body as UploadSignatureResponse;
    const expectedFolder = `${process.env.CLOUDINARY_UPLOAD_FOLDER}/${auth.user.id}/properties`;

    expect(signature).toMatchObject({
      cloudName: "pompo",
      apiKey: "test-api-key",
      uploadUrl: "https://api.cloudinary.com/v1_1/pompo/image/upload",
      maxBytes: 5 * 1024 * 1024,
      allowedFormats: ["jpg", "jpeg", "png", "webp"],
      params: {
        folder: expectedFolder,
        tags: "real-estate,property",
        allowed_formats: "jpg,jpeg,png,webp",
        overwrite: "false"
      }
    });
    expect(signature.params.public_id).toMatch(/^My-Cairo-Home-[0-9a-f-]{36}$/);
    expect(signature.params.timestamp).toBeLessThanOrEqual(Math.floor(Date.now() / 1000));
    expect(signature).not.toHaveProperty("apiSecret");
    expect(signature).not.toHaveProperty("api_secret");
    expect(signature.signature).toBe(
      cloudinary.utils.api_sign_request(
        signature.params,
        process.env.CLOUDINARY_API_SECRET as string
      )
    );
  });

  it("creates a property with a signed Cloudinary image reference, publishes it, and lists it", async () => {
    const auth = await registerAgent("agent@example.com");
    const uploadSignature = await signPropertyImage(auth.accessToken, "living-room.webp");
    const publicId = `${uploadSignature.params.folder}/${uploadSignature.params.public_id}`;

    const create = await request(httpServer)
      .post("/properties")
      .set("authorization", `Bearer ${auth.accessToken}`)
      .send({
        title: "Modern apartment",
        description: "Sunny apartment near services.",
        price: 250000,
        city: "Cairo",
        address: "New Cairo",
        bedrooms: 3,
        bathrooms: 2,
        areaSqm: 145,
        images: [
          {
            publicId,
            secureUrl: `https://res.cloudinary.com/pompo/image/upload/v123/${publicId}.webp`,
            width: 1200,
            height: 800
          }
        ]
      })
      .expect(201);

    expect(create.body).toMatchObject({
      title: "Modern apartment",
      city: "Cairo",
      status: "DRAFT",
      images: [
        {
          publicId,
          secureUrl: `https://res.cloudinary.com/pompo/image/upload/v123/${publicId}.webp`,
          width: 1200,
          height: 800
        }
      ]
    });

    const hiddenDrafts = await request(httpServer).get("/properties").query({ city: "cairo" }).expect(200);
    expect(hiddenDrafts.body).toHaveLength(0);

    const publish = await request(httpServer)
      .post(`/properties/${create.body.id}/publish`)
      .set("authorization", `Bearer ${auth.accessToken}`)
      .expect(201);

    expect(publish.body.status).toBe("PUBLISHED");

    const listed = await request(httpServer).get("/properties").query({ city: "cairo" }).expect(200);
    expect(listed.body).toHaveLength(1);
    expect(listed.body[0]).toMatchObject({
      id: create.body.id,
      title: "Modern apartment",
      status: "PUBLISHED"
    });
  });

  it("rejects image references outside the authenticated user's Cloudinary folder", async () => {
    const owner = await registerAgent("owner@example.com");
    const attacker = await registerAgent("attacker@example.com");
    const attackerUpload = await signPropertyImage(attacker.accessToken, "stolen.png");
    const attackerPublicId = `${attackerUpload.params.folder}/${attackerUpload.params.public_id}`;

    await request(httpServer)
      .post("/properties")
      .set("authorization", `Bearer ${owner.accessToken}`)
      .send(validPropertyPayload(attackerPublicId))
      .expect(400);
  });

  it("rejects image references from a different Cloudinary cloud", async () => {
    const auth = await registerAgent("agent@example.com");
    const uploadSignature = await signPropertyImage(auth.accessToken, "home.jpg");
    const publicId = `${uploadSignature.params.folder}/${uploadSignature.params.public_id}`;
    const payload = validPropertyPayload(publicId);
    payload.images[0].secureUrl = `https://res.cloudinary.com/other-cloud/image/upload/v123/${publicId}.jpg`;

    await request(httpServer)
      .post("/properties")
      .set("authorization", `Bearer ${auth.accessToken}`)
      .send(payload)
      .expect(400);
  });

  it("prevents another user from publishing a property they do not own", async () => {
    const owner = await registerAgent("owner@example.com");
    const other = await registerAgent("other@example.com");
    const uploadSignature = await signPropertyImage(owner.accessToken, "home.jpg");
    const publicId = `${uploadSignature.params.folder}/${uploadSignature.params.public_id}`;

    const create = await request(httpServer)
      .post("/properties")
      .set("authorization", `Bearer ${owner.accessToken}`)
      .send(validPropertyPayload(publicId))
      .expect(201);

    await request(httpServer)
      .post(`/properties/${create.body.id}/publish`)
      .set("authorization", `Bearer ${other.accessToken}`)
      .expect(403);
  });

  async function registerAgent(email: string) {
    const response = await request(httpServer)
      .post("/auth/register")
      .send({
        email,
        displayName: "Demo Agent",
        password: "StrongPass123!"
      })
      .expect(201);

    return response.body as AuthResponse;
  }

  async function signPropertyImage(accessToken: string, fileName: string) {
    const response = await request(httpServer)
      .post("/uploads/sign-property-image")
      .set("authorization", `Bearer ${accessToken}`)
      .send({ fileName })
      .expect(201);

    return response.body as UploadSignatureResponse;
  }

  function validPropertyPayload(publicId: string) {
    return {
      title: "Modern apartment",
      description: "Sunny apartment near services.",
      price: 250000,
      city: "Cairo",
      address: "New Cairo",
      bedrooms: 3,
      bathrooms: 2,
      areaSqm: 145,
      images: [
        {
          publicId,
          secureUrl: `https://res.cloudinary.com/pompo/image/upload/v123/${publicId}.jpg`,
          width: 1200,
          height: 800
        }
      ]
    };
  }
});
