'use strict';
const CryptoJS = require('crypto-js');

module.exports = {
  async login(ctx) {
    try {
      const secretKey = process.env.LOGIN_SECRET_KEY;
      const { encryptedData } = ctx.request.body;

      if (!encryptedData) {
        return ctx.badRequest('No se enviaron datos encriptados.');
      }

      // 🔹 Desencriptar datos
      const bytes = CryptoJS.AES.decrypt(encryptedData, secretKey);
      const decrypted = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
      const { identifier, password } = decrypted;

      // 🔹 Buscar usuario usando entityService
      const users = await strapi.db.query('plugin::users-permissions.user').findMany({
        where: {
          $or: [
            { email: identifier },
            { username: identifier },
          ],
        },
      });

      const user = users.length ? users[0] : null;
      if (!user) return ctx.badRequest('Usuario no encontrado');

      // 🔹 Validar contraseña
      const userService = strapi.plugin('users-permissions').service('user');
      const validPassword = await userService.validatePassword(password, user.password);
      if (!validPassword) return ctx.badRequest('Contraseña incorrecta');

      // 🔹 Generar token JWT
      const jwtService = strapi.plugin('users-permissions').service('jwt');
      const jwt = jwtService.issue({ id: user.id });

      //return ctx.send({ jwt, user });
      return ctx.send({ jwt});
    } catch (error) {
      console.error('Error login encriptado:', error);
      return ctx.badRequest('Error en el login encriptado');
    }
  },
};
