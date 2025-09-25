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
          result: 'conflict', 
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
    },

      async create(ctx) {
    const { startDateTime, endDateTime } = ctx.request.body.data;

    // Buscar conflictos con eventos aprobados
    const conflicts = await strapi.db.query('api::event.event').findMany({
      where: {
        status: 'aprobado',
        $or: [
          {
            startDateTime: { $lt: endDateTime },
            endDateTime: { $gt: startDateTime }
          }
        ]
      }
    });

    if (conflicts.length > 0) {
      return ctx.conflict('Conflicto de horarios con eventos aprobados', { conflicts });
    }

    // Si no hay conflicto, crear normalmente
    return super.create(ctx);
  },

  async update(ctx) {
    const { id } = ctx.params;
    const { startDateTime, endDateTime } = ctx.request.body.data;

    const conflicts = await strapi.db.query('api::event.event').findMany({
      where: {
        id: { $ne: id },
        status: 'aprobado',
        $or: [
          { startDateTime: { $lt: endDateTime }, endDateTime: { $gt: startDateTime } }
        ]
      }
    });

    if (conflicts.length > 0) {
      return ctx.conflict('Conflicto de horarios con eventos aprobados', { conflicts });
    }

    return super.update(ctx);
  }


  })
);
