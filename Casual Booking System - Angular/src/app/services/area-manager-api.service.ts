import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import {
  AreaCasual, AreaCasualSearchFilters, AreaManagerDashboard, AreaReport, AreaStoreSummary,
  AreaTransferCandidate, Booking, CasualTransfer, AreaWorkforceAbsence
} from '../models/api.models';

@Injectable({providedIn:'root'})
export class AreaManagerApiService {
  private base=`${environment.apiUrl}/area-manager`;
  constructor(private http:HttpClient){}

  dashboard(date:string,period:'day'|'week'='day'){
    return this.http.get<AreaManagerDashboard>(`${this.base}/dashboard`,{params:{date,period}});
  }

  stores(date:string,period:'day'|'week'|'month'='day'){
    return this.http.get<AreaStoreSummary[]>(`${this.base}/stores`,{params:{date,period}});
  }

  casualFilters(){ return this.http.get<AreaCasualSearchFilters>(`${this.base}/casuals/filters`); }

  searchCasuals(city:string,search:string,start:string,end:string,zoneId:number|null,skillIds:number[]){
    let params=new HttpParams().set('city',city).set('search',search).set('start',start).set('end',end);
    if(zoneId!=null) params=params.set('zoneId',zoneId);
    for(const id of skillIds) params=params.append('skillIds',id);
    return this.http.get<AreaCasual[]>(`${this.base}/casuals/search`,{params});
  }

  transferCandidates(){ return this.http.get<AreaTransferCandidate[]>(`${this.base}/casuals/transfer-candidates`); }

  workforceAbsences(from:string,to:string){
    return this.http.get<AreaWorkforceAbsence[]>(`${this.base}/workforce/absences`,{params:{from,to}});
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
