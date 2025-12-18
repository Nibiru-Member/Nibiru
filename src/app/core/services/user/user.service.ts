import { HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from '../http/http.service';
import { BaseResponse } from '../../models/common.model';
import { UserDetail, UserNewPassword, UserPermissions, UserRecord, UserResetPassword } from '../../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private httpService = inject(HttpService);

  // Set headers
  private headers = new HttpHeaders({
    clientId: 'Nibiru-Software',
    clientSecret: 'Nibiru-Software-Secret',
  });

  private options = { headers: this.headers };

  constructor() {}

  // 🔘 POST: Forgot Password
  forgotPassword(data: UserResetPassword): Observable<BaseResponse> {
    return this.httpService.post('/api/User/ForgotPassword', data, this.options);
  }

  // 🔘 POST: Assign permissions to user
  assignUserPermissionsToUser(data: UserPermissions): Observable<BaseResponse> {
    return this.httpService.post('/api/User/AssignUserPermissionsToUser', data, this.options);
  }

  // 🔘 POST: Logout
  logout(data: UserDetail): Observable<BaseResponse> {
    return this.httpService.post('/api/User/logout', data, this.options);
  }

  // 🔘 POST: Logout all sessions
  logOutAll(data: any): Observable<BaseResponse> {
    return this.httpService.post('/api/User/logout-all', data, this.options);
  }

  addUser(data: UserRecord): Observable<BaseResponse> {
    return this.httpService.post(`/api/User/AddUser`, data, this.options);
  }
  saveAccountUserAndRoles(data: UserRecord): Observable<BaseResponse> {
    return this.httpService.post(`/api/Auth/SaveAccountUserAndRoles`, data, this.options);
  }

  updateUserRecord(data: UserRecord): Observable<BaseResponse> {
    return this.httpService.put(`/api/User/UpdateUserRecord`, data, this.options);
  }

  // Example role and account lists
  getRoles(): Observable<any[]> {
    return this.httpService.get('/api/Role/GetDropdownForRoleList');
  }

  getAccounts(): Observable<any[]> {
    return this.httpService.get('/api/Account/GetDropdownForAccountList');
  }
  // 🔁 PUT: Change user password
  changeUserPassword(data: UserNewPassword): Observable<BaseResponse> {
    return this.httpService.put('/api/User/ChangeUserPassword', data, this.options);
  }

  // 🔍 GET: Get user list by ID
  getUserRecordList(): Observable<BaseResponse> {
    return this.httpService.get(`/api/User/GetUserRecordList`, this.options);
  }

  // 🔍 GET: Get user by user ID (paginated)
  getUserRecordByUserId(userId: string): Observable<BaseResponse> {
    return this.httpService.get(`/api/User/GetUserRecordByUserId/${userId}`, {});
  }

  // 🔍 GET: Get user permissions by user ID
  getUserPermissionsDataByUserId(id: string): Observable<BaseResponse> {
    return this.httpService.get(`/api/Template/GetUserPermissionsDataByUserId?id=${id}`, this.options);
  }

  // Delete : Delete user record by user ID
  deleteUserRecordByUserId(id: string): Observable<BaseResponse> {
    return this.httpService.delete(`/api/User/DeleteUserRecordByUserId/${id}`, this.options);
  }
  /**
   * PUT - Update account profile
   * /api/Account/UpdateAccountProfile
   */
  updateUserProfilePicture(userId: string, file: File) {
    const formData = new FormData();
    formData.append('UserId', userId);
    formData.append('UserProfilePic', file);
    formData.append('IsImageUpdate', 'true');

    return this.httpService.put(`/api/User/UpdateUserProfile`, formData);
  }
}
