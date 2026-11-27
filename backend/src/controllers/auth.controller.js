const { serializeUser } = require('../serializers');

function createAuthController(authService) {
  return {
    async register(request, response) {
      const session = await authService.register(request.body);
      response.status(201).json(session);
    },

    async login(request, response) {
      const session = await authService.login(request.body);
      response.json(session);
    },
    async me(request, response) {
      response.json({ user: serializeUser(request.user) });
    },
  };
}

module.exports = { createAuthController };
