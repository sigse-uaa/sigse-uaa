function createUsersController(usersService) {
    return {
        async list(request, response) {
            const users = await usersService.listActiveUsers(request.validated.query);
            response.json({ data: users });
        },

        async createOperator(request, response) {
            const user = await usersService.createOperator(request.body);
            response.status(201).json({ user });
        },

        async updateMe(request,response){
            const user = await usersService.updateProfile(request.user.id, request.body);
            response.json({ user });
        },
    };
}

module.exports = { createUsersController };
