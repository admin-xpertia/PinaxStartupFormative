import { IsArray, IsEmail, ArrayMinSize } from "class-validator";

export class InviteEstudiantesDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsEmail({}, { each: true })
  emails: string[];
}
