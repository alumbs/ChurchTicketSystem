import { Component } from '@angular/core';
import { WorkSheet, read, utils } from 'xlsx';
import { ExcelSheet, Ticket } from '../models/ticket';
import { Firestore, collectionData, collection, addDoc, CollectionReference, DocumentData, updateDoc, doc, deleteDoc, getDoc, query, where, getDocs } from '@angular/fire/firestore';
import { BehaviorSubject, Observable, ReplaySubject, Subject, map, take, tap } from 'rxjs';
import { setDoc } from 'firebase/firestore';
import { MatSnackBar } from '@angular/material/snack-bar';



@Component({
  selector: 'app-upload-sheet',
  templateUrl: './upload-sheet.component.html',
  styleUrls: ['./upload-sheet.component.scss']
})
export class UploadSheetComponent {
  file!: File;


  fieldTypeList: string[] = [
    'text', 'number', 'date', 'yes/no'
  ]

  excelSheetRecords!: any[];

  excelSheetPath = 'excelSheets';

  displayedColumns: string[] = [];

  dbTickets$!: Observable<Ticket[]>;

  newSheetToUpload!: ExcelSheet;

  excelRawRecord$ = new ReplaySubject<any[]>(1);

  sheetTitle$ = new BehaviorSubject<string>('new_sheet');

  /**
   *
   */
  constructor(private firestore: Firestore, private snackBar: MatSnackBar) {
    this.sheetTitle$.pipe(
      tap(val => {
        console.log('New sheet title value', val);
        if (this.newSheetToUpload) {
          const newSheetName = val.replace(/[^\w ]/g, '').replace(' ', '');
          this.newSheetToUpload.sheetName = newSheetName;

          console.log('New sheet title value after replace', newSheetName);
        }
      })
    ).subscribe();
  }

  incomingfile(event: any) {
    this.file = event.target.files[0];
  }

  async Upload(event: any) {
    const file = event.target.files[0];

    if (file) {

      const data = await file.arrayBuffer();

      /* parse and load first worksheet */
      const wb = read(data, {
        type: 'binary',
        cellDates: true,
        cellNF: false,
        cellText: false
      });
      const ws = wb.Sheets[wb.SheetNames[0]];
      // this.tableHtml = utils.sheet_to_html(ws, { id: "tabeller" });

      // this.validateSheet(ws);

      const excelRecords: any = utils.sheet_to_json(ws);

      if (excelRecords) {
        this.excelRawRecord$.next(excelRecords);

        console.log('excelRecords are', excelRecords);

        this.newSheetToUpload = {
          sheetName: 'newsheet',
          sheetFields: [],
          sheetData: null
        };

        const rowWithMaxKeys = excelRecords.reduce(function (prev: any, current: any) {
          return (Object.keys(prev).length > Object.keys(current).length) ? prev : current
        });

        for (var key in rowWithMaxKeys) {
          console.log('excelRecords key is', key);
          this.newSheetToUpload.sheetFields.push({
            fieldName: key,
            fieldType: 'text'
          });
        }

        this.displayedColumns = this.newSheetToUpload.sheetFields.map(f => f.fieldName);

        this.updateExcelSheet();
      }

      // if (excelRecords && Array.isArray(excelRecords)) {
      //   this.excelSheetRecords = excelRecords.map(r => {
      //     return {
      //       ...r,
      //       HasPaid: r.HasPaid === 'yes' ? true : false,
      //       DatePaid: r.DatePaid ? new Date(r.DatePaid).toISOString() : ''
      //     } as Ticket;
      //   });

      //   console.log('this.excelSheetRecords', this.excelSheetRecords);

      //   if (this.excelSheetRecords && this.excelSheetRecords.length > 0) {
      //     this.excelSheetRecords.forEach(async (record) => await this.updateUserTicketInfo(record));
      //   }
      // }
    }
  }

  updateExcelSheet(makeFirebaseUpdate = false) {
    this.excelRawRecord$.pipe(
      tap(val => console.log('I get called', val)),
      take(1),
      map(excelRecords => {
        return excelRecords.map(r => {
          let record = { ...r };

          this.newSheetToUpload.sheetFields.map(f => {
            if (f.fieldType === 'date') {
              record[f.fieldName] = r[f.fieldName] ? new Date(r[f.fieldName]).toISOString() : '';
            } else if ((f.fieldType === 'yes/no')) {
              record[f.fieldName] = r[f.fieldName] === 'yes' ? true : false;
            }
          })

          return record;
        })
      }),
      tap(records => {
        this.newSheetToUpload.sheetData = records;

        console.log('this.excelSheetRecords after mapping', records);

        if (records && records.length > 0 && makeFirebaseUpdate) {
          this.updateExcelSheetInfo(this.newSheetToUpload);
          // this.excelSheetRecords.forEach(async (record) => await this.updateExcelSheetInfo(record));
        }
      })
    ).subscribe();

  }

  async updateExcelSheetInfo(sheet: ExcelSheet) {
    if (sheet) {
      let journalCollection = this.getFirestoreJournalCollection();
      // const createdDate = userTicketInfo.createdDateAsDate ? userTicketInfo.createdDateAsDate.toISOString() : new Date().toISOString();

      const excelSheetRef = doc(journalCollection, sheet.sheetName);

      const excelSheet = (await getDoc(excelSheetRef));
      let userRecord: ExcelSheet | undefined = excelSheet.exists() ? { ...(excelSheet.data() as ExcelSheet), sheetName: excelSheet.id } : undefined;

      if (userRecord === undefined) {
        setDoc(doc(this.firestore, this.excelSheetPath, sheet.sheetName), { ...sheet }).then(_result => {
          this.snackBar.open('Save Success', 'Close', {
            duration: 5000,
          });
        });

      } else {
        this.snackBar.open(`An excel sheet with the name ${sheet.sheetName} already exists. Please change the name and try saving again`, 'Close', {
          duration: 5000,
        });
      }
    }

  }

