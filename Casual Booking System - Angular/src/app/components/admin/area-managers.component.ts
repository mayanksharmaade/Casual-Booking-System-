import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AreaManagerAdmin, Zone } from '../../models/api.models';
import { AdminApiService } from '../../services/admin-api.service';

@Component({
  standalone:true,
  imports:[CommonModule,FormsModule],
  template:`
    <h1>Area Managers</h1>
    <p class="lead">Assign approved Area Managers to one or more operational zones.</p>
    <div class="panel" *ngFor="let m of managers">
      <div class="person">
        <div>
          <strong>{{m.name}}</strong>
          <span>{{m.email}}</span>
          <span>Current zones: {{zoneNames(m) || 'None'}}</span>
        </div>
        <div class="zone-picker">
          <label *ngFor="let z of zones">
            <input type="checkbox" [checked]="selected(m,z.id)" (change)="toggle(m,z.id,$event)"> {{z.name}}
          </label>
          <button (click)="save(m)">Save zones</button>
        </div>
      </div>
    </div>
    <div class="callout good" *ngIf="message">{{message}}</div>
  `,
  styleUrls:['../page.scss']
})
export class AreaManagersAdminComponent implements OnInit {
  managers:AreaManagerAdmin[]=[];
  zones:Zone[]=[];
  message='';
  selections=new Map<string,Set<number>>();

  constructor(private api:AdminApiService){}

  ngOnInit(){
    this.api.zones().subscribe(z=>this.zones=z.filter(x=>x.isActive));
    this.load();
  }

  load(){
    this.api.areaManagers().subscribe(rows=>{
      this.managers=rows;
      rows.forEach(m=>this.selections.set(m.userId,new Set(m.zones.map(z=>z.id))));
    });
  }

  zoneNames(m:AreaManagerAdmin){ return m.zones.map(z=>z.name).join(', '); }
  selected(m:AreaManagerAdmin,id:number){ return this.selections.get(m.userId)?.has(id) ?? false; }

  toggle(m:AreaManagerAdmin,id:number,event:Event){
    const set=this.selections.get(m.userId) ?? new Set<number>();
    const checked=(event.target as HTMLInputElement).checked;
    checked ? set.add(id) : set.delete(id);
    this.selections.set(m.userId,set);
  }

  save(m:AreaManagerAdmin){
    const ids=[...(this.selections.get(m.userId) ?? new Set<number>())];
    this.api.assignAreaManagerZones(m.userId,ids).subscribe(()=>{
      this.message=`Zone assignments updated for ${m.name}.`;
      this.load();
    });
  }
}
