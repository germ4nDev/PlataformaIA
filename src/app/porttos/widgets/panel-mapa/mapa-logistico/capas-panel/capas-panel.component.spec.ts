import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CapasPanelComponent } from './capas-panel.component';

describe('CapasPanelComponent', () => {
  let component: CapasPanelComponent;
  let fixture: ComponentFixture<CapasPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CapasPanelComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CapasPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
