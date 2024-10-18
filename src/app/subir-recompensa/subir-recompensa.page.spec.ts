import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SubirRecompensaPage } from './subir-recompensa.page';

describe('SubirRecompensaPage', () => {
  let component: SubirRecompensaPage;
  let fixture: ComponentFixture<SubirRecompensaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SubirRecompensaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
