import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { STORAGE_ACCESS_TOKEN } from '../constants/storage-keys';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const isApi = req.url.includes('/api/');
  if (!isApi || req.url.includes('/api/auth/login')) {
    return next(req);
  }
  const token = sessionStorage.getItem(STORAGE_ACCESS_TOKEN);
  if (!token) {
    return next(req);
  }
  return next(
    req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    }),
  );
};
