import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export type RequestUser = {
  sub: string;
  email: string;
  roles: string[];
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): RequestUser => {
    return context.switchToHttp().getRequest<{ user: RequestUser }>().user;
  }
);
