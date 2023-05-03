import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { Firestore, collectionData, collection, addDoc, CollectionReference, DocumentData, updateDoc, doc, deleteDoc, getDoc, query, where, getDocs, setDoc } from '@angular/fire/firestore';
import { BehaviorSubject, Observable, Subject, combineLatest, debounceTime, distinctUntilChanged, filter, map, tap, withLatestFrom } from 'rxjs';
import { ExcelSheet, Ticket } from '../models/ticket';
import { MatDialog } from '@angular/material/dialog';
import { AddUserTicketComponent } from '../add-user-ticket/add-user-ticket.component';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';

interface TicketChangeEvent { element: Ticket, fieldToUpdate: string, newValue: any };

@Component({
  selector: 'app-paid-tickets',
  templateUrl: './paid-tickets.component.html',
  styleUrls: ['./paid-tickets.component.scss']
})
export class PaidTicketsComponent implements OnInit, AfterViewInit {
  excelSheetPath = 'excelSheets';

  dbTickets$!: Observable<Ticket[]>;

  allExcelSheets: string[] = [];
  selectedExcelSheet$ = new Subject<string>();

  filterBy$ = new BehaviorSubject<string>('');
  columnToFilterBy$ = new BehaviorSubject<string>('');

  updateExcelSheet$ = new Subject<ExcelSheet>();

  displayedColumns: string[] = [];

  newSheetToUpload!: ExcelSheet;

  // updateElement$ = new Subject<TicketChangeEvent>;
  updateElement$ = new Subject<Ticket>;
  dataSource = new MatTableDataSource<Ticket>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  totalSize: number = 0;

  constructor(private firestore: Firestore, public dialog: MatDialog, private snackBar: MatSnackBar) {
  }
  ngOnInit(): void {
    const collection = this.getFirestoreJournalCollection();

    const excelSheetList$ = collectionData(collection, { idField: 'id' }).pipe(
      tap(sheets => {
        this.allExcelSheets = sheets.map((s: DocumentData) => s['id']);
        console.log('Excel sheets are ', this.allExcelSheets);
      })
    );

    const excelSheets$ = combineLatest([excelSheetList$, this.selectedExcelSheet$]).pipe(
      map(([excelSheetList, selectedExcelSheet]) => excelSheetList.find(sheet => sheet['id'] === selectedExcelSheet))
    );

    combineLatest([excelSheets$, this.columnToFilterBy$, this.filterBy$]).pipe(
      map(([data, columnToFilterBy, filterString]: [DocumentData | undefined, string, string]) => {
        console.log(' columnToFilterBy, filterString', columnToFilterBy, filterString);

        let result = data ? data as ExcelSheet : undefined;

        if (result && columnToFilterBy && filterString) {
          const filteredData = result.sheetData.filter((d: any) => d[columnToFilterBy].toLowerCase().includes(filterString.trim().toLowerCase()));

          result = {
            ...result,
            sheetData: filteredData
          }
        }

        return result;
      }),
      tap((data) => {
        if (data) {
          const dataExcelSheet = data as ExcelSheet;
          this.displayedColumns = dataExcelSheet.sheetFields.map(f => f.fieldName);
          this.newSheetToUpload = dataExcelSheet;

          console.log('Filtered data is ', data);
          // const ticketData = data as Ticket[];

          this.dataSource = new MatTableDataSource(this.newSheetToUpload.sheetData);
          this.dataSource.paginator = this.paginator;
        }
      }),
    ).subscribe();

    this.updateExcelSheet$.pipe(
      debounceTime(5000),
      tap(async newSheetInfo => {
        await this.updateExcelSheetInfo(newSheetInfo);
      })
    ).subscribe();
  }

  async updateTable() {
    // console.log('update table called');

    this.updateExcelSheet$.next(this.newSheetToUpload);
  }

