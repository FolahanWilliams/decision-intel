<?php

namespace Tidda\ImageResizer\Console\Commands;

use Illuminate\Console\Command;
use Jcupitt\Vips\Image;
use Jcupitt\Vips\Exception;

class ImageResizeCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'image:resize
                            {source : The path to the directory containing source images}
                            {destination : The path to the directory where resized images will be saved}
                            {--width= : The output width (default from config)}
                            {--height= : The output height (default from config)}
                            {--upscale= : Whether to upscale small images (true/false, default from config)}
                            {--padding= : Whether to use padding ("contain" vs "cover") (true/false, default from config)}
                            {--format= : The output image format (webp, jpg, png, tga, tiff, default from config)}
                            {--quality= : The output quality (1-100, default from config)}
                            {--lossless= : Use lossless compression (true/false, default from config)}
                            {--remove-source= : Remove source file if the format changes (true/false, default from config)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Quickly resizes images using libvips in a multi-threaded manner.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $sourceDir = $this->argument('source');
        $destinationDir = $this->argument('destination');

        if (!is_dir($sourceDir)) {
            $this->error("Source directory not found: $sourceDir");
            return 1;
        }

        if (!is_dir($destinationDir)) {
            if (!mkdir($destinationDir, 0777, true)) {
                $this->error("Could not create destination directory: $destinationDir");
                return 1;
            }
        }

        $config = config('imageresizer');
        $width = (int) ($this->option('width') ?? $config['defaultWidth']);
        $height = (int) ($this->option('height') ?? $config['defaultHeight']);
        $upscale = filter_var($this->option('upscale') ?? $config['defaultUpscale'], FILTER_VALIDATE_BOOLEAN);
        $padding = filter_var($this->option('padding') ?? $config['defaultPadding'], FILTER_VALIDATE_BOOLEAN);
        $format = $this->option('format') ?? $config['defaultFormat'];
        $quality = (int) ($this->option('quality') ?? $config['defaultQuality']);
        $lossless = filter_var($this->option('lossless') ?? $config['defaultLossless'], FILTER_VALIDATE_BOOLEAN);
        $removeSource = filter_var($this->option('remove-source') ?? $config['removeSource'], FILTER_VALIDATE_BOOLEAN);

        $allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'tiff', 'tif', 'tga'];
        
        $files = array_filter(scandir($sourceDir), function ($file) use ($sourceDir, $allowedExtensions) {
            $path = $sourceDir . DIRECTORY_SEPARATOR . $file;
            return is_file($path) && in_array(strtolower(pathinfo($path, PATHINFO_EXTENSION)), $allowedExtensions);
        });

        if (empty($files)) {
            $this->info("No images found in $sourceDir. Exiting.");
            return 0;
        }

        $this->info("Resizing " . count($files) . " images to $width x $height ($format format)...");

        $bar = $this->output->createProgressBar(count($files));
        $bar->start();

        foreach ($files as $file) {
            $sourcePath = $sourceDir . DIRECTORY_SEPARATOR . $file;
            $destinationPath = $destinationDir . DIRECTORY_SEPARATOR . pathinfo($file, PATHINFO_FILENAME) . '.' . $format;
            
            $imgData = [
                'source' => $sourcePath,
                'destination' => $destinationPath,
                'width' => $width,
                'height' => $height,
                'upscale' => $upscale,
                'padding' => $padding,
                'format' => $format,
                'quality' => $quality,
                'lossless' => $lossless,
                'remove_source' => $removeSource,
            ];

            try {
                $this->processImage($imgData);
            } catch (\Exception $e) {
                $this->error("\nError processing $file: " . $e->getMessage());
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info("All images processed successfully!");

        return 0;
    }

    /**
     * Resizes and saves the image.
     */
    protected function processImage(array $data): void
    {
        try {
            // Load the image and auto-rotate based on EXIF tag
            $image = Image::newFromFile($data['source'])->autorot();

            // Perform thumbnail calculation (efficient resize + crop/pad)
            // 'crop' parameter in VIPS's thumbnail:
            // - 'centre' works like background-size: cover (fills the area)
            // - 'none' works like background-size: contain (fits within the area)
            $vipsCrop = $data['padding'] ? 'none' : 'centre';

            $image = $image->thumbnail_image($data['width'], [
                'height' => $data['height'],
                'size' => $data['upscale'] ? 'both' : 'down',
                'crop' => $vipsCrop
            ]);

            // For padding (contain), we need to manually add the background
            if ($data['padding']) {
                $image = $this->addPadding($image, $data['width'], $data['height']);
            }

            // Construct the write options
            $options = [];
            if ($data['format'] === 'webp' || $data['format'] === 'jpg' || $data['format'] === 'jpeg') {
                $options['Q'] = $data['quality'];
            }
            if ($data['format'] === 'webp' || $data['format'] === 'png') {
                $options['lossless'] = $data['lossless'];
            }

            // Save to the destination path
            $saveMethod = $this->getSaveMethod($data['format']);
            $image->$saveMethod($data['destination'], $options);

            // Cleanup if requested and extensions changed
            if ($data['remove_source'] && pathinfo($data['source'], PATHINFO_EXTENSION) !== $data['format']) {
                unlink($data['source']);
            }
        } catch (Exception $e) {
            throw new \Exception("VIPS error: " . $e->getMessage());
        }
    }

    /**
     * Adds padding to the image (Letterboxing).
     */
    protected function addPadding(Image $image, int $targetWidth, int $targetHeight): Image
    {
        $currentWidth = $image->width;
        $currentHeight = $image->height;

        $left = (int) floor(($targetWidth - $currentWidth) / 2);
        $top = (int) floor(($targetHeight - $currentHeight) / 2);

        // Define padding background color based on whether the image has transparency
        // Default color: white [255, 255, 255] or transparent [0, 0, 0, 0]
        $background = $image->hasAlpha() ? [0, 0, 0, 0] : [255, 255, 255];

        return $image->embed($left, $top, $targetWidth, $targetHeight, [
            'extend' => 'background',
            'background' => $background
        ]);
    }

    /**
     * Determines the appropriate VIPS save method based on format.
     */
    protected function getSaveMethod(string $format): string
    {
        return match (strtolower($format)) {
            'webp' => 'webpsave',
            'jpg', 'jpeg' => 'jpegsave',
            'png' => 'pngsave',
            'tga' => 'tgasave',
            'tiff' => 'tiffsave',
            default => 'webpsave',
        };
    }
}
