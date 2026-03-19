import { Controller, Get, Param, Query } from "@nestjs/common";
import { Public } from "../authz/decorators/public.decorator";
import { SearchService } from "./search.service";
import { SearchQueryDto } from "./dto/search-query.dto";

@Public()
@Controller()
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get("tests/search")
  searchTests(@Query() query: SearchQueryDto) {
    return this.searchService.searchOffers(query);
  }

  @Get("providers/search")
  searchProviders(@Query() query: SearchQueryDto) {
    return this.searchService.searchProviders(query);
  }

  @Get("providers/:providerId")
  getProvider(@Param("providerId") providerId: string) {
    return this.searchService.getProvider(providerId);
  }

  @Get("providers/:providerId/offers")
  getProviderOffers(@Param("providerId") providerId: string) {
    return this.searchService.getProviderOffers(providerId);
  }

  @Get("offers/:offerId")
  getOffer(@Param("offerId") offerId: string) {
    return this.searchService.getOffer(offerId);
  }
}
