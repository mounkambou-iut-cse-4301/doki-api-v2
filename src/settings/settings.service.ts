import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { CommissionType } from 'generated/prisma';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Valider les valeurs en fonction du type
   */
  private validateCommissionValue(type: CommissionType, value: number) {
    if (type === CommissionType.PERCENTAGE && value > 100) {
      throw new BadRequestException({
        message: 'Le pourcentage ne peut pas dépasser 100%',
        messageE: 'Percentage cannot exceed 100%'
      });
    }
    if (value < 0) {
      throw new BadRequestException({
        message: 'La valeur ne peut pas être négative',
        messageE: 'Value cannot be negative'
      });
    }
  }

  /**
   * Créer ou mettre à jour la configuration
   */
  async createOrUpdate(dto: CreateSettingDto, userId: number) {
    // Validation des valeurs
    if (dto.onlineType && dto.onlineValue !== undefined) {
      this.validateCommissionValue(dto.onlineType, dto.onlineValue);
    }
    if (dto.onsiteType && dto.onsiteValue !== undefined) {
      this.validateCommissionValue(dto.onsiteType, dto.onsiteValue);
    }

    const existing = await this.prisma.setting.findFirst();

    if (existing) {
      const updated = await this.prisma.setting.update({
        where: { settingId: existing.settingId },
        data: {
          onlineType: dto.onlineType,
          onlineValue: dto.onlineValue,
          onsiteType: dto.onsiteType,
          onsiteValue: dto.onsiteValue,
          description: dto.description,
          updatedBy: userId
        }
      });
      return {
        message: 'Configuration mise à jour avec succès',
        messageE: 'Settings updated successfully',
        data: updated
      };
    } else {
      const created = await this.prisma.setting.create({
        data: {
          onlineType: dto.onlineType || CommissionType.PERCENTAGE,
          onlineValue: dto.onlineValue ?? 10,
          onsiteType: dto.onsiteType || CommissionType.PERCENTAGE,
          onsiteValue: dto.onsiteValue ?? 15,
          description: dto.description,
          updatedBy: userId
        }
      });
      return {
        message: 'Configuration créée avec succès',
        messageE: 'Settings created successfully',
        data: created
      };
    }
  }

  /**
   * Récupérer la configuration
   */
  async getSettings() {
    const settings = await this.prisma.setting.findFirst();

    if (!settings) {
      return {
        message: 'Configuration récupérée avec succès (valeurs par défaut)',
        messageE: 'Settings retrieved successfully (default values)',
        data: {
          onlineType: CommissionType.PERCENTAGE,
          onlineValue: 10,
          onsiteType: CommissionType.PERCENTAGE,
          onsiteValue: 15,
          description: 'Configuration par défaut'
        }
      };
    }

    return {
      message: 'Configuration récupérée avec succès',
      messageE: 'Settings retrieved successfully',
      data: settings
    };
  }

  /**
   * Mettre à jour la configuration
   */
  async updateSettings(dto: UpdateSettingDto, userId: number) {
    const existing = await this.prisma.setting.findFirst();

    if (!existing) {
      throw new NotFoundException({
        message: 'Aucune configuration trouvée',
        messageE: 'No settings found'
      });
    }

    // Validation des valeurs
    if (dto.onlineType && dto.onlineValue !== undefined) {
      this.validateCommissionValue(dto.onlineType, dto.onlineValue);
    }
    if (dto.onsiteType && dto.onsiteValue !== undefined) {
      this.validateCommissionValue(dto.onsiteType, dto.onsiteValue);
    }

    const updated = await this.prisma.setting.update({
      where: { settingId: existing.settingId },
      data: {
        onlineType: dto.onlineType,
        onlineValue: dto.onlineValue,
        onsiteType: dto.onsiteType,
        onsiteValue: dto.onsiteValue,
        description: dto.description,
        updatedBy: userId
      }
    });

    return {
      message: 'Configuration mise à jour avec succès',
      messageE: 'Settings updated successfully',
      data: updated
    };
  }

  /**
   * Calculer la commission
   */
  async calculateCommission(amount: number, type: 'online' | 'onsite'): Promise<{ commission: number; netAmount: number }> {
    const settings = await this.prisma.setting.findFirst();
    
    let commissionType: CommissionType;
    let commissionValue: number;

    if (!settings) {
      // Valeurs par défaut
      commissionType = CommissionType.PERCENTAGE;
      commissionValue = type === 'online' ? 10 : 15;
    } else {
      commissionType = type === 'online' ? settings.onlineType : settings.onsiteType;
      commissionValue = type === 'online' ? settings.onlineValue : settings.onsiteValue;
    }

    let commission = 0;
    
    if (commissionType === CommissionType.PERCENTAGE) {
      commission = (amount * commissionValue) / 100;
    } else {
      commission = commissionValue;
    }

    // Ne pas dépasser le montant total
    if (commission > amount) {
      commission = amount;
    }

    const netAmount = amount - commission;

    return {
      commission: Math.round(commission * 100) / 100,
      netAmount: Math.round(netAmount * 100) / 100
    };
  }
}