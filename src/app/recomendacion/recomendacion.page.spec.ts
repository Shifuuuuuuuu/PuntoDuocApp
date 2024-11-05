import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecomendacionPage } from './recomendacion.page';

describe('RecomendacionPage', () => {
  let component: RecomendacionPage;
  let fixture: ComponentFixture<RecomendacionPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RecomendacionPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
