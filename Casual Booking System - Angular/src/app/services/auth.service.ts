import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthResponse, Role } from '../models/api.models';

@Injectable({providedIn:'root'})
export class AuthService {
  private readonly storageKey='cbs.auth';
  private readonly state=signal<AuthResponse|null>(this.load());
  readonly session=computed(()=>this.state());
  readonly isLoggedIn=computed(()=>!!this.state()?.token);
  readonly role=computed<Role|undefined>(()=>this.state()?.role);
  constructor(private http:HttpClient, private router:Router){}
  login(email:string,password:string):Observable<AuthResponse>{ return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`,{email,password}).pipe(tap(x=>this.save(x))); }
  registerCasual(payload:unknown){ return this.http.post(`${environment.apiUrl}/auth/register/casual`,payload); }
  registerStore(payload:unknown){ return this.http.post(`${environment.apiUrl}/auth/register/store`,payload); }
  registerAreaManager(payload:unknown){ return this.http.post(`${environment.apiUrl}/auth/register/area-manager`,payload); }
  lookupZones(){ return this.http.get<{id:number,name:string,isActive:boolean}[]>(`${environment.apiUrl}/lookup/zones`); }
  lookupSkills(){ return this.http.get<{id:number,name:string}[]>(`${environment.apiUrl}/lookup/skills`); }
  token(){ return this.state()?.token ?? null; }
  logout(){ localStorage.removeItem(this.storageKey); this.state.set(null); this.router.navigate(['/login']); }
  homeForRole(role:Role|undefined=this.role()):string { if(role==='SuperAdmin') return '/admin/dashboard'; if(role==='StoreManager'||role==='AssistantManager') return '/store/dashboard'; if(role==='Casual') return '/casual/dashboard'; if(role==='AreaManager') return '/area/dashboard'; return '/login'; }
  private save(x:AuthResponse){ localStorage.setItem(this.storageKey,JSON.stringify(x)); this.state.set(x); }
  private load():AuthResponse|null { try{const raw=localStorage.getItem(this.storageKey); return raw?JSON.parse(raw):null;}catch{return null;} }
}
