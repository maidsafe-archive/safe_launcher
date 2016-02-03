export default class AuthController {
  constructor(api) {
    this.api = api;
  }

  authorise(req, res) {
    res.send(200, 'Working');
  }

}
