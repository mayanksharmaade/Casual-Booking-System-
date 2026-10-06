import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AreaStoreSummary } from '../../models/api.models';
import { AreaManagerApiService } from '../../services/area-manager-api.service';

@Component({
  standalone:true,
  imports:[CommonModule],
  template:`
    <h1>Store Comparison</h1>
    <p class="lead">Compare staffing coverage and budget position across assigned stores.</p>
    <div class="panel">
      <table>
        <thead><tr><th>Store</th><th>Zone</th><th>Gaps</th><th>Pending</th><th>Accepted</th><th>Labour</th><th>Budget</th><th>Status</th></tr></thead>
        <tbody>
          <tr *ngFor="let s of rows">
            <td><strong>{{s.storeCode}}</strong> {{s.storeName}}<br><small>{{s.city}}</small></td>
            <td>{{s.zoneName}}</td>
            <td><span class="badge" [class.good]="s.staffingGaps===0">{{s.staffingGaps}}</span></td>
            <td>{{s.pendingBookings}}</td>
            <td>{{s.acceptedBookings}}</td>
            <td>{{s.scheduledLabourCost|currency}}</td>
            <td>{{s.dailyBudget|currency}}</td>
            <td><span class="badge" [class.good]="s.budgetStatus==='Under Budget'||s.budgetStatus==='Exact Budget'">{{s.budgetStatus}}</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styleUrls:['../page.scss']
})
export class AreaStoresComponent implements OnInit {
  rows:AreaStoreSummary[]=[];
  constructor(private api:AreaManagerApiService){}
  ngOnInit(){this.api.stores().subscribe(x=>this.rows=x);}
}
