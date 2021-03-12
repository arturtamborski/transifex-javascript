import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UTComponent } from './UT.component';

describe('UTComponent', () => {
  let component: UTComponent;
  let fixture: ComponentFixture<UTComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UTComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UTComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
