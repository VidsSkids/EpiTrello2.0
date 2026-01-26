import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TipCard } from './tip-card';

describe('TipCard', () => {
  let component: TipCard;
  let fixture: ComponentFixture<TipCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TipCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TipCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
