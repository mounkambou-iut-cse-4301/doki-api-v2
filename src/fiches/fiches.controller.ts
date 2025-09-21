import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FichesService } from './fiches.service';
import { CreateFicheDto } from './dto/create-fiche.dto';
import { UpdateFicheDto } from './dto/update-fiche.dto';
import { QueryFichesDto } from './dto/query-fiches.dto';

@ApiTags('fiches (CRUD)')
@Controller('fiches')
export class FichesController {
  constructor(private readonly svc: FichesService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une fiche structurée (questions texte)' })
  @ApiBody({
    schema: {
      example: {
        title: 'Migraine - anamnèse',
        description: 'Questions simples',
        createdBy: 5, // ADMIN
        questions: [
          { label: 'Depuis quand avez-vous la migraine ?', orderIndex: 0 },
          { label: 'Qu’est-ce qui l’aggrave ?', orderIndex: 1 },
          { label: 'Antécédents pertinents ?', orderIndex: 2 }
        ]
      }
    }
  })
  create(@Body() dto: CreateFicheDto) { return this.svc.createFiche(dto); }

  // ⬇️ PLUS DE requirement. Tout est optionnel, retourne tout par défaut.
  @Get()
  @ApiOperation({ summary: 'Lister les fiches (sans requirement) + filtres optionnels + pagination' })
  list(@Query() query: QueryFichesDto) {
    return this.svc.listFiches(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lire une fiche (questions incluses par défaut)' })
  get(@Param('id') id: string) { return this.svc.getFiche(Number(id)); }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour une fiche + synchroniser les questions' })
  @ApiBody({
    schema: {
      example: {
        title: 'Migraine - anamnèse & suivi',
        isActive: true,
        questions: [
          { ficheQuestionId: 10, label: 'Depuis quand ?', orderIndex: 0 },
          { ficheQuestionId: 11, label: 'Facteurs aggravants ?', orderIndex: 1 },
          { label: 'Traitements déjà essayés ?', orderIndex: 2 }
        ]
      }
    }
  })
  update(@Param('id') id: string, @Body() dto: UpdateFicheDto) {
    return this.svc.updateFiche(Number(id), dto);
  }
}
