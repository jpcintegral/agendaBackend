import { factories } from '@strapi/strapi';
export default factories.createCoreController(
  'api::event.event',
  ({ strapi }) => ({
    async approve(ctx) {
      const { id } = ctx.params;
      const user = ctx.state.user;

      if (!user) return ctx.unauthorized('Debe estar autenticado');

      const event = await strapi.db.query('api::event.event').findOne({
        where: { id },
        populate: { areas: true }
      });

      if (!event) return ctx.notFound('Evento no encontrado');

      // Calcular endDateTime
      const start = new Date(event.startDateTime);
      const end = new Date(start.getTime() + Number(event.durationHours) * 3600 * 1000);

      // Buscar conflictos
      const areaIds = event.areas.map((a) => a.id);
      const conflicts = await strapi.db.query('api::event.event').findMany({
        where: {
          status: 'aprobado',
          id: { $ne: id },
          areas: { id: { $in: areaIds } },
          $and: [
            { startDateTime: { $lt: end.toISOString() } },
            { endDateTime: { $gt: start.toISOString() } }
          ]
        }
      });

      if (conflicts.length > 0) {
        return ctx.badRequest('Conflicto de horario con otro evento aprobado', {
          conflicts,
          result: 'conflict', // 🔹 indicador claro
        });
      }

      // Si no hay conflictos → aprobar
      const updated = await strapi.entityService.update('api::event.event', id, {
        data: {
          status: 'aprobado',
          approvedBy: user.id,
          endDateTime: end.toISOString()
        },
        populate: { areas: true, createdBy: true, approvedBy: true }
      });

      return ctx.send({
        message: 'Evento aprobado con éxito',
        result: 'approved', // 🔹 indicador claro
        event: updated,     // 🔹 objeto del evento aprobado
      });
    }
  })
);
