export interface Ticket {
    // - Name: contains the user's name
    // - NumberOfTickets : contains a number 0 to 100
    // - AmountPaid: a number
    // - HasPaid : contains yes or no
    // - DatePaid: any value 
    id: string,
    Name: string,
    NumberOfTickets: number,
    AmountPaid: number,
    HasPaid: boolean,
    DatePaid: string
}

export interface ExcelColumn {
    fieldName: string,
    fieldType: 'text' | 'number' | 'date' | 'yes/no'
}

export interface ExcelSheet {
    sheetName: string,
    sheetFields: ExcelColumn[],
    sheetData: any
}