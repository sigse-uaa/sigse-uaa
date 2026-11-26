
const bcrypt = require('bcryptjs');
const { ApiError } = require('../errors');
const { serializeUser, serializeUserPorfile } = require('../serializers');

const BCRYPT_ROUNDS = 12;

function createUsersService(users) {
    return {
    async listActiveUsers(filters) {
        const usersList = await users.listActive(filters);
        return usersList.map(serializeUser);
    },

    async createOperator({ name, email, password }) {
        const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
        const user = await users.createOperator({ name, email, passwordHash });
        if (!user) {
            throw new ApiError(409, 'EMAIL_TAKEN', 'Ya existe una cuenta con ese correo.');
        }
        return serializeUser(user);
    },

    async updateProfile(userId, { name, currentPassword, newPassword }) {
        const changes = {};

        if (name !== undefined) {
            changes.name = name;
        }

    if (newPassword !== undefined) {
        const user = await users.findById(userId);
        const passwordMatches =
        user && await bcrypt.compare(currentPassword, user.password_hash);

        if (!passwordMatches) {
            throw new ApiError(422, 'VALIDATION_ERROR', 'La contraseña actual es incorrecta.');
        }

        changes.passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
        }

        const updatedUser = await users.updateProfile(userId, changes);

        return serializeUserPorfile(updatedUser);
        },
    };
}

module.exports = { createUsersService };
