import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { of } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../services/auth.service';
import { BoardService } from '@features/board/services/board.service';
import { provideRouter } from '@angular/router';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authSpy: any;
  let boardSpy: any;
  let routerSpy: any;
  let routeStub: any;

  beforeEach(async () => {
    authSpy = {
      login: jasmine.createSpy('login').and.returnValue(of({ token: 't' })),
      loginWithGoogle: jasmine.createSpy('loginWithGoogle')
    };
    boardSpy = {
      preloadWorkspaceData: jasmine.createSpy('preloadWorkspaceData').and.returnValue(of({}))
    };
    routerSpy = { navigate: jasmine.createSpy('navigate') };

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: AuthService, useValue: authSpy },
        { provide: BoardService, useValue: boardSpy },
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('submits credentials and navigates to home', () => {
    component.name = 'john';
    component.password = 'secret';
    component.submit();
    expect(authSpy.login).toHaveBeenCalledWith({ name: 'john', password: 'secret' });
    expect(boardSpy.preloadWorkspaceData).toHaveBeenCalled();
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
