import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AreaCasual } from '../../models/api.models';
import { AreaManagerApiService } from '../../services/area-manager-api.service';

@Component({
  standalone:true,
  imports:[CommonModule,FormsModule],
  template:`
    <h1>Area Casual Search</h1>
    <p class="lead">Search available Casuals in the Area Manager's assigned zone.</p>
    <div class="panel form-grid">
      <input [(ngModel)]="city" placeholder="City">
      <input [(ngModel)]="search" placeholder="Employee ID / name / phone">
      <input type="datetime-local" [(ngModel)]="start">
      <input type="datetime-local" [(ngModel)]="end">
      <button (click)="run()">Search</button>
    </div>
    <div class="cards">
      <div class="person" *ngFor="let c of rows">
        <div>
          <strong>{{c.name}}</strong><span>Employee ID {{c.employeeId||'—'}} · Profile ID {{c.casualProfileId}}</span>
          <span>{{c.city}} · {{c.currentZoneName}}</span>
          <span>Rating {{c.rating|number:'1.1-1'}} · {{c.skills.join(', ')||'No skills listed'}}</span>
        </div>
        <span class="badge" [class.good]="c.isAvailable">{{c.isAvailable?'Available':'Unavailable'}}</span>
      </div>
    </div>
  `,
  styleUrls:['../page.scss']
})
export class AreaCasualsComponent {
  rows:AreaCasual[]=[];
  city='';search='';start='';end='';
  constructor(private api:AreaManagerApiService){}
  run(){if(this.start&&this.end)this.api.searchCasuals(this.city,this.search,this.start,this.end).subscribe(x=>this.rows=x);}
}
