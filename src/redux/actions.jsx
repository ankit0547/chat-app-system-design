export const FETCH_USER_PERMISSIONS = 'FETCH_USER_PERMISSIONS';
export const FETCH_USER_PERMISSIONS_SUCCESS = 'FETCH_USER_PERMISSIONS_SUCCESS';
export const FETCH_USER_PERMISSIONS_FAILURE = 'FETCH_USER_PERMISSIONS_FAILURE';

export const fetchUserPermissions = () => ({
  type: FETCH_USER_PERMISSIONS,
});

export const fetchUserPermissionsSuccess = (data) => ({
  type: FETCH_USER_PERMISSIONS_SUCCESS,
  payload: data,
});

export const fetchUserPermissionsFailure = (error) => ({
  type: FETCH_USER_PERMISSIONS_FAILURE,
  payload: error,
});
