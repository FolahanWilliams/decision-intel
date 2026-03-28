<?php

namespace Tidda\ImageResizer;

use Illuminate\Support\ServiceProvider;
use Tidda\ImageResizer\Console\Commands\ImageResizeCommand;

class ImageResizerServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap services.
     *
     * @return void
     */
    public function boot()
    {
        if ($this->app->runningInConsole()) {
            $this->commands([
                ImageResizeCommand::class,
            ]);

            $this->publishes([
                __DIR__ . '/../config/imageresizer.php' => config_path('imageresizer.php'),
            ], 'config');
        }
    }

    /**
     * Register any application services.
     *
     * @return void
     */
    public function register()
    {
        $this->mergeConfigFrom(__DIR__ . '/../config/imageresizer.php', 'imageresizer');
    }
}