  // setActiveEntry(entry: Ticket) {
  //   this.activeJournalEntry = entry;
  // }

  createNewActiveEntry() {
    return { id: '', DatePaid: '', Name: '', AmountPaid: 0, HasPaid: false, NumberOfTickets: 0 } as Ticket;
  }

  async updateUserTicketInfo(userTicketInfo: Ticket) {
    if (userTicketInfo) {
      const journalCollection = this.getFirestoreJournalCollection();
      // const createdDate = userTicketInfo.createdDateAsDate ? userTicketInfo.createdDateAsDate.toISOString() : new Date().toISOString();

      // Create a query against the collection.
      const q = query(journalCollection, where("Name", "==", userTicketInfo.Name));

      const querySnapshot = await getDocs(q);

      const userExists = !querySnapshot.empty;

      let userRecord: Ticket | undefined = undefined;

      querySnapshot.forEach(record => {
        userRecord = {
          ...record.data(),
          id: record.id
        } as Ticket;
        return;
      });

      if (userRecord === undefined) {
        addDoc(journalCollection, { ...userTicketInfo }).then(result => {
          // this.messageService.add({
          //   severity: 'success',
          //   summary: 'Journal Entry Added Successfully',
          //   detail: `Add of ${userTicketInfo?.title} Successful`
          // });

          // After creating a new document, load it
          getDoc(result).then(newDoc => {
            const doc = { id: newDoc.id, ...newDoc.data() } as Ticket;
            // const createdDateAsDate = new Date(Date.parse(doc.createdDate))
            userTicketInfo = { ...doc };
          });
        });
      } else {
        console.log('userExists ', JSON.stringify(userRecord));

        const docRef = doc(this.firestore, this.excelSheetPath, (userRecord as Ticket).id);

        updateDoc(docRef, { ...userTicketInfo, updatedDate: new Date().toISOString() })
          .then(_result => {
            // this.messageService.add({
            //   severity: 'success',
            //   summary: 'Update Occurred Successfully',
            //   detail: `Update of ${userTicketInfo?.title} Successful`
            // });
          })
          .catch(error => {
            console.log(error);
          });
      }
    }

  }

  // deleteJournalEntry(event: Event, entry: JournalEntry) {
  //   this.confirmationService.confirm({
  //     target: event.target || undefined,
  //     message: `Are you sure that you want to delete this journal entry ${entry?.title}`,
  //     icon: 'pi pi-exclamation-triangle',
  //     accept: () => {
  //       this.activeJournalList$.pipe(
  //         take(1),
  //         tap(currentActiveJournal => {
  //           if (entry) {
  //             const entryName = entry.title;
  //             const createdDate = entry.createdDateAsDate ? entry.createdDateAsDate.toISOString() : new Date().toISOString();

  //             const docRef = doc(this.firestore, currentActiveJournal.firebasePath, entry.id);

  //             updateDoc(docRef, { ...entry, createdDate, updatedDate: new Date().toISOString(), deleted: true })
  //               .then(_result => {
  //                 this.messageService.add({
  //                   severity: 'success',
  //                   summary: 'Delete Occurred Successfully',
  //                   detail: `Delete of ${entryName} Successful`
  //                 });

  //                 if (this.activeJournalEntry?.id === entry.id) {
  //                   this.activeJournalEntry = undefined;
  //                 }
  //               })
  //               .catch(error => {
  //                 console.log(error);
  //               });
  //           }

  //         })
  //       ).subscribe();
  //     },
  //     reject: () => {
  //       this.messageService.add({ severity: 'error', summary: 'Delete Cancelled', detail: 'Delete cancelled' });
  //     }
  //   });


  //   // True Delete 
  //   // this.activeJournalList$.pipe(
  //   //   take(1),
  //   //   tap(currentActiveJournal => {
  //   //     if (entry) {
  //   //       const docRef = doc(this.firestore, currentActiveJournal.firebasePath, entry.id);

  //   //       deleteDoc(docRef);
  //   //     }
  //   //   })
  //   // ).subscribe();
  // }

  getFirestoreJournalCollection(): CollectionReference<DocumentData> {
    // const journalListToUse: JournalList = newActiveJournalList;

    // console.log('The journalListToUse is', journalListToUse);

    const journalCollection = collection(this.firestore, this.excelSheetPath);
    return journalCollection;
  }

  validateSheet(ws: WorkSheet) {
    // Here are the compulsory excel columns:
    // - Name: contains the user's name
    // - NumberOfTickets : contains a number 0 to 100
    // - AmountPaid: a number
    // - HasPaid : contains yes or no
    // - DatePaid: any value 
    this.worksheetHasColumnOrThrowException(ws, 'Name');
    this.worksheetHasColumnOrThrowException(ws, 'NumberOfTickets');
    this.worksheetHasColumnOrThrowException(ws, 'AmountPaid');
    this.worksheetHasColumnOrThrowException(ws, 'HasPaid');
    this.worksheetHasColumnOrThrowException(ws, 'DatePaid');
  }

  worksheetHasColumnOrThrowException(ws: WorkSheet, columnName: string) {
    console.log(`worksheet info is ${ws['!cols']}`);

    const column = ws['!cols']?.find(col => col.DBF?.name?.trim() === columnName?.trim());
    if (!column) {
      const errorString = `Excel sheet column ${columnName} was not found. It has to exist for the app to work correctly.`;
      alert(errorString);
      throw new Error(errorString);
    }
  }
}
