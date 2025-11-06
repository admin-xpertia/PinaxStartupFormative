import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // MVP: Allow all requests without authentication
    // In production, implement JWT validation here
    const request = context.switchToHttp().getRequest();

    // Attach a mock user for MVP
    request.user = {
      id: "instructor:1",
      email: "instructor@xpertia.com",
    };

    return true;
  }
}
