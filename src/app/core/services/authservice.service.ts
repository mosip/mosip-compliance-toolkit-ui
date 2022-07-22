import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AppConfigService } from 'src/app/app-config.service';

@Injectable()
export class AuthService {
  constructor(
    private router: Router,
    private http: HttpClient,
    private appService: AppConfigService
  ) {}

  isAuthenticated(): Observable<boolean> {
    return this.http
      .get(
        `${
          this.appService.getConfig().SERVICES_BASE_URL
        }authorize/admin/validateToken`,
        { observe: 'response' }
      )
      .pipe(
        map((res) => res.status === 200),
        catchError((error) => {
          console.log(error);
          return of(false);
        })
      );
    //return of(false);
  }

  isLanguagesSet() {
    return true;
  }
}
