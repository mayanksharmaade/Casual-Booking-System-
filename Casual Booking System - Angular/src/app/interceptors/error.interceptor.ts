import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http'; import { catchError, throwError } from 'rxjs';
export const errorInterceptor:HttpInterceptorFn=(req,next)=>next(req).pipe(catchError((e:HttpErrorResponse)=>{const message=e.error?.message||e.message||'Request failed';return throwError(()=>new Error(message));}));
