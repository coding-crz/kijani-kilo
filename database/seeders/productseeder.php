<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'slug' => 'leafy-greens', 'name' => 'Leafy greens', 'tint' => '#E6F6EE', 'photos' => true,
                'unit' => 'kg', 'step' => 0.5, 'chips' => [0.5, 1, 2, 5], 'blurb' => 'Picked fresh and sold by the kilo.'
            ],
            [
                'slug' => 'root-vegetables', 'name' => 'Root vegetables', 'tint' => '#FFF1DE', 'photos' => true,
                'unit' => 'kg', 'step' => 0.5, 'chips' => [0.5, 1, 2, 5], 'blurb' => 'Hearty roots for stews, roasts and mash.'
            ],
            [
                'slug' => 'fruit-vegetables', 'name' => 'Fruit vegetables', 'tint' => '#FFE8E4', 'photos' => true,
                'unit' => 'kg', 'step' => 0.5, 'chips' => [0.5, 1, 2, 5], 'blurb' => 'Tomatoes, peppers, pumpkins and beans.'
            ],
            [
                'slug' => 'herbs', 'name' => 'Herbs', 'tint' => '#EAF6D0', 'photos' => true,
                'unit' => 'kg', 'step' => 0.25, 'chips' => [0.25, 0.5, 1], 'blurb' => 'A little goes a long way. Sold from a quarter kilo.'
            ],
            [
                'slug' => 'onions-garlic', 'name' => 'Onions & garlic', 'tint' => '#F1E9F7', 'photos' => true,
                'unit' => 'kg', 'step' => 0.5, 'chips' => [0.5, 1, 2, 5], 'blurb' => 'Onions, garlic, ginger and the flavour makers.'
            ],
            [
                'slug' => 'baskets', 'name' => 'Ready-made baskets', 'tint' => '#F6EFD9', 'photos' => true,
                'unit' => 'basket', 'step' => 1.0, 'chips' => [], 'blurb' => 'Shop once, cook all week. One price per basket.'
            ],
        ];

        foreach ($categories as $cat) {
            Category::updateOrCreate(['slug' => $cat['slug']], $cat);
        }

        // Example catalog items matching KK_PRODUCTS
        $sampleProducts = [
            ['id' => 'lg-16', 'cat_slug' => 'leafy-greens', 'name' => 'Sukuma wiki', 'price' => 60, 'stock' => 150, 'tag' => 'best', 'img' => 'sukumawiki', 'was' => 0, 'note' => ''],
            ['id' => 'lg-15', 'cat_slug' => 'leafy-greens', 'name' => 'Spinach', 'price' => 80, 'stock' => 6, 'tag' => 'best', 'img' => 'spinach', 'was' => 0, 'note' => ''],
            ['id' => 'fv-1', 'cat_slug' => 'fruit-vegetables', 'name' => 'Tomatoes', 'price' => 120, 'stock' => 80, 'tag' => 'best', 'img' => 'tomatoes', 'was' => 0, 'note' => ''],
            ['id' => 'og-1', 'cat_slug' => 'onions-garlic', 'name' => 'Red onions', 'price' => 100, 'stock' => 200, 'tag' => 'best', 'img' => 'redonions', 'was' => 0, 'note' => ''],
            ['id' => 'bk-1', 'cat_slug' => 'baskets', 'name' => 'Weekly Family Box', 'price' => 1450, 'stock' => 15, 'tag' => 'best', 'img' => 'basket1', 'was' => 0, 'note' => 'Tomatoes, onions, kale, cabbage, carrots, potatoes'],
        ];

        foreach ($sampleProducts as $p) {
            Product::updateOrCreate(['id' => $p['id']], $p);
        }
    }
}