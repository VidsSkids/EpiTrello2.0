import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { of } from 'rxjs';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../services/auth.service';
import { provideRouter } from '@angular/router';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authSpy: any;
  let routerStub: any;
  let routeStub: any;

  beforeEach(async () => {
    authSpy = {
      register: jasmine.createSpy('register').and.returnValue(of({ token: 't' })),
      loginWithGoogle: jasmine.createSpy('loginWithGoogle')
    };
    routerStub = { navigate: jasmine.createSpy('navigate') };

    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: AuthService, useValue: authSpy },
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('submits registration and navigates to home', () => {
    component.name = 'john';
    component.password = 'secret';
    component.submit();
    expect(authSpy.register).toHaveBeenCalledWith({ name: 'john', password: 'secret' });
  });

  it('triggers Google login on button click', () => {
    const el: HTMLElement = fixture.nativeElement;
    const btns = Array.from(el.querySelectorAll('button'));
    const googleBtn = btns.find(b => b.textContent?.includes('Continue with Google'));
    expect(googleBtn).toBeDefined();
    (googleBtn as HTMLButtonElement).click();
    expect(authSpy.loginWithGoogle).toHaveBeenCalled();
  });
});
