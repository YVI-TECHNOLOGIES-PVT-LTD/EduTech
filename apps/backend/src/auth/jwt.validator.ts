import { JwtPayload } from './interfaces/auth.interfaces';
import { TokenService } from './tokens/token.service';

export class JwtValidator {
  private tokenService = new TokenService();

  public validateAccessToken(token: string): JwtPayload | null {
    if (!token) return null;
    return this.tokenService.verifyAccessToken(token);
  }
}
