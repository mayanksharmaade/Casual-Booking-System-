import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import {
  AppNotification, Availability, Booking, CasualDashboard, CasualProfile, CasualReport
} from '../models/api.models';

@Injectable({providedIn:'root'})
export class CasualApiService {
  private base=`${environment.apiUrl}/casual`;
  constructor(private http:HttpClient){}

  dashboard(){ return this.http.get<CasualDashboard>(`${this.base}/dashboard`); }
  profile(){ return this.http.get<CasualProfile>(`${this.base}/profile`); }
  updateProfile(payload:unknown){ return this.http.put<CasualProfile>(`${this.base}/profile`,payload); }

  skills(){ return this.http.get<{id:number,name:string}[]>(`${this.base}/skills`); }
  setSkills(skillIds:number[]){ return this.http.put<void>(`${this.base}/skills`,{skillIds}); }

  availability(){ return this.http.get<Availability[]>(`${this.base}/availability`); }
  addAvailability(payload:unknown){ return this.http.post<Availability>(`${this.base}/availability`,payload); }
  deleteAvailability(id:number){ return this.http.delete<void>(`${this.base}/availability/${id}`); }

  bookings(){ return this.http.get<Booking[]>(`${this.base}/bookings`); }
  accept(id:number){ return this.http.post<void>(`${this.base}/bookings/${id}/accept`,{}); }
  decline(id:number,reason?:string){ return this.http.post<void>(`${this.base}/bookings/${id}/decline`,{reason}); }
  cancel(id:number,reason:string){ return this.http.post<void>(`${this.base}/bookings/${id}/cancel`,{reason}); }

  notifications(){ return this.http.get<AppNotification[]>(`${this.base}/notifications`); }
  readNotification(id:number){ return this.http.post<void>(`${this.base}/notifications/${id}/read`,{}); }

  report(from:string,to:string){ return this.http.get<CasualReport>(`${this.base}/reports`,{params:{from,to}}); }
}
