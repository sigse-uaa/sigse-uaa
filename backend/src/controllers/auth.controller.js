

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
    async updateMe(request,response){
      request

    },
    async me(request, response) {
      try{
        const user= request.user
        
        const userCom={
          id: Number(user.id),
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: true
        }

          response.json({ user: userCom });
      }catch{
        response.status(404).json({mensaje:"Error en usuario"});
      }
      
    },
  };
}

module.exports = { createAuthController };
