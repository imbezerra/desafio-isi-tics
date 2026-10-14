import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { ClassificacaoService } from '../services/classificacao.service';

@ApiTags('Liga')
@Controller('standings')
export class ClassificacaoController {
  constructor(private readonly classificacao: ClassificacaoService) {}

  @Get()
  @ApiOperation({ summary: 'Calcula a classificação de todos os clubes da liga' })
  consultar() {
    return this.classificacao.consultar();
  }
}
