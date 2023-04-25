import { Component, Inject, OnInit, Injectable } from '@angular/core';
import { DataService } from '../../services/data-service';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog,
} from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { UserProfileService } from '../../services/user-profile.service';

@Component({
  selector: 'app-dialog',
  templateUrl: './dialog.component.html',
  styleUrls: ['./dialog.component.css'],
})
export class DialogComponent implements OnInit {
  input: any;
  panelOpenState = false;
  constructor(
    private dialogRef: MatDialogRef<DialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dataService: DataService,
    private translate: TranslateService,
    private userProfileService: UserProfileService
  ) {
    dialogRef.disableClose = true;
    
  }
  textDirection: any = this.userProfileService.getTextDirection();
  public closeMe() {
    this.dialogRef.close();
  }

  ngOnInit(): void {
    this.input = this.data;
    this.translate.use(this.userProfileService.getUserPreferredLanguage());
  }
}
