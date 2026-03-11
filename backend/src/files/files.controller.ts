import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import type { Request } from 'express';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminAccountGuard } from '../auth/admin-account.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { existsSync, mkdirSync } from 'fs';

const uploadsDir = join(process.cwd(), 'uploads');

function ensureUploadsDir() {
  if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true });
  }
}

@ApiTags('files')
@Controller('files')
export class FilesController {
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload an image (admin only)' })
  @ApiConsumes('multipart/form-data')
  @ApiOkResponse({
    description: 'Image uploaded',
    schema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        filename: { type: 'string' },
        originalname: { type: 'string' },
        size: { type: 'number' },
      },
    },
  })
  @UseGuards(JwtAuthGuard, AdminAccountGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req: Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
          ensureUploadsDir();
          cb(null, uploadsDir);
        },
        filename: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
          const ext = file.originalname.includes('.')
            ? `.${file.originalname.split('.').pop()}`
            : '';
          cb(null, `${randomUUID()}${ext}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // Increased to 10MB
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new BadRequestException('Only image files are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  @Post('upload')
  upload(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('file is required');
    }

    return {
      url: `/uploads/${file.filename}`,
      filename: file.filename,
      originalname: file.originalname,
      size: file.size,
    };
  }
}
