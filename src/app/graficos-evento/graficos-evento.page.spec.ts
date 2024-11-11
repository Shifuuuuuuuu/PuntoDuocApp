import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GraficosEventoPage } from './graficos-evento.page';

describe('GraficosEventoPage', () => {
  let component: GraficosEventoPage;
  let fixture: ComponentFixture<GraficosEventoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(GraficosEventoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
