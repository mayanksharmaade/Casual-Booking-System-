import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import {
  Booking, CasualSearch, CasualSearchFilters, Employee, EmployeeWorkPattern, RosterEntry, StaffingGap, StoreDashboard, StoreReport
} from '../models/api.models';

@Injectable({providedIn:'root'})
export class StoreApiService {
  private base=`${environment.apiUrl}/store`;
  constructor(private http:HttpClient){}

  dashboard(date?:string){
    const params=date?new HttpParams().set('date',date):undefined;
    return this.http.get<StoreDashboard>(`${this.base}/dashboard`,{params});
  }

  employees(){ return this.http.get<Employee[]>(`${this.base}/employees`); }
  createEmployee(payload:unknown){ return this.http.post<Employee>(`${this.base}/employees`,payload); }
  createAssistantManager(payload:unknown){ return this.http.post<void>(`${this.base}/assistant-managers`,payload); }

  roster(from:string,to:string){ return this.http.get<RosterEntry[]>(`${this.base}/roster`,{params:{from,to}}); }
  createRoster(payload:unknown){ return this.http.post<RosterEntry>(`${this.base}/roster`,payload); }
  createRosterRange(payload:unknown){ return this.http.post<RosterEntry[]>(`${this.base}/roster/range`,payload); }
  updateRoster(id:number,payload:unknown){ return this.http.put<RosterEntry>(`${this.base}/roster/${id}`,payload); }

  workPattern(employeeId:number){ return this.http.get<EmployeeWorkPattern[]>(`${this.base}/employees/${employeeId}/work-pattern`); }
  setWorkPattern(employeeId:number,payload:unknown){ return this.http.put<EmployeeWorkPattern[]>(`${this.base}/employees/${employeeId}/work-pattern`,payload); }

  recordAbsence(payload:unknown){ return this.http.post(`${this.base}/absences`,payload); }
  gaps(from:string,to:string){ return this.http.get<StaffingGap[]>(`${this.base}/staffing-gaps`,{params:{from,to}}); }

  casualFilters(){
    return this.http.get<CasualSearchFilters>(`${this.base}/casuals/filters`);
  }

  searchCasuals(city:string,search:string,start:string,end:string,zoneId?:number|null,skillIds:number[]=[]){
    let params=new HttpParams()
      .set('city',city||'')
      .set('search',search||'')
      .set('start',start)
      .set('end',end);

    if(zoneId) params=params.set('zoneId',zoneId);
    for(const id of skillIds) params=params.append('skillIds',id);

    return this.http.get<CasualSearch[]>(`${this.base}/casuals/search`,{params});
  }

  bookings(){ return this.http.get<Booking[]>(`${this.base}/bookings`); }
  createBooking(payload:unknown){ return this.http.post<Booking>(`${this.base}/bookings`,payload); }
  cancelBooking(id:number,reason:string){ return this.http.post<void>(`${this.base}/bookings/${id}/cancel`,{reason}); }
  completeBooking(id:number){ return this.http.post<void>(`${this.base}/bookings/${id}/complete`,{}); }
  rateBooking(id:number,score:number,comment?:string){
    return this.http.post<void>(`${this.base}/bookings/${id}/rating`,{score,comment});
  }

  setBudget(date:string,amount:number){ return this.http.put<void>(`${this.base}/budget`,{date,amount}); }
  report(from:string,to:string){ return this.http.get<StoreReport>(`${this.base}/reports`,{params:{from,to}}); }
}
