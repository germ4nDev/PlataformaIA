import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionTipoItemComponent } from './gestion-tipo-item.component';

describe('GestionTipoItemComponent', () => {
  let component: GestionTipoItemComponent;
  let fixture: ComponentFixture<GestionTipoItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionTipoItemComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GestionTipoItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
