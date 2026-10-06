import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StaffingGap, employeeTypeLabel } from '../../models/api.models';
import { AreaManagerApiService } from '../../services/area-manager-api.service';

@Component({
  standalone:true,
  imports:[CommonModule,FormsModule],
  template:`
    <h1>Area Staffing Gaps</h1>
    <p class="lead">FT, PT and Volunteer absence/unavailability that overlaps rostered work is surfaced here.</p>
    <div class="panel form-row">
      <input type="date" [(ngModel)]="from">
      <input type="date" [(ngModel)]="to">
      <button (click)="run()">Refresh</button>
    </div>
    <div class="panel">
      <table>
        <thead><tr><th>Store / Employee</th><th>Type</th><th>Gap</th><th>Reason</th></tr></thead>
        <tbody>
          <tr *ngFor="let g of rows">
            <td>{{g.employeeName}}</td>
            <td>{{employeeLabel(g.employeeType)}}</td>
            <td>{{g.startDateTime|date:'short'}} → {{g.endDateTime|date:'shortTime'}}</td>
            <td>{{g.reason}}</td>
          </tr>
        </tbody>
      </table>
      <div class="empty" *ngIf="!rows.length">No staffing gaps in this period.</div>
    </div>
  `,
  styleUrls:['../page.scss']
})
export class AreaGapsComponent {
  rows:StaffingGap[]=[];
  employeeLabel=employeeTypeLabel;
  from=this.day(0);
  to=this.day(7);
  constructor(private api:AreaManagerApiService){this.run();}
  run(){this.api.gaps(`${this.from}T00:00:00`,`${this.to}T23:59:59`).subscribe(x=>this.rows=x);}
  day(add:number){const d=new Date();d.setDate(d.getDate()+add);return d.toISOString().slice(0,10);}
}
