import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Res,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

import { PlayerCondition } from '../../common/domain.types';
import { IdPipe } from '../../common/parsers/id.pipe';

import { CreatePlayerPipe, PlayerConditionPipe, UpdatePlayerPipe } from '../pipes/players.input';
import { CreatePlayerInput, UpdatePlayerInput, PlayerQuery } from '../dto/player.dto';
import { PlayersQueryPipe } from '../pipes/players.query';
import { PlayersService } from '../services/players.service';
import { documentPlayersQuery } from '../swagger/players.swagger';

@ApiTags('Jogadores')
@Controller('players')
export class PlayersController {
  constructor(private readonly players: PlayersService) {}

  @Get()
  @documentPlayersQuery()
  @ApiOperation({ summary: 'Lista jogadores com filtros, ordenação e paginação' })
  list(@Query(PlayersQueryPipe) query: PlayerQuery) {
    return this.players.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consulta um jogador com indicadores e valores atuais' })
  get(@Param('id', IdPipe) id: number) {
    return this.players.get(id);
  }

  @Post()
  @ApiOperation({ summary: 'Cadastra um jogador livre e apto' })
  @ApiBody({
    schema: {
      type: 'object',
      example: {
        name: 'Meia Lua',
        position: 'MEI',
        agility: 85,
        age: 25,
        pace: 70,
        shooting: 68,
        passing: 82,
        dribbling: 79,
        defending: 55,
        physical: 64,
        potential: 86,
      },
    },
  })
  async create(
    @Body(CreatePlayerPipe) input: CreatePlayerInput,
    @Res({ passthrough: true }) response: Response,
  ) {
    const player = await this.players.create(input);
    response.location(`/api/v1/players/${player.id}`);
    return player;
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza os dados permitidos de um jogador' })
  @ApiBody({
    schema: {
      type: 'object',
      example: { name: 'Meia Lua', position: 'MEI', agility: 85, age: 25 },
    },
  })
  update(@Param('id', IdPipe) id: number, @Body(UpdatePlayerPipe) input: UpdatePlayerInput) {
    return this.players.update(id, input);
  }

  @Patch(':id/condition')
  @ApiOperation({ summary: 'Altera a condição física de um jogador' })
  @ApiBody({ schema: { type: 'object', example: { condition: 'MAL_CONDICIONADO' } } })
  updateCondition(
    @Param('id', IdPipe) id: number,
    @Body(PlayerConditionPipe) condition: PlayerCondition,
  ) {
    return this.players.updateCondition(id, condition);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Exclui logicamente um jogador que esteja livre' })
  delete(@Param('id', IdPipe) id: number) {
    return this.players.delete(id);
  }
}
