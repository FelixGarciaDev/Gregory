import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { RequestActor } from "../types/request-actor";

export const CurrentActor = createParamDecorator(
  (_data: unknown, context: ExecutionContext): RequestActor => {
    const request = context.switchToHttp().getRequest<{ actor: RequestActor }>();
    return request.actor;
  }
);
