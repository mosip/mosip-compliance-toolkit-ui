import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DataService } from 'src/app/core/services/data-service';
import { Subscription } from "rxjs";

// export interface PeriodicElement {
//   name: string;
//   type: string;
//   weight: number;
//   symbol: string;
// }

// const ELEMENT_DATA: PeriodicElement[] = [
//   {name: 'Hydrogen', type: 'SDK', weight: 1.0079, symbol: 'H'},
//   {name: 'Hydrogen', type: 'SDK', weight: 1.0079, symbol: 'H'},
// ];

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  dataSource: any;
  displayedColumns: string[] = [
    'name',
    'projectType',
    'collectionsCount',
    'crDate',
    'lastRunDt',
    'lastRunStatus'
  ];
  subscriptions: Subscription[] = [];
  constructor(
    private route: ActivatedRoute,
    private dataService: DataService,
  ) { }

  async ngOnInit() {
        await this.getProjects();    
    // await this.dataService.getProjects().subscribe((response) => {
    //   console.log(response);
    //   this.dataSource = response["response"]["projects"];
    // });
  }

  async getProjects() {
    return new Promise((resolve, reject) => {
      this.subscriptions.push(  
        this.dataService.getProjects().subscribe(
          (response: any) => {
            console.log(response);
            this.dataSource = response["response"]["projects"];
            resolve(true);
          }
        )
      )
    });
  }

  addProject() {

  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }
}
