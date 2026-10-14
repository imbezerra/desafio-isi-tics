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

import { Condicao } from '../../common/domain.types';
import { IdPipe } from '../../common/parsers/id.pipe';

import {
  CadastroJogadorPipe,
  CondicaoJogadorPipe,
  EdicaoJogadorPipe,
} from '../pipes/jogadores.input';
import { CadastroJogador, EdicaoJogador, ConsultaJogadores } from '../dto/jogador.dto';
import { ConsultaJogadoresPipe } from '../pipes/jogadores.query';
import { JogadoresService } from '../services/jogadores.service';
import { DocumentarConsultaJogadores } from '../swagger/jogadores.swagger';

@ApiTags('Jogadores')
@Controller('players')
export class JogadoresController {
  constructor(private readonly jogadores: JogadoresService) {}

  @Get()
  @DocumentarConsultaJogadores()
  @ApiOperation({ summary: 'Lista jogadores com filtros, ordenação e paginação' })
  listar(@Query(ConsultaJogadoresPipe) consulta: ConsultaJogadores) {
    return this.jogadores.listar(consulta);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consulta um jogador com indicadores e valores atuais' })
  consultar(@Param('id', IdPipe) id: number) {
    return this.jogadores.consultar(id);
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
  async cadastrar(
    @Body(CadastroJogadorPipe) entrada: CadastroJogador,
    @Res({ passthrough: true }) resposta: Response,
  ) {
    const jogador = await this.jogadores.cadastrar(entrada);
    resposta.location(`/api/v1/players/${jogador.id}`);
    return jogador;
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza os dados permitidos de um jogador' })
  @ApiBody({
    schema: {
      type: 'object',
      example: { name: 'Meia Lua', position: 'MEI', agility: 85, age: 25 },
    },
  })
  editar(@Param('id', IdPipe) id: number, @Body(EdicaoJogadorPipe) entrada: EdicaoJogador) {
    return this.jogadores.editar(id, entrada);
  }

  @Patch(':id/condition')
  @ApiOperation({ summary: 'Altera a condição física de um jogador' })
  @ApiBody({ schema: { type: 'object', example: { condition: 'MAL_CONDICIONADO' } } })
  alterarCondicao(@Param('id', IdPipe) id: number, @Body(CondicaoJogadorPipe) condicao: Condicao) {
    return this.jogadores.alterarCondicao(id, condicao);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Exclui logicamente um jogador que esteja livre' })
  excluir(@Param('id', IdPipe) id: number) {
    return this.jogadores.excluir(id);
  }
}
