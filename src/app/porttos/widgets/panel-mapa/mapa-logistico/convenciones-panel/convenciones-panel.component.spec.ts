import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConvencionesPanelComponent } from './convenciones-panel.component';

describe('ConvencionesPanelComponent', () => {
  let component: ConvencionesPanelComponent;
  let fixture: ComponentFixture<ConvencionesPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConvencionesPanelComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ConvencionesPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