  async updateExcelSheetInfo(sheet: ExcelSheet) {
    if (sheet) {
      console.log('updateExcelSheetInfo ', JSON.stringify(sheet));

      let journalCollection = this.getFirestoreJournalCollection();
      // const createdDate = userTicketInfo.createdDateAsDate ? userTicketInfo.createdDateAsDate.toISOString() : new Date().toISOString();

      // Create a query against the collection.
      // const document = (await getDoc(doc(this.firestore, this.excelSheetPath, sheet.sheetName))).ref;
      const excelSheetRef = doc(journalCollection, sheet.sheetName);

      const excelSheet = (await getDoc(excelSheetRef));
      let userRecord: ExcelSheet | undefined = excelSheet.exists() ? { ...(excelSheet.data() as ExcelSheet), sheetName: excelSheet.id } : undefined;

      if (userRecord === undefined) {
        console.log('excel sheet does not exists ', JSON.stringify(userRecord));
        // setDoc(doc(this.firestore, this.excelSheetPath, sheet.sheetName), { ...sheet }).then(_result => {
        //   this.snackBar.open('Save Success', 'Close', {
        //     duration: 5000,
        //   });
        // });

      } else {
        console.log('excel sheet exists ', JSON.stringify(userRecord));

        // const docRef = doc(this.firestore, this.excelSheetPath, (userRecord as ExcelSheet).sheetName);

        updateDoc(excelSheetRef, { ...sheet, updatedDate: new Date().toISOString() })
          .then(_result => {
            this.snackBar.open('Update Success', 'Close', {
              duration: 5000,
            });
          })
          .catch(error => {
            console.log(error);
            this.snackBar.open('Update Failed', 'Close', {
              duration: 5000,
            });
          });
      }
    }

  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  updateDateField(element: any, fieldName: string, newDateValue: string) {
    // console.log('element && fieldName && newDateValue', element, fieldName, newDateValue);

    if (element && fieldName && newDateValue) {
      element[fieldName] = new Date(newDateValue).toISOString();

      // console.log('element after update', element[fieldName]);

      this.updateTable();
    }
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(AddUserTicketComponent, {
      data: this.newSheetToUpload.sheetFields,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('The dialog was closed', result);

        this.newSheetToUpload.sheetData.push(result);
        this.updateTable();
      }
    });
  }

  getFirestoreJournalCollection(): CollectionReference<DocumentData> {
    const journalCollection = collection(this.firestore, this.excelSheetPath);
    return journalCollection;
  }

  // async updateUserTicketInfo(userTicketInfo: Ticket) {
  //   if (userTicketInfo) {
  //     const journalCollection = this.getFirestoreJournalCollection();

  //     // Create a query against the collection.
  //     const q = query(journalCollection, where("Name", "==", userTicketInfo.Name));

  //     const querySnapshot = await getDocs(q);

  //     const userExists = !querySnapshot.empty;

  //     let userRecord: Ticket | undefined = undefined;

  //     querySnapshot.forEach(record => {
  //       userRecord = {
  //         ...record.data(),
  //         id: record.id
  //       } as Ticket;
  //       return;
  //     });

  //     if (userRecord === undefined) {
  //       addDoc(journalCollection, { ...userTicketInfo }).then(result => {
  //         // this.messageService.add({
  //         //   severity: 'success',
  //         //   summary: 'Journal Entry Added Successfully',
  //         //   detail: `Add of ${userTicketInfo?.title} Successful`
  //         // });

  //         // After creating a new document, load it
  //         getDoc(result).then(newDoc => {
  //           const doc = { id: newDoc.id, ...newDoc.data() } as Ticket;
  //           // const createdDateAsDate = new Date(Date.parse(doc.createdDate))
  //           userTicketInfo = { ...doc };
  //         });
  //       });
  //     } else {
  //       console.log('userExists ', JSON.stringify(userRecord));

  //       const docRef = doc(this.firestore, this.excelSheetPath, (userRecord as Ticket).id);

  //       updateDoc(docRef, { ...userTicketInfo, updatedDate: new Date().toISOString() })
  //         .then(_result => {
  //           // this.messageService.add({
  //           //   severity: 'success',
  //           //   summary: 'Update Occurred Successfully',
  //           //   detail: `Update of ${userTicketInfo?.title} Successful`
  //           // });
  //         })
  //         .catch(error => {
  //           console.log(error);
  //         });
  //     }
  //   }

  // }
}
