import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PublicHoliday } from '../../models/api.models';
import { AdminApiService } from '../../services/admin-api.service';

@Component({
  standalone:true,
  imports:[CommonModule,FormsModule],
  template:`
    <h1>Public Holidays</h1>
    <p class="lead">Maintain public-holiday dates used to flag rosters and booking dashboards. No external calendar API is required.</p>
    <div class="panel form-row">
      <input type="date" [(ngModel)]="date">
      <input [(ngModel)]="name" placeholder="Holiday name">
      <button (click)="add()" [disabled]="!date||!name.trim()">Add holiday</button>
    </div>
    <div class="panel">
      <table>
        <thead><tr><th>Date</th><th>Name</th><th>Status</th></tr></thead>
        <tbody>
          <tr *ngFor="let h of rows">
            <td>{{h.holidayDate|date:'mediumDate'}}</td>
            <td>{{h.name}}</td>
            <td><span class="badge good" *ngIf="h.isActive">Active</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styleUrls:['../page.scss']
})
export class PublicHolidaysComponent implements OnInit {
  rows:PublicHoliday[]=[];
  date='';
  name='';
  constructor(private api:AdminApiService){}
  ngOnInit(){this.load();}
  load(){this.api.publicHolidays().subscribe(x=>this.rows=x);}
  add(){
    this.api.createPublicHoliday(this.date,this.name).subscribe(()=>{
      this.date=''; this.name=''; this.load();
    });
  }
}
