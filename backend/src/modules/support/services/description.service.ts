// backend/src/modules/support/services/description.service.ts

import { descriptionRepository } from '../repositories/description.repository';
import { IPageDescription, ICreateDescriptionInput, IUpdateDescriptionInput, PAGE_IDS } from '../types/support.types';

export class DescriptionService {
  async getAllDescriptions(onlyActive: boolean = true): Promise<IPageDescription[]> {
    return descriptionRepository.findAll(onlyActive);
  }

  async getDescriptionById(id: string): Promise<IPageDescription | null> {
    if (!id) return null;
    return descriptionRepository.findById(id);
  }

  async upsertDescription(data: ICreateDescriptionInput): Promise<IPageDescription> {
    if (!data.id || !data.title || !data.content) {
      throw new Error('شناسه، عنوان و متن توضیح الزامی است');
    }
    return descriptionRepository.upsert(data);
  }

  async bulkUpsertDescriptions(descriptions: ICreateDescriptionInput[]): Promise<IPageDescription[]> {
    if (!descriptions || descriptions.length === 0) {
      throw new Error('لیست توضیحات نمی‌تواند خالی باشد');
    }
    return descriptionRepository.bulkUpsert(descriptions);
  }

  async updateDescription(id: string, data: IUpdateDescriptionInput): Promise<IPageDescription | null> {
    if (!id) {
      throw new Error('شناسه صفحه الزامی است');
    }
    return descriptionRepository.update(id, data);
  }

  async deleteDescription(id: string): Promise<boolean> {
    if (!id) return false;
    return descriptionRepository.delete(id);
  }

  async getDefaultDescriptions(): Promise<Record<string, IPageDescription>> {
    const descriptions = await descriptionRepository.findAll(true);
    const result: Record<string, IPageDescription> = {};
    for (const desc of descriptions) {
      result[desc.id] = desc;
    }
    return result;
  }

  async initializeDefaultDescriptions(): Promise<void> {
    // ایجاد ۱۰ باکس خالی (بدون عنوان و متن پیش‌فرض)
    const defaultDescriptions: ICreateDescriptionInput[] = [];
    
    for (let i = 1; i <= 10; i++) {
      const boxId = `box_${i}` as keyof typeof PAGE_IDS;
      defaultDescriptions.push({
        id: boxId,
        title: '',  // عنوان خالی
        content: '', // متن خالی
        is_active: true,
        display_order: i
      });
    }

    for (const desc of defaultDescriptions) {
      const existing = await descriptionRepository.findById(desc.id);
      if (!existing) {
        await descriptionRepository.upsert(desc);
      }
    }
  }
}

export const descriptionService = new DescriptionService();