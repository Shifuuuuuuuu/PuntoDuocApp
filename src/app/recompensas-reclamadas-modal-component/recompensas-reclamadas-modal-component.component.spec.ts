import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { RecompensasReclamadasModalComponentComponent } from './recompensas-reclamadas-modal-component.component';

describe('RecompensasReclamadasModalComponentComponent', () => {
  let component: RecompensasReclamadasModalComponentComponent;
  let fixture: ComponentFixture<RecompensasReclamadasModalComponentComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ RecompensasReclamadasModalComponentComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(RecompensasReclamadasModalComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
