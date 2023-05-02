import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadSheetComponent } from './upload-sheet.component';

describe('UploadSheetComponent', () => {
  let component: UploadSheetComponent;
  let fixture: ComponentFixture<UploadSheetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UploadSheetComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UploadSheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
