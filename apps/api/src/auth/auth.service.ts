import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  login(email: string) {
    const role = email.includes("admin") ? "admin" : "provider_user";
    const payload = { sub: email, role };

    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign({ ...payload, type: "refresh" }, { expiresIn: "7d" }),
      role
    };
  }
}

