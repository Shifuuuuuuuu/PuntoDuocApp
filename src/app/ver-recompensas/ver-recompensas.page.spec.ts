import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VerRecompensasPage } from './ver-recompensas.page';

describe('VerRecompensasPage', () => {
  let component: VerRecompensasPage;
  let fixture: ComponentFixture<VerRecompensasPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(VerRecompensasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
