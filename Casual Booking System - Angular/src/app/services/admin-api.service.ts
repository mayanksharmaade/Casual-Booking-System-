import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import {
  AdminDashboard, AdminStore, AreaManagerAdmin, AuditLog, PayRate, PublicHoliday,
  Registration, SystemReport, UserAccount, Zone
} from '../models/api.models';

@Injectable({providedIn:'root'})
export class AdminApiService {
  private base=`${environment.apiUrl}/admin`;
  constructor(private http:HttpClient){}

  dashboard(){ return this.http.get<AdminDashboard>(`${this.base}/dashboard`); }
  users(){ return this.http.get<UserAccount[]>(`${this.base}/users`); }
  stores(){ return this.http.get<AdminStore[]>(`${this.base}/stores`); }
  registrations(){ return this.http.get<Registration[]>(`${this.base}/registrations`); }

  setUserActive(id:string,on:boolean){ return this.http.put<void>(`${this.base}/users/${id}/active/${on}`,{}); }
  setStoreActive(id:number,on:boolean){ return this.http.put<void>(`${this.base}/stores/${id}/active/${on}`,{}); }
  approve(id:string){ return this.http.post<void>(`${this.base}/registrations/${id}/approve`,{}); }
  reject(id:string){ return this.http.post<void>(`${this.base}/registrations/${id}/reject`,{}); }

  zones(){ return this.http.get<Zone[]>(`${this.base}/zones`); }
  createZone(name:string){ return this.http.post<Zone>(`${this.base}/zones`,{name}); }
  setZoneActive(id:number,on:boolean){ return this.http.put<void>(`${this.base}/zones/${id}/active/${on}`,{}); }

  payRates(){ return this.http.get<PayRate[]>(`${this.base}/pay-rates`); }
  setPayRate(payload:unknown){ return this.http.post<PayRate>(`${this.base}/pay-rates`,payload); }

  areaManagers(){ return this.http.get<AreaManagerAdmin[]>(`${this.base}/area-managers`); }
  assignAreaManagerZones(userId:string,zoneIds:number[]){
    return this.http.put<void>(`${this.base}/area-managers/${userId}/zones`,{zoneIds});
  }

  publicHolidays(){ return this.http.get<PublicHoliday[]>(`${this.base}/public-holidays`); }
  createPublicHoliday(holidayDate:string,name:string){
    return this.http.post<PublicHoliday>(`${this.base}/public-holidays`,{holidayDate,name});
  }

  audit(take=100){ return this.http.get<AuditLog[]>(`${this.base}/audit`,{params:{take}}); }
  systemReport(from:string,to:string){ return this.http.get<SystemReport>(`${this.base}/reports/system`,{params:{from,to}}); }
}
