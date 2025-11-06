export class CommunicationDto {
  id: string;
  tipo: "email" | "notificacion" | "anuncio";
  asunto: string;
  contenido: string;
  fecha_envio: string;
  destinatarios: number;
  leidos: number;
}
