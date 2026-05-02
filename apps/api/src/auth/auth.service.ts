import { ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { UsersService } from "../users/users.service";
import { LoginDto, RegisterDto } from "./auth.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService
  ) {}

  async register(dto: RegisterDto) {
    const passwordHash = await argon2.hash(dto.password);
    const user = await this.usersService.create({ ...dto, passwordHash });
    const tokens = await this.issueTokens(user.id, user.email, user.roles);
    await this.usersService.setRefreshTokenHash(user.id, await argon2.hash(tokens.refreshToken));
    return { ...tokens, user: this.toPublicUser(user) };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !(await argon2.verify(user.passwordHash, dto.password))) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const tokens = await this.issueTokens(user.id, user.email, user.roles);
    await this.usersService.setRefreshTokenHash(user.id, await argon2.hash(tokens.refreshToken));
    return { ...tokens, user: this.toPublicUser(user) };
  }

  async refresh(refreshToken: string) {
    const payload = await this.jwtService.verifyAsync<{ sub: string }>(refreshToken, {
      secret: this.config.getOrThrow<string>("JWT_REFRESH_SECRET")
    });
    const user = await this.usersService.findById(payload.sub);

    if (!user?.refreshTokenHash || !(await argon2.verify(user.refreshTokenHash, refreshToken))) {
      throw new ForbiddenException("Refresh token is not valid");
    }

    const tokens = await this.issueTokens(user.id, user.email, user.roles);
    await this.usersService.setRefreshTokenHash(user.id, await argon2.hash(tokens.refreshToken));
    return { ...tokens, user: this.toPublicUser(user) };
  }

  private async issueTokens(userId: string, email: string, roles: string[]) {
    const payload = { sub: userId, email, roles };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.getOrThrow<string>("JWT_ACCESS_SECRET"),
        expiresIn: "15m"
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.getOrThrow<string>("JWT_REFRESH_SECRET"),
        expiresIn: "30d"
      })
    ]);
    return { accessToken, refreshToken };
  }

  private toPublicUser(user: { id: string; email: string; displayName: string; roles: string[] }) {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      roles: user.roles
    };
  }
}
