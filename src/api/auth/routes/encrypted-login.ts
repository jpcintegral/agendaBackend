export default {
  routes: [
    {
      method: 'POST',
      path: '/auth/encrypted-login',
      handler: 'encrypted-login.login',
      config: {
        auth: false, // permite acceso sin token
      },
    },
  ],
};
