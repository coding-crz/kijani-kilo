<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    use HasFactory;

    protected $fillable = [
        'slug', 'name', 'tint', 'photos', 'unit', 'step', 'chips', 'blurb'
    ];

    protected $casts = [
        'photos' => 'boolean',
        'chips' => 'array',
        'step' => 'float',
    ];

    public function products()
    {
        return $this->hasMany(Product::class, 'cat_slug', 'slug');
    }
}