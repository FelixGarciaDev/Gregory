import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";
import { AuthModule } from "./auth/auth.module";
import { SearchModule } from "./search/search.module";
import { AdminModule } from "./admin/admin.module";
import { ProviderModule } from "./provider/provider.module";

@Module({
  imports: [AuthModule, SearchModule, AdminModule, ProviderModule],
  controllers: [HealthController]
})
export class AppModule {}

