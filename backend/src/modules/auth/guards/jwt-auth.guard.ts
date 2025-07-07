import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // Add your custom authentication logic here
    // for example, call super.logIn(request) to establish a session.
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    // You can throw an exception based on either "info" or "err" arguments
    if (err || !user) {
      this.throwUnauthorizedException(info);
    }
    return user; // This will be assigned to req.user
  }

  private throwUnauthorizedException(info: any): void {
    let message = 'نشست شما معتبر نمی‌باشد. لطفاً مجددا وارد شوید.'; // Default message
    if (info && info.name === 'TokenExpiredError') {
      message = 'نشست شما منقضی شده است. لطفاً مجددا وارد شوید.';
    } else if (info && info.name === 'JsonWebTokenError') {
      message = 'توکن نامعتبر است. لطفاً مجددا وارد شوید.';
    }
    // Add more specific messages based on info or err if needed
    throw new UnauthorizedException(message);
  }
}
