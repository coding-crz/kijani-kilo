<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->string('id')->primary(); // lg-1, rt-1, bk-1
            $table->foreignId('category_id')->nullable(); 
            $table->string('cat_slug'); // leafy-greens, etc.
            $table->string('name');
            $table->decimal('price', 10, 2);
            $table->decimal('was', 10, 2)->default(0); // old price for offers
            $table->integer('stock')->default(0);
            $table->string('tag')->nullable(); // fresh, best, offer, organic, new
            $table->string('img')->nullable(); // image filename without extension
            $table->text('note')->nullable(); // basket contents description
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};