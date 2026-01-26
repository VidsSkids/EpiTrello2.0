import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateBoardPanelComponent } from './create-board-panel.component';

describe('CreateBoardPanelComponent', () => {
  let component: CreateBoardPanelComponent;
  let fixture: ComponentFixture<CreateBoardPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateBoardPanelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateBoardPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});