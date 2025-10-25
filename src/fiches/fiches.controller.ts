import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FichesService } from './fiches.service';
import { CreateFicheDto } from './dto/create-fiche.dto';
import { UpdateFicheDto } from './dto/update-fiche.dto';

@ApiTags('fiches (CRUD)')
@Controller('fiches')
export class FichesController {
  constructor(private readonly svc: FichesService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une fiche (questions TEXT/SELECT en JSON)' })
  @ApiBody({
    schema: {
      example: {
        title: 'Paludisme - Anamnèse',
        description: 'Questions simples',
        createdBy: 5,
        questions: [
          { label: 'Depuis quand as-tu le palu ?', type: 'SELECT', order: 0,
            options: [
              { label:'Un jour', value:'1_jour' },
              { label:'Deux jours', value:'2_jours' },
              { label:'Trois jours', value:'3_jours' }
            ]},
          { label: 'Autres détails', type: 'TEXT', order: 1 }
        ]
      }
    }
  })
  create(@Body() dto: CreateFicheDto) { return this.svc.createFiche(dto); }

  @Get()
  @ApiOperation({ summary: 'Lister les fiches (pagination + recherche titre/description)' })
  list(@Query() query: any) {
    return this.svc.listFiches(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lire une fiche (questions + réponses JSON)' })
  get(@Param('id') id: string) { return this.svc.getFiche(Number(id)); }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour une fiche (remplacement simple des questions si fourni)' })
  update(@Param('id') id: string, @Body() dto: UpdateFicheDto) {
    return this.svc.updateFiche(Number(id), dto);
  }
}
