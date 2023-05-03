import { Component, Inject } from '@angular/core';
import { ExcelColumn, Ticket } from '../models/ticket';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-add-user-ticket',
  templateUrl: './add-user-ticket.component.html',
  styleUrls: ['./add-user-ticket.component.scss']
})
export class AddUserTicketComponent {
  element: any = {};

  constructor(
    public dialogRef: MatDialogRef<AddUserTicketComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ExcelColumn[],
  ) { }

  onNoClick(): void {
    this.dialogRef.close();
  }

  updateDateField(element: any, fieldName: string, newDateValue: string) {
    console.log('element && fieldName && newDateValue', element, fieldName, newDateValue);

    if (element && fieldName && newDateValue) {
      element[fieldName] = new Date(newDateValue).toISOString();

      console.log('element after update', element[fieldName]);

      // this.updateTable();
    }
  }
}
