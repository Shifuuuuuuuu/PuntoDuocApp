import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FolderVentasPage } from './folder-ventas.page';

describe('FolderVentasPage', () => {
  let component: FolderVentasPage;
  let fixture: ComponentFixture<FolderVentasPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(FolderVentasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
