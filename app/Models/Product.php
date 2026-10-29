<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    public $incrementing = false; // String IDs (lg-1, rt-1)
    protected $keyType = 'string';

    protected $fillable = [
        'id', 'cat_slug', 'name', 'price', 'was', 'stock', 'tag', 'img', 'note'
    ];

    protected $casts = [
        'price' => 'float',
        'was' => 'float',
        'stock' => 'integer',
    ];

    public function category()
    {
        return $this->belongsTo(Category::class, 'cat_slug', 'slug');
    }
}