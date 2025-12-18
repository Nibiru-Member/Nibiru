import { HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { from, map, Observable } from 'rxjs';
import { HttpService } from '../http/http.service';
import { LocalService } from '../local/local.service';
import { LocalConstant } from '../../constants/local.constant';
import { LoginSignupUser, LoginSignupUserMicrosoft, LoginUserData } from '../../models/auth.model';
import { BaseResponse } from '../../models/common.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private token: string | null = null;
  private httpService = inject(HttpService);
  private localService = inject(LocalService);

  headers = new HttpHeaders({
    clientId: 'Nibiru-Software',
    clientSecret: 'Nibiru-Software-Secret',
  });
  options = { headers: this.headers };

  isAuthenticated(): boolean {
    return this.token !== null;
  }

  isLogin(): boolean {
    const authStr = localStorage.getItem('authObj');
    if (authStr) return true;
    else return false;
  }
  getUserDetail() {
    const authStr = localStorage.getItem('authObj');
    if (authStr) {
      return JSON.parse(authStr);
    } else {
      return '';
    }
  }

  isUserLoggedIn(): Observable<boolean> {
    return from(this.localService.getLocalData(LocalConstant.USER_DATA)).pipe(
      map((userData: LoginUserData | null) => {
        if (userData) {
          const userPayload = JSON.parse(atob(userData.bearerToken.split('.')[1]));
          return userPayload.exp > Math.floor(Date.now() / 1000);
        } else {
          return false;
        }
      }),
    );
  }

  hasClaim(claimType: any, claimValue?: any): boolean {
    let ret = false;
    // See if an array of values was passed in.
    if (typeof claimType === 'string') {
      ret = this.isClaimValid(claimType, claimValue);
    } else {
      const claims: string[] = claimType;
      if (claims) {
        // tslint:disable-next-line: prefer-for-of
        for (let index = 0; index < claims.length; index++) {
          ret = this.isClaimValid(claims[index]);
          // If one is successful, then let them in
          if (ret) {
            break;
          }
        }
      }
    }
    return ret;
  }

  private isClaimValid(claimType: string, claimValue?: string): boolean {
    let ret = false;
    let auth: any = null;
    // Retrieve security object
    const authStr = localStorage.getItem('authObj');
    if (authStr) {
      auth = JSON.parse(authStr);
      // See if the claim type has a value
      // *hasClaim="'claimType:value'"
      if (claimType.indexOf(':') >= 0) {
        const words: string[] = claimType.split(':');
        claimType = words[0].toLowerCase();
        claimValue = words[1];
      } else {
        claimType = claimType.toLowerCase();
        // Either get the claim value, or assume 'true'
        claimValue = claimValue ? claimValue : 'TRUE';
      }
      // Attempt to find the claim
      ret =
        auth.modulePermission.find(
          (c: any) => c.claimType && c.claimType.toLowerCase() == claimType && c.claimValue == claimValue,
        ) != null;
    }
    return ret;
  }

  // Auth Service
  login(data: LoginSignupUser): Observable<BaseResponse> {
    return this.httpService.post(`/api/Auth/login`, data, this.options);
  }

  loginWithMicrosoft(data: LoginSignupUserMicrosoft): Observable<BaseResponse> {
    return this.httpService.post(`/api/Auth/LoginWithMicrosoft`, data, this.options);
  }

  getAntiForgeryToken(): Observable<BaseResponse> {
    return this.httpService.get(`/api/AntiForgery/GetAntiForgeryToken`, this.options);
  }
}
