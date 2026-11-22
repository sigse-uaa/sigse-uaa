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
  };
}

module.exports = { createAuthController };
