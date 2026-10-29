<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique(); // leafy-greens, root-vegetables, etc.
            $table->string('name');
            $table->string('tint'); // e.g. #E6F6EE
            $table->boolean('photos')->default(true);
            $table->string('unit')->default('kg'); // kg or basket
            $table->decimal('step', 5, 2)->default(0.5);
            $table->json('chips'); // [0.5, 1, 2, 5]
            $table->text('blurb');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('categories');
    }
};