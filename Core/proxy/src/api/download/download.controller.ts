import { Controller, Get } from '@nestjs/common';

@Controller('download')
export class DownloadController {
    @Get('ping')
    Ping(): string{
        return 'echochamber brr';
    };
}
