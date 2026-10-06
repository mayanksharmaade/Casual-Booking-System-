import { inject } from '@angular/core'; import { CanActivateFn, Router } from '@angular/router'; import { AuthService } from '../services/auth.service';
export const authGuard:CanActivateFn=()=>{const a=inject(AuthService);return a.isLoggedIn()?true:inject(Router).createUrlTree(['/login']);};
