export default {
  routes: [
    {
      method: 'POST',
      path: '/events/:documentId/approve',
      handler: 'api::event.event.approve'
    }
  ]
};
