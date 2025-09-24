export default {
  routes: [
    {
      method: 'POST',
      path: '/events/:id/approve',
      handler: 'api::event.event.approve'
    }
  ]
};
