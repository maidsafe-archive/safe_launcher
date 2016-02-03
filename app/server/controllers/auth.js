export default class AuthController {
  constructor(api) {
    this.api = api;
  }

  register(router) {
      router.get('/auth', this.authorise);
  }

  authorise(req, res) {
    res.send('Working');
  }

}
