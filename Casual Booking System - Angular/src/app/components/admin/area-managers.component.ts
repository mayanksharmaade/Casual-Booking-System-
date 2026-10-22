import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AreaManagerAdmin, Zone } from '../../models/api.models';
import { AdminApiService } from '../../services/admin-api.service';

@Component({standalone:true,imports:[CommonModule,FormsModule],template:`
<h1>Area Managers</h1><p class="lead">One Area Manager can manage one Zone only.</p>
<div class="panel"><div class="person" *ngFor="let m of managers"><div><strong>{{m.name}}</strong><span>{{m.employeeId||'No Employee ID'}} · {{m.email}}</span><span>Current zone: {{m.zone ? (m.zone.city+' · '+m.zone.name) : 'Not assigned'}}</span></div><div class="form-row"><select [(ngModel)]="selections[m.userId]"><option [ngValue]="0">Select zone</option><option *ngFor="let z of zones" [ngValue]="z.id">{{z.city}} · {{z.name}}</option></select><button (click)="save(m)" [disabled]="!selections[m.userId]">Save zone</button></div></div></div>
<div class="callout good" *ngIf="message">{{message}}</div>`,styleUrls:['../page.scss']})
export class AreaManagersAdminComponent implements OnInit {managers:AreaManagerAdmin[]=[];zones:Zone[]=[];message='';selections:Record<string,number>={};constructor(private api:AdminApiService){}ngOnInit(){this.api.zones().subscribe(z=>this.zones=z.filter(x=>x.isActive));this.load();}load(){this.api.areaManagers().subscribe(rows=>{this.managers=rows;for(const m of rows)this.selections[m.userId]=m.zone?.id??0;});}save(m:AreaManagerAdmin){const zoneId=this.selections[m.userId];if(!zoneId)return;this.api.assignAreaManagerZone(m.userId,zoneId).subscribe(()=>{this.message=`Zone updated for ${m.name}.`;this.load();});}}
