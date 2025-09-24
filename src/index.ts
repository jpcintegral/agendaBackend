 import type { Core } from '@strapi/strapi';


export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register({ strapi }: { strapi: Core.Strapi }) {
    const io = require("socket.io")(strapi.server.httpServer, {
      cors: {
        origin: "*", // en prod cambia a tu dominio de Angular
        methods: ["GET", "POST"],
      },
    });

    // Guardamos socket.io en strapi para usarlo en controllers/services
    (strapi.server as any).io = io;

    // Cuando un usuario se conecta lo metemos en un room según su rol
    io.on("connection", (socket) => {
      console.log(`🔌 Usuario conectado: ${socket.id}`);

      // El frontend debe mandar un evento join con { room: 'secretarias' } o { room: 'area:123' }
      socket.on("join", ({ room }) => {
        console.log(`📢 Usuario ${socket.id} se unió a la sala ${room}`);
        socket.join(room);
      });

      socket.on("disconnect", () => {
        console.log(`❌ Usuario desconectado: ${socket.id}`);
      });
    });
  },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap(/* { strapi }: { strapi: Core.Strapi } */) {},
};
