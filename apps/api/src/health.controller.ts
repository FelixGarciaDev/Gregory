import { Controller, Get } from "@nestjs/common";
import { Public } from "./authz/decorators/public.decorator";

@Public()
@Controller()
export class HealthController {
  @Get("health")
  getHealth() {
    return { status: "ok" };
  }
}
