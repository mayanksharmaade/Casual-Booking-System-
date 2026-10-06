import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AreaStoreSummary, CasualTransfer } from '../../models/api.models';
import { AreaManagerApiService } from '../../services/area-manager-api.service';

@Component({
  standalone:true,
  imports:[CommonModule,FormsModule],
  template:`
    <h1>Casual Zone Transfers</h1>
    <p class="lead">Move Casuals between the Area Manager's assigned zones while retaining transfer history.</p>
    <div class="panel form-grid">
      <input type="number" [(ngModel)]="casualProfileId" placeholder="Casual profile ID">
      <select [(ngModel)]="toZoneId">
        <option [ngValue]="0">Destination zone</option>
        <option *ngFor="let z of zones" [ngValue]="z.id">{{z.name}}</option>
      </select>
      <input [(ngModel)]="reason" placeholder="Transfer reason">
      <button (click)="transfer()">Transfer</button>
    </div>
    <div class="callout good" *ngIf="message">{{message}}</div>
    <div class="panel">
      <table>
        <thead><tr><th>When</th><th>Casual</th><th>From</th><th>To</th><th>Reason</th></tr></thead>
        <tbody>
          <tr *ngFor="let t of rows">
            <td>{{t.transferredAtUtc|date:'short'}}</td>
            <td>{{t.casualName}}</td>
            <td>{{t.fromZoneName||'Unassigned'}}</td>
            <td>{{t.toZoneName}}</td>
            <td>{{t.reason}}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styleUrls:['../page.scss']
})
export class AreaTransfersComponent implements OnInit {
  rows:CasualTransfer[]=[];
  zones:{id:number,name:string}[]=[];
  casualProfileId=0;
  toZoneId=0;
  reason='';
  message='';

  constructor(private api:AreaManagerApiService){}
  ngOnInit(){
    this.api.stores().subscribe(stores=>{
      const map=new Map<number,string>();
      stores.forEach(s=>map.set(s.zoneId,s.zoneName));
      this.zones=[...map.entries()].map(([id,name])=>({id,name}));
    });
    this.load();
  }
  load(){this.api.transfers().subscribe(x=>this.rows=x);}
  transfer(){
    this.api.transferCasual({casualProfileId:this.casualProfileId,toZoneId:this.toZoneId,reason:this.reason}).subscribe(x=>{
      this.message=`${x.casualName} transferred to ${x.toZoneName}.`;
      this.reason=''; this.load();
    });
  }
}
