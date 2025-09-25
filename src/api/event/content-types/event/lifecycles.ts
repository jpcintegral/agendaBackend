export default {
  beforeCreate(event) {
    const { data } = event.params;
    if (data.startDateTime && data.durationHours) {
      const start = new Date(data.startDateTime);
      data.endDateTime = new Date(
        start.getTime() + Number(data.durationHours) * 3600 * 1000
      ).toISOString();
    }
  },
  beforeUpdate(event) {
    const { data, where } = event.params;
    if (data.startDateTime || data.durationHours) {
      const entity = event.state ? event.state : {};
      const start = new Date(
        data.startDateTime || entity.startDateTime
      );
      const dur =
        Number(data.durationHours || entity.durationHours || 0);
      data.endDateTime = new Date(
        start.getTime() + dur * 3600 * 1000
      ).toISOString();
    }
  },
  async afterUpdate(event) {
    const { result } = event;

    const io = (strapi.server as any).io;

    if (!io) return;

    // Si está aprobado
    if (["aprobado", "considerando", "cancelado","pendiente"].includes(result.status)) {
      // Notificar a todas las áreas involucradas
      if (result.areas && result.areas.length > 0) {
        result.areas.forEach((area) => {
          io.to(`area:${area.id}`).emit("evento-aprobado", {
            eventoId: result.id,
            titulo: result.titulo,
            status: result.status,
          });
        });
      }

      // Notificar a secretarias
      io.to("secretarias").emit("evento-aprobado", {
        eventoId: result.id,
        titulo: result.titulo,
        status: result.status,
      });
    }

    // Si está considerado
    if (result.status === "considerando") {
      io.to("secretarias").emit("evento-considerado", {
        eventoId: result.id,
        titulo: result.titulo,
        status: result.status,
      });
    }

    

    if(result.status === "cancelado") {
      io.to("secretarias").emit("evento-cancelado", {
        eventoId: result.id,
        titulo: result.title,
        status: result.status,
      });
    }

  },
};
