import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    // For now, return a mock user (MVP - no auth implemented yet)
    // In production, this would come from JWT payload
    return (
      request.user || { id: "instructor:1", email: "instructor@xpertia.com" }
    );
  },
);
