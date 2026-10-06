import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import {
  AreaCasual, AreaManagerDashboard, AreaReport, AreaStoreSummary, Booking,
  CasualTransfer, StaffingGap
} from '../models/api.models';

@Injectable({providedIn:'root'})
export class AreaManagerApiService {
  private base=`${environment.apiUrl}/area-manager`;
  constructor(private http:HttpClient){}

  dashboard(date?:string){
    const params=date?{date}:undefined;
    return this.http.get<AreaManagerDashboard>(`${this.base}/dashboard`,{params});
  }

  stores(date?:string){
    const params=date?{date}:undefined;
    return this.http.get<AreaStoreSummary[]>(`${this.base}/stores`,{params});
  }

  gaps(from:string,to:string){
    return this.http.get<StaffingGap[]>(`${this.base}/staffing-gaps`,{params:{from,to}});
  }

  searchCasuals(city:string,search:string,start:string,end:string){
    return this.http.get<AreaCasual[]>(`${this.base}/casuals/search`,{params:{city,search,start,end}});
  }

  bookings(){ return this.http.get<Booking[]>(`${this.base}/bookings`); }

  cancelBooking(id:number,reason:string){
    return this.http.post<void>(`${this.base}/bookings/${id}/cancel`,{reason});
  }

  createOverrideBooking(payload:unknown){
    return this.http.post<Booking>(`${this.base}/bookings/override`,payload);
  }

  transferCasual(payload:unknown){
    return this.http.post<CasualTransfer>(`${this.base}/casuals/transfer`,payload);
  }

  transfers(){ return this.http.get<CasualTransfer[]>(`${this.base}/casuals/transfers`); }

  report(from:string,to:string){
    return this.http.get<AreaReport>(`${this.base}/reports`,{params:{from,to}});
  }
}
