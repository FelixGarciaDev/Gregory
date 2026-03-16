import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { scryptSync, timingSafeEqual } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email }
    });

    if (!user || !user.isActive || !this.verifyPassword(password, user.passwordHash)) {
      throw new UnauthorizedException("Invalid credentials.");
    }

    const payload = { sub: user.id, email: user.email, role: user.role };

    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign({ ...payload, type: "refresh" }, { expiresIn: "7d" }),
      role: user.role,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName
      }
    };
  }

  private verifyPassword(password: string, passwordHash: string) {
    const [algorithm, salt, storedHash] = passwordHash.split(":");

    if (algorithm !== "scrypt" || !salt || !storedHash) {
      return false;
    }

    const derivedKey = scryptSync(password, salt, 64);
    const storedBuffer = Buffer.from(storedHash, "hex");

    if (derivedKey.length !== storedBuffer.length) {
      return false;
    }

    return timingSafeEqual(derivedKey, storedBuffer);
  }
}
