import { BadRequestException, Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { DownloadService } from './download.service';
@Controller('download')
export class DownloadController {
    constructor(private readonly downloadService: DownloadService){};

    @Get()
    async DownloadFile(@Query('url') url: string, @Res() res: Response){
        if (!url){
            throw new BadRequestException('Query parameter "url" is required');
        }
        await this.downloadService.streamFile(url, res);
    }
}
