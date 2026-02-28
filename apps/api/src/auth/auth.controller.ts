import { Body, Controller, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  login(@Body() body: LoginDto) {
    return this.authService.login(body.email);
  }

  @Post("refresh")
  refresh() {
    return { message: "Refresh flow scaffolded. Persist refresh tokens before production use." };
  }

  @Post("logout")
  logout() {
    return { message: "Logout acknowledged." };
  }
}

