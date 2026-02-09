import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-auth-callback',
    template: '<p>Logging in...</p>',
    standalone: true
})
export class GoogleCallbackComponent implements OnInit {
    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private authService: AuthService
    ) { }

    ngOnInit() {
        console.log('GoogleCallbackComponent initialized');
        const token = this.route.snapshot.queryParamMap.get('token');

        if (!token) {
            this.router.navigate(['/login']);
            return;
        }

        this.authService.setToken(token);

        this.router.navigate(['/home']);
    }
}
