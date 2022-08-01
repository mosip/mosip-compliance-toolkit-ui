import { Component, Inject, OnInit, Injectable } from '@angular/core';
import { DataService } from '../../services/data-service';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog,
} from '@angular/material/dialog';

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
    private dataService: DataService
  ) {
    dialogRef.disableClose = true;
  }
  public closeMe() {
    this.dialogRef.close();
  }

  ngOnInit(): void {
    this.input = this.data;
  }
}
